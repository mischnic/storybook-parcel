"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPreviewAnnotation = void 0;
const path_1 = require("path");
const slash_1 = __importDefault(require("slash"));
const transform_abs_path_1 = require("./transform-abs-path");
/**
 * Preview annotations can take several forms, and vite needs them to be
 * a bit more restrained.
 *
 * For node_modules, we want bare imports (so vite can process them),
 * and for files in the user's source,
 * we want absolute paths.
 */
function processPreviewAnnotation(path) {
    // If entry is an object, take the first, which is the
    // bare (non-absolute) specifier.
    // This is so that webpack can use an absolute path, and
    // continue supporting super-addons in pnp/pnpm without
    // requiring them to re-export their sub-addons as we do
    // in addon-essentials.
    if (typeof path === 'object') {
        return path.bare;
    }
    // resolve relative paths into absolute paths, but don't resolve "bare" imports
    if (path?.startsWith('./') || path?.startsWith('../')) {
        return (0, slash_1.default)((0, path_1.resolve)(path));
    }
    // This should not occur, since we use `.filter(Boolean)` prior to
    // calling this function, but this makes typescript happy
    if (!path) {
        throw new Error('Could not determine path for previewAnnotation');
    }
    // For addon dependencies that use require.resolve(), we need to convert to a bare path
    // so that vite will process it as a dependency (cjs -> esm, etc).
    if (path.includes('node_modules')) {
        return (0, transform_abs_path_1.transformAbsPath)(path);
    }
    return (0, slash_1.default)(path);
}
exports.processPreviewAnnotation = processPreviewAnnotation;
