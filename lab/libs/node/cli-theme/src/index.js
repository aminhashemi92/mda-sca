const colors = require("colors");

function label(text) {
  return colors.cyan(String(text));
}

function warn(text) {
  return colors.yellow(String(text));
}

module.exports = { label, warn };
