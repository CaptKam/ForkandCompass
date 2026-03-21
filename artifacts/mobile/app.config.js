const appJson = require("./app.json");

module.exports = ({ config }) => ({
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl: process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "",
  },
});
