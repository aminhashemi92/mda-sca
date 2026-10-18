const UAParser = require("ua-parser-js");

function deviceFamily(userAgent) {
  const parsed = new UAParser(userAgent);
  return {
    browser: parsed.getBrowser().name || "unknown",
    os: parsed.getOS().name || "unknown",
  };
}

module.exports = { deviceFamily };
