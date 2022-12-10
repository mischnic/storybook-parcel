"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripStoryHMRBoundary = void 0;
const vite_1 = require("vite");
const magic_string_1 = __importDefault(require("magic-string"));
/**
 * This plugin removes HMR `accept` calls in story files.  Stories should not be treated
 * as hmr boundaries, but vite has a bug which causes them to be treated as boundaries
 * (https://github.com/vitejs/vite/issues/9869).
 */
function stripStoryHMRBoundary() {
    const filter = (0, vite_1.createFilter)(/\.stories\.([tj])sx?$/);
    return {
        name: 'storybook:strip-hmr-boundary-plugin',
        enforce: 'post',
        async transform(src, id) {
            if (!filter(id))
                return undefined;
            const s = new magic_string_1.default(src);
            s.replace(/import\.meta\.hot\.accept\(\);/, '');
            return {
                code: s.toString(),
                map: s.generateMap({ hires: true, source: id }),
            };
        },
    };
}
exports.stripStoryHMRBoundary = stripStoryHMRBoundary;
