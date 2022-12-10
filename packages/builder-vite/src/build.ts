import { build as viteBuild, mergeConfig } from 'vite';
import { commonConfig } from './vite-config';

import type { ExtendedOptions } from './types';
import { sanitizeEnvVars } from './envs';

export async function build(options: ExtendedOptions) {
  const { presets } = options;

  const config = await commonConfig(options, 'build');
  config.build = mergeConfig(config, {
    build: {
      outDir: options.outputDir,
      emptyOutDir: false, // do not clean before running Vite build - Storybook has already added assets in there!
      sourcemap: true,
      rollupOptions: {
        // Do not try to bundle the storybook runtime, it is copied into the output dir after the build.
        external: ['/sb-preview/runtime.mjs'],
      },
    },
  }).build;

  const finalConfig = await presets.apply('viteFinal', config, options);

  await viteBuild(await sanitizeEnvVars(options, finalConfig));
}
