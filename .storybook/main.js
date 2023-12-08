import { dirname, join } from "path";
const path = require("path");
module.exports = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],

  // framework: "@storybook/react-webpack5",
  // framework: "@storybook/react-vite",
  framework: getAbsolutePath("storybook-react-parcel"),
  // features: {
  //   storyStoreV7: false,
  // },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
