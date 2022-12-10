"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csfPlugin = void 0;
const csf_plugin_1 = require("@storybook/csf-plugin");
async function csfPlugin(config) {
    const { presets } = config;
    const addons = await presets.apply('addons', []);
    const docsOptions = 
    // @ts-expect-error - not sure what type to use here
    addons.find((a) => [a, a.name].includes('@storybook/addon-docs'))?.options ?? {};
    return (0, csf_plugin_1.vite)(docsOptions?.csfPluginOptions);
}
exports.csfPlugin = csfPlugin;
