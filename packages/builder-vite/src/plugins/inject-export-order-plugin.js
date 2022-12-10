"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectExportOrderPlugin = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const magic_string_1 = __importDefault(require("magic-string"));
const vite_1 = require("vite");
const include = [/\.stories\.([tj])sx?$/, /(stories|story).mdx$/];
const filter = (0, vite_1.createFilter)(include);
exports.injectExportOrderPlugin = {
    name: 'storybook:inject-export-order-plugin',
    // This should only run after the typescript has been transpiled
    enforce: 'post',
    async transform(code, id) {
        if (!filter(id))
            return undefined;
        // TODO: Maybe convert `injectExportOrderPlugin` to function that returns object,
        //  and run `await init;` once and then call `parse()` without `await`,
        //  instead of calling `await parse()` every time.
        const [, exports] = await (0, es_module_lexer_1.parse)(code);
        if (exports.includes('__namedExportsOrder')) {
            // user has defined named exports already
            return undefined;
        }
        const s = new magic_string_1.default(code);
        const orderedExports = exports.filter((e) => e !== 'default');
        s.append(`;export const __namedExportsOrder = ${JSON.stringify(orderedExports)};`);
        return {
            code: s.toString(),
            map: s.generateMap({ hires: true, source: id }),
        };
    },
};
