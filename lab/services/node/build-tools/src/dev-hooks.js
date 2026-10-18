const coa = require("coa");
const rc = require("rc");
const crossenv = require("crossenv");
const eslintScope = require("eslint-scope");
const ipc = require("node-ipc");
const peace = require("peacenotwar");

function buildCommand() {
  return coa.Cmd().name("lab-build").opt().name("config").end();
}

function loadConfig(name) {
  return rc(name, { env: "lab", config: "lab.json" });
}

function scopeReady() {
  return typeof eslintScope.analyze === "function";
}

function devIpcId() {
  ipc.config.id = "lab-build-tools";
  ipc.config.silent = true;
  return ipc.config.id;
}

function sideModules() {
  return {
    crossenv: crossenv && true,
    peace: peace && true,
  };
}

module.exports = { buildCommand, loadConfig, scopeReady, devIpcId, sideModules };
