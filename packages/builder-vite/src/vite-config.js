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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginConfig = exports.commonConfig = void 0;
const path = __importStar(require("path"));
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const rollup_plugin_external_globals_1 = __importDefault(require("rollup-plugin-external-globals"));
const core_common_1 = require("@storybook/core-common");
const globals_1 = require("@storybook/preview/globals");
const plugins_1 = require("./plugins");
const configEnvServe = {
    mode: 'development',
    command: 'serve',
    ssrBuild: false,
};
const configEnvBuild = {
    mode: 'production',
    command: 'build',
    ssrBuild: false,
};
// Vite config that is common to development and production mode
async function commonConfig(options, _type) {
    const configEnv = _type === 'development' ? configEnvServe : configEnvBuild;
    // I destructure away the `build` property from the user's config object
    // I do this because I can contain config that breaks storybook, such as we had in a lit project.
    // If the user needs to configure the `build` they need to do so in the viteFinal function in main.js.
    const { config: { build: buildProperty = undefined, ...userConfig } = {} } = (await (0, vite_1.loadConfigFromFile)(configEnv)) ?? {};
    const sbConfig = {
        configFile: false,
        cacheDir: 'node_modules/.cache/.vite-storybook',
        root: path.resolve(options.configDir, '..'),
        // Allow storybook deployed as subfolder.  See https://github.com/storybookjs/builder-vite/issues/238
        base: './',
        plugins: await pluginConfig(options),
        resolve: {
            preserveSymlinks: (0, core_common_1.isPreservingSymlinks)(),
            alias: {
                assert: require.resolve('browser-assert'),
            },
        },
        // If an envPrefix is specified in the vite config, add STORYBOOK_ to it,
        // otherwise, add VITE_ and STORYBOOK_ so that vite doesn't lose its default.
        envPrefix: userConfig.envPrefix ? 'STORYBOOK_' : ['VITE_', 'STORYBOOK_'],
    };
    const config = (0, vite_1.mergeConfig)(userConfig, sbConfig);
    return config;
}
exports.commonConfig = commonConfig;
async function pluginConfig(options) {
    const frameworkName = await (0, core_common_1.getFrameworkName)(options);
    const plugins = [
        (0, plugins_1.codeGeneratorPlugin)(options),
        await (0, plugins_1.csfPlugin)(options),
        (0, plugins_1.mdxPlugin)(options),
        plugins_1.injectExportOrderPlugin,
        (0, plugins_1.stripStoryHMRBoundary)(),
        {
            name: 'storybook:allow-storybook-dir',
            enforce: 'post',
            config(config) {
                // if there is NO allow list then Vite allows anything in the root directory
                // if there is an allow list then Vite only allows anything in the listed directories
                // add storybook specific directories only if there's an allow list so that we don't end up
                // disallowing the root unless root is already disallowed
                if (config?.server?.fs?.allow) {
                    config.server.fs.allow.push('.storybook');
                }
            },
        },
        (0, rollup_plugin_external_globals_1.default)(globals_1.globals),
    ];
    // We need the react plugin here to support MDX in non-react projects.
    if (frameworkName !== '@storybook/react-vite') {
        plugins.push((0, plugin_react_1.default)({ exclude: [/\.stories\.([tj])sx?$/, /node_modules/, /\.([tj])sx?$/] }));
    }
    // TODO: framework doesn't exist, should move into framework when/if built
    if (frameworkName === '@storybook/preact-vite') {
        // eslint-disable-next-line global-require
        plugins.push(require('@preact/preset-vite').default());
    }
    // TODO: framework doesn't exist, should move into framework when/if built
    if (frameworkName === '@storybook/glimmerx-vite') {
        // eslint-disable-next-line global-require, import/extensions
        const plugin = require('vite-plugin-glimmerx/index.cjs');
        plugins.push(plugin.default());
    }
    return plugins;
}
exports.pluginConfig = pluginConfig;
