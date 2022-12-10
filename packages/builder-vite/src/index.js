"use strict";
// noinspection JSUnusedGlobalSymbols
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
exports.build = exports.start = exports.bail = exports.withoutVitePlugins = void 0;
const fs = __importStar(require("fs-extra"));
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const transform_iframe_html_1 = require("./transform-iframe-html");
const vite_server_1 = require("./vite-server");
const build_1 = require("./build");
var without_vite_plugins_1 = require("./utils/without-vite-plugins");
Object.defineProperty(exports, "withoutVitePlugins", { enumerable: true, get: function () { return without_vite_plugins_1.withoutVitePlugins; } });
function iframeMiddleware(options, server) {
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
        const indexHtml = await fs.readFile(require.resolve('@storybook/builder-vite/input/iframe.html'), 'utf-8');
        const generated = await (0, transform_iframe_html_1.transformIframeHtml)(indexHtml, options);
        const transformed = await server.transformIndexHtml('/iframe.html', generated);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(transformed);
    };
}
let server;
async function bail(e) {
    try {
        return await server.close();
    }
    catch (err) {
        console.warn('unable to close vite server');
    }
    throw e;
}
exports.bail = bail;
const start = async ({ startTime, options, router, server: devServer, }) => {
    server = await (0, vite_server_1.createViteServer)(options, devServer);
    const previewResolvedDir = (0, path_1.dirname)(require.resolve('@storybook/preview/package.json'));
    const previewDirOrigin = (0, path_1.join)(previewResolvedDir, 'dist');
    router.use(`/sb-preview`, express_1.default.static(previewDirOrigin, { immutable: true, maxAge: '5m' }));
    router.use(iframeMiddleware(options, server));
    router.use(server.middlewares);
    return {
        bail,
        stats: { toJson: () => null },
        totalTime: process.hrtime(startTime),
    };
};
exports.start = start;
const build = async ({ options }) => {
    const viteCompilation = (0, build_1.build)(options);
    const previewResolvedDir = (0, path_1.dirname)(require.resolve('@storybook/preview/package.json'));
    const previewDirOrigin = (0, path_1.join)(previewResolvedDir, 'dist');
    const previewDirTarget = (0, path_1.join)(options.outputDir || '', `sb-preview`);
    const previewFiles = fs.copy(previewDirOrigin, previewDirTarget, {
        filter: (src) => {
            const { ext } = (0, path_1.parse)(src);
            if (ext) {
                return ext === '.mjs';
            }
            return true;
        },
    });
    const [out] = await Promise.all([viteCompilation, previewFiles]);
    return out;
};
exports.build = build;
