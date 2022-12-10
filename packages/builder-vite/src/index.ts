// noinspection JSUnusedGlobalSymbols

import * as fs from 'fs-extra';
import type { Builder, StorybookConfig as StorybookBaseConfig, Options } from '@storybook/types';
import type { RequestHandler } from 'express';
import type { InlineConfig, UserConfig, ViteDevServer } from 'vite';
import express from 'express';
import { dirname, join, parse } from 'path';
import { transformIframeHtml } from './transform-iframe-html';
import { createViteServer } from './vite-server';
import { build as viteBuild } from './build';
import type { ExtendedOptions } from './types';

export { withoutVitePlugins } from './utils/without-vite-plugins';

// TODO remove
export type { TypescriptOptions } from '@storybook/types';

// Storybook's Stats are optional Webpack related property
export type ViteStats = {
  toJson: () => any;
};

export type ViteBuilder = Builder<UserConfig, ViteStats>;

export type ViteFinal = (
  config: InlineConfig,
  options: Options
) => InlineConfig | Promise<InlineConfig>;

export type StorybookConfig = StorybookBaseConfig & {
  viteFinal?: ViteFinal;
};

/**
 * @deprecated
 *
 * Use `import { StorybookConfig } from '@storybook/builder-vite';`
 *
 * Or better yet, import from your framework.
 */
export type StorybookViteConfig = StorybookConfig;

function iframeMiddleware(options: ExtendedOptions, server: ViteDevServer): RequestHandler {
  return async (req, res, next) => {
    if (!req.url.match(/^\/iframe\.html($|\?)/)) {
      next();
      return;
    }

    // We need to handle `html-proxy` params for style tag HMR https://github.com/storybookjs/builder-vite/issues/266#issuecomment-1055677865
    // e.g. /iframe.html?html-proxy&index=0.css
    if (req.query['html-proxy'] !== undefined) {
      next();
      return;
    }

    const indexHtml = await fs.readFile(
      require.resolve('@storybook/builder-vite/input/iframe.html'),
      'utf-8'
    );
    const generated = await transformIframeHtml(indexHtml, options);
    const transformed = await server.transformIndexHtml('/iframe.html', generated);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(transformed);
  };
}

let server: ViteDevServer;

export async function bail(e?: Error): Promise<void> {
  try {
    return await server.close();
  } catch (err) {
    console.warn('unable to close vite server');
  }

  throw e;
}

export const start: ViteBuilder['start'] = async ({
  startTime,
  options,
  router,
  server: devServer,
}) => {
  server = await createViteServer(options as ExtendedOptions, devServer);

  const previewResolvedDir = dirname(require.resolve('@storybook/preview/package.json'));
  const previewDirOrigin = join(previewResolvedDir, 'dist');

  router.use(`/sb-preview`, express.static(previewDirOrigin, { immutable: true, maxAge: '5m' }));

  router.use(iframeMiddleware(options as ExtendedOptions, server));
  router.use(server.middlewares);

  return {
    bail,
    stats: { toJson: () => null },
    totalTime: process.hrtime(startTime),
  };
};

export const build: ViteBuilder['build'] = async ({ options }) => {
  const viteCompilation = viteBuild(options as ExtendedOptions);

  const previewResolvedDir = dirname(require.resolve('@storybook/preview/package.json'));
  const previewDirOrigin = join(previewResolvedDir, 'dist');
  const previewDirTarget = join(options.outputDir || '', `sb-preview`);

  const previewFiles = fs.copy(previewDirOrigin, previewDirTarget, {
    filter: (src) => {
      const { ext } = parse(src);
      if (ext) {
        return ext === '.mjs';
      }
      return true;
    },
  });

  const [out] = await Promise.all([viteCompilation, previewFiles]);

  return out;
};
