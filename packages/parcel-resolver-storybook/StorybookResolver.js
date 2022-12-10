const path = require("path");
const { Resolver } = require("@parcel/plugin");
const reactVersion = require("react-dom/package.json").version;
const { default: NodeResolver } = require("@parcel/node-resolver-core");

module.exports = new Resolver({
  async resolve({ dependency, options, specifier, logger }) {
    // Workaround for interop issue
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
    }

    // Workaround for pkg#exports support
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
