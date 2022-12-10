"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeEnvVars = exports.stringifyProcessEnvs = void 0;
const core_common_1 = require("@storybook/core-common");
// Allowed env variables on the client
const allowedEnvVariables = [
    'STORYBOOK',
    // Vite `import.meta.env` default variables
    // @see https://github.com/vitejs/vite/blob/6b8d94dca2a1a8b4952e3e3fcd0aed1aedb94215/packages/vite/types/importMeta.d.ts#L68-L75
    'BASE_URL',
    'MODE',
    'DEV',
    'PROD',
    'SSR',
];
/**
 * Customized version of stringifyProcessEnvs from @storybook/core-common which
 * uses import.meta.env instead of process.env and checks for allowed variables.
 */
function stringifyProcessEnvs(raw, envPrefix) {
    const updatedRaw = {};
    const envs = Object.entries(raw).reduce((acc, [key, value]) => {
        // Only add allowed values OR values from array OR string started with allowed prefixes
        if (allowedEnvVariables.includes(key) ||
            (Array.isArray(envPrefix) && !!envPrefix.find((prefix) => key.startsWith(prefix))) ||
            (typeof envPrefix === 'string' && key.startsWith(envPrefix))) {
            acc[`import.meta.env.${key}`] = JSON.stringify(value);
            updatedRaw[key] = value;
        }
        return acc;
    }, {});
    // support destructuring like
    // const { foo } = import.meta.env;
    envs['import.meta.env'] = JSON.stringify((0, core_common_1.stringifyEnvs)(updatedRaw));
    return envs;
}
exports.stringifyProcessEnvs = stringifyProcessEnvs;
// Sanitize environment variables if needed
async function sanitizeEnvVars(options, config) {
    const { presets } = options;
    const envsRaw = await presets.apply('env');
    let { define } = config;
    if (Object.keys(envsRaw).length) {
        // Stringify env variables after getting `envPrefix` from the  config
        const envs = stringifyProcessEnvs(envsRaw, config.envPrefix);
        define = {
            ...define,
            ...envs,
        };
    }
    return {
        ...config,
        define,
    };
}
exports.sanitizeEnvVars = sanitizeEnvVars;
