const qs = require("qs");
const cookie = require("cookie");
const pathToRegexp = require("path-to-regexp");

function parseFilters(raw) {
  return qs.parse(raw, { ignoreQueryPrefix: true, depth: 5 });
}

function readSession(header) {
  const jar = cookie.parse(header || "");
  return jar.session || "";
}

function matchOrderPath(path) {
  const keys = [];
  const regexp = pathToRegexp("/orders/:id", keys);
  const matched = regexp.exec(path);
  if (!matched) {
    return null;
  }
  return { id: matched[1], keys: keys.map((key) => key.name) };
}

module.exports = { parseFilters, readSession, matchOrderPath };
