import { dirname, join } from "path";
const path = require("path");
module.exports = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: getAbsolutePath("storybook-react-parcel"),
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
