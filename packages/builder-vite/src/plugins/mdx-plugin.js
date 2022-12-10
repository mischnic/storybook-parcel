"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mdxPlugin = void 0;
const vite_1 = require("vite");
const isStorybookMdx = (id) => id.endsWith('stories.mdx') || id.endsWith('story.mdx');
function injectRenderer(code) {
    return `
           import React from 'react';
           ${code}
           `;
}
/**
 * Storybook uses two different loaders when dealing with MDX:
 *
 * - *stories.mdx and *story.mdx are compiled with the CSF compiler
 * - *.mdx are compiled with the MDX compiler directly
 *
 * @see https://github.com/storybookjs/storybook/blob/next/addons/docs/docs/recipes.md#csf-stories-with-arbitrary-mdx
 */
function mdxPlugin(options) {
    let reactRefresh;
    const include = /\.mdx?$/;
    const filter = (0, vite_1.createFilter)(include);
    return {
        name: 'storybook:mdx-plugin',
        enforce: 'pre',
        configResolved({ plugins }) {
            // @vitejs/plugin-react-refresh has been upgraded to @vitejs/plugin-react,
            // and the name of the plugin performing `transform` has been changed from 'react-refresh' to 'vite:react-babel',
            // to be compatible, we need to look for both plugin name.
            // We should also look for the other plugins names exported from @vitejs/plugin-react in case there are some internal refactors.
            const reactRefreshPlugins = plugins.filter((p) => p.name === 'react-refresh' ||
                p.name === 'vite:react-babel' ||
                p.name === 'vite:react-refresh' ||
                p.name === 'vite:react-jsx');
            reactRefresh = reactRefreshPlugins.find((p) => p.transform);
        },
        async transform(src, id, transformOptions) {
            if (!filter(id))
                return undefined;
            const { compile } = await Promise.resolve().then(() => __importStar(require('@storybook/mdx2-csf')));
            const mdxLoaderOptions = await options.presets.apply('mdxLoaderOptions', {
                mdxCompileOptions: {
                    providerImportSource: '@storybook/addon-docs/mdx-react-shim',
                },
            });
            const mdxCode = String(await compile(src, {
                skipCsf: !isStorybookMdx(id),
                ...mdxLoaderOptions,
            }));
            const modifiedCode = injectRenderer(mdxCode);
            // Hooks in recent rollup versions can be functions or objects, and though react hasn't changed, the typescript defs have
            const rTransform = reactRefresh?.transform;
            const transform = rTransform && 'handler' in rTransform ? rTransform.handler : rTransform;
            // It's safe to disable this, because we know it'll be there, since we added it ourselves.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = await transform.call(this, modifiedCode, `${id}.jsx`, transformOptions);
            if (!result)
                return modifiedCode;
            if (typeof result === 'string')
                return result;
            const { code, map: resultMap } = result;
            return {
                code,
                map: !resultMap || typeof resultMap === 'string' ? resultMap : { ...resultMap, sources: [id] },
            };
        },
    };
}
exports.mdxPlugin = mdxPlugin;
