"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIframeScriptCode = void 0;
const core_common_1 = require("@storybook/core-common");
const virtual_file_names_1 = require("./virtual-file-names");
const process_preview_annotation_1 = require("./utils/process-preview-annotation");
async function generateIframeScriptCode(options) {
    const { presets } = options;
    const rendererName = await (0, core_common_1.getRendererName)(options);
    const previewAnnotations = await presets.apply('previewAnnotations', [], options);
    const configEntries = [...previewAnnotations].filter(Boolean).map(process_preview_annotation_1.processPreviewAnnotation);
    const filesToImport = (files, name) => files.map((el, i) => `import ${name ? `* as ${name}_${i} from ` : ''}'${el}'`).join('\n');
    const importArray = (name, length) => new Array(length).fill(0).map((_, i) => `${name}_${i}`);
    // noinspection UnnecessaryLocalVariableJS
    /** @todo Inline variable and remove `noinspection` */
    // language=JavaScript
    const code = `
    // Ensure that the client API is initialized by the framework before any other iframe code
    // is loaded. That way our client-apis can assume the existence of the API+store
    import { configure } from '${rendererName}';

    import { logger } from '@storybook/client-logger';
    import * as clientApi from "@storybook/preview-api";
    ${filesToImport(configEntries, 'config')}

    import * as preview from '${virtual_file_names_1.virtualPreviewFile}';
    import { configStories } from '${virtual_file_names_1.virtualStoriesFile}';

    const {
      addDecorator,
      addParameters,
      addLoader,
      addArgs,
      addArgTypes,
      addStepRunner,
      addArgTypesEnhancer,
      addArgsEnhancer,
      setGlobalRender,
    } = previewApi;

    const configs = [${importArray('config', configEntries.length)
        .concat('preview.default')
        .join(',')}].filter(Boolean)

    configs.forEach(config => {
      Object.keys(config).forEach((key) => {
        const value = config[key];
        switch (key) {
          case 'args': {
            return addArgs(value);
          }
          case 'argTypes': {
            return addArgTypes(value);
          }
          case 'decorators': {
            return value.forEach((decorator) => addDecorator(decorator, false));
          }
          case 'loaders': {
            return value.forEach((loader) => addLoader(loader, false));
          }
          case 'parameters': {
            return addParameters({ ...value }, false);
          }
          case 'argTypesEnhancers': {
            return value.forEach((enhancer) => addArgTypesEnhancer(enhancer));
          }
          case 'argsEnhancers': {
            return value.forEach((enhancer) => addArgsEnhancer(enhancer))
          }
          case 'render': {
            return setGlobalRender(value)
          }
          case 'globals':
          case 'globalTypes': {
            const v = {};
            v[key] = value;
            return addParameters(v, false);
          }
          case 'decorateStory':
          case 'applyDecorators':
          case 'renderToDOM': // deprecated
          case 'renderToCanvas': {
            return null; // This key is not handled directly in v6 mode.
          }
          case 'runStep': {
            return addStepRunner(value);
          }
          default: {
            // eslint-disable-next-line prefer-template
            return console.log(key + ' was not supported :( !');
          }
        }
      });
    })
    
    /* TODO: not quite sure what to do with this, to fix HMR
    if (import.meta.hot) {
        import.meta.hot.accept();    
    }
    */

    configStories(configure);
    `.trim();
    return code;
}
exports.generateIframeScriptCode = generateIframeScriptCode;
