"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const vite_1 = require("vite");
const vite_config_1 = require("./vite-config");
const envs_1 = require("./envs");
async function build(options) {
    const { presets } = options;
    const config = await (0, vite_config_1.commonConfig)(options, 'build');
    config.build = (0, vite_1.mergeConfig)(config, {
        build: {
            outDir: options.outputDir,
            emptyOutDir: false,
            sourcemap: true,
            rollupOptions: {
                // Do not try to bundle the storybook runtime, it is copied into the output dir after the build.
                external: ['/sb-preview/runtime.mjs'],
            },
        },
    }).build;
    const finalConfig = await presets.apply('viteFinal', config, options);
    await (0, vite_1.build)(await (0, envs_1.sanitizeEnvVars)(options, finalConfig));
}
exports.build = build;
