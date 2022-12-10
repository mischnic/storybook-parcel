const path = require("path");
module.exports = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],

  // framework: "@storybook/react-webpack5",
  // framework: "@storybook/react-vite",
  framework: "storybook-react-parcel",
  // features: {
  //   storyStoreV7: false,
  // },
};
