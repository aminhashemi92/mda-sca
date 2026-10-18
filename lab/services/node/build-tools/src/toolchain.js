const crossEnv = require("cross-env");
const yargs = require("yargs/yargs");
const y18n = require("y18n");
const async = require("async");
const lodash = require("lodash");
const hostedGitInfo = require("hosted-git-info");
const shellQuote = require("shell-quote");
const { Netmask } = require("netmask");
const ansiRegex = require("ansi-regex");
const nthCheck = require("nth-check");
const globParent = require("glob-parent");
const minimatch = require("minimatch");

function parseArgs(argv) {
  return yargs(argv).option("config", { type: "string", default: "lab.json" }).parse();
}

function message(key) {
  const linguist = y18n({ directory: "locales", updateFiles: false, locale: "en" });
  return linguist.__(key);
}

function mergeDefaults(extra) {
  return lodash.merge({ region: "teh", lane: "a" }, extra || {});
}

function runPair(left, right) {
  return new Promise((resolve, reject) => {
    async.parallel(
      [
        (done) => done(null, left),
        (done) => done(null, right),
      ],
      (error, results) => (error ? reject(error) : resolve(results))
    );
  });
}

function repoOf(spec) {
  return hostedGitInfo.fromUrl(spec);
}

function quote(args) {
  return shellQuote.quote(args);
}

function inLabNetwork(address) {
  return new Netmask("10.8.0.0/16").contains(address);
}

function stripAnsi(text) {
  return String(text).replace(ansiRegex(), "");
}

function oddRows() {
  return nthCheck("2n+1");
}

function patternRoot(pattern) {
  return globParent(pattern);
}

function included(path, pattern) {
  return minimatch(path, pattern);
}

function envBridge() {
  return typeof crossEnv === "function" || typeof crossEnv === "object";
}

module.exports = {
  parseArgs,
  message,
  mergeDefaults,
  runPair,
  repoOf,
  quote,
  inLabNetwork,
  stripAnsi,
  oddRows,
  patternRoot,
  included,
  envBridge,
};
