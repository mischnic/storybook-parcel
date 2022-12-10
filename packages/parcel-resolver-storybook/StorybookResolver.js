/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const path = require("path");
const { Resolver } = require("@parcel/plugin");
const reactVersion = require("react-dom/package.json").version;
const { default: NodeResolver } = require("@parcel/node-resolver-core");

// const virtualFileNames = require("forked-storybook-builder-vite/src/virtual-file-names.js");
// // const {
// //   generateVirtualStoryEntryCode,
// //   generatePreviewEntryCode,
// // } = require("forked-storybook-builder-vite/src/codegen-entries.js");

// const { loadPreviewOrConfigFile } = require("@storybook/core-common");
// async function generatePreviewEntryCode({ configDir }) {
//   const previewFile = loadPreviewOrConfigFile({ configDir });
//   if (!previewFile) return "";

//   return `import * as preview from '${
//     /*slash(*/ "./" + path.posix.relative(configDir, previewFile)
//   }';
//   export default preview;`;
// }

// const { listStories } = require("./list-stories.js");
// async function generateVirtualStoryEntryCode(options) {
//   const storyEntries = await listStories(options);
//   const resolveMap = storyEntries.reduce(
//     (prev, entry) => ({
//       ...prev,
//       [entry]: entry.replace(/*slash*/ process.cwd(), "."),
//     }),
//     {}
//   );

//   const modules = storyEntries
//     .map((entry, i) => `${JSON.stringify(entry)}: story_${i}`)
//     .join(",");

//   return `
//     ${absoluteFilesToImport(storyEntries, "story")}

//     function loadable(key) {
//       return {${modules}}[key];
//     }
    
//     Object.assign(loadable, {
//       keys: () => (${JSON.stringify(Object.keys(resolveMap))}),
//       resolve: (key) => (${JSON.stringify(resolveMap)}[key])
//     });

//     export function configStories(configure) {
//       configure(loadable, { hot: import.meta.hot }, false);
//     }
//   `.trim();
// }

module.exports = new Resolver({
  async resolve({ dependency, options, specifier, logger }) {
    // const sbConfigDir = path.resolve(__dirname, "..", "..", ".storybook");
    // switch (specifier) {
    //   case virtualFileNames.virtualPreviewFile: {
    //     let code = await generatePreviewEntryCode({ configDir: sbConfigDir });
    //     return {
    //       filePath: path.join(sbConfigDir, "preview.js"),
    //       code,
    //     };
    //   }
    //   case virtualFileNames.virtualFileId:
    //     break;
    //   case virtualFileNames.virtualStoriesFile: {
    //     // TODO if (storyStoreV7) {
    //     //   return generateImportFnScriptCode(options);
    //     // }
    //     let code = await generateVirtualStoryEntryCode(options);
    //     console.log(code);
    //     return {
    //       filePath: path.join(sbConfigDir, "preview.js"),
    //       code: "",
    //     };
    //     break;
    //   }
    //   case virtualFileNames.virtualAddonSetupFile:
    //     break;
    // }

    if (specifier === "react-dom/client") {
      let specifier = reactVersion.startsWith("18")
        ? "react-dom/client.js"
        : "react-dom/index.js";
      return {
        filePath: __dirname + "/react.js",
        code: `
        export * from '${specifier}';
        export * as default from '${specifier}'
        `,
      };
    } else if (specifier === "axe-core") {
      // Work around interop issue with ESM and CJS.
      return {
        filePath: __dirname + "/axe-core.js",
        code: `
        export * from 'axe-core/axe.js';
        export * as default from 'axe-core/axe.js'
        `,
      };
    }

    let rewritten;

    if (
      specifier.startsWith("@storybook/addon-essentials") &&
      specifier.endsWith("preview")
    ) {
      rewritten = specifier.replace(
        "@storybook/addon-essentials",
        "@storybook/addon-essentials/dist"
      );
    }

    if (rewritten) {
      const resolver = new NodeResolver({
        fs: options.inputFS,
        projectRoot: options.projectRoot,
        // Extensions are always required in URL dependencies.
        extensions:
          dependency.specifierType === "commonjs" ||
          dependency.specifierType === "esm"
            ? ["ts", "tsx", "mjs", "js", "jsx", "cjs", "json"]
            : [],
        mainFields: ["source", "browser", "module", "main"],
        packageManager: options.packageManager,
        shouldAutoInstall: options.shouldAutoInstall,
        logger,
      });

      return resolver.resolve({
        filename: rewritten,
        specifierType: dependency.specifierType,
        range: dependency.range,
        parent: dependency.resolveFrom,
        env: dependency.env,
        sourcePath: dependency.sourcePath,
        loc: dependency.loc,
      });
    }
  },
});
