"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createViteServer = void 0;
const vite_1 = require("vite");
const vite_config_1 = require("./vite-config");
const optimizeDeps_1 = require("./optimizeDeps");
const envs_1 = require("./envs");
async function createViteServer(options, devServer) {
    const { presets } = options;
    const commonCfg = await (0, vite_config_1.commonConfig)(options, 'development');
    const config = {
        ...commonCfg,
        // Set up dev server
        server: {
            middlewareMode: true,
            hmr: {
                port: options.port,
                server: devServer,
            },
            fs: {
                strict: true,
            },
        },
        appType: 'custom',
        optimizeDeps: await (0, optimizeDeps_1.getOptimizeDeps)(commonCfg, options),
    };
    const finalConfig = await presets.apply('viteFinal', config, options);
    return (0, vite_1.createServer)(await (0, envs_1.sanitizeEnvVars)(options, finalConfig));
}
exports.createViteServer = createViteServer;
