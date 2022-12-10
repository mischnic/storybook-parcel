const path = require("path");
const { promise: glob } = require("glob-promise");
const { normalizeStories } = require("@storybook/core-common");

module.exports.listStories = async function listStories(options) {
  return (
    await Promise.all(
      normalizeStories(await options.presets.apply("stories", [], options), {
        configDir: options.configDir,
        workingDir: options.configDir,
      }).map(({ directory, files }) => {
        const pattern = path.join(directory, files);

        return glob(
          path.isAbsolute(pattern)
            ? pattern
            : path.join(options.configDir, pattern),
          {
            follow: true,
          }
        );
      })
    )
  ).reduce((carry, stories) => carry.concat(stories), []);
};
