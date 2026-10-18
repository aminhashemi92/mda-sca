const mkdirp = require("mkdirp");
const minimist = require("minimist");
const tar = require("tar");
const { VM } = require("vm2");
const ipc = require("node-ipc");
const { CookieJar } = require("tough-cookie");
const xml2js = require("xml2js");
const protobuf = require("protobufjs");
const payments = require("@lab/payments-core");
const theme = require("@lab/cli-theme");

const STATEMENT = "<statement id=\"st-1\"><line id=\"ln-1\">posted</line></statement>";

function readFlags(argv) {
  return minimist(argv, { string: ["out"], boolean: ["dry-run"] });
}

function ensureOutDir(dir) {
  mkdirp.sync(dir);
  return dir;
}

async function listArchive(archivePath) {
  const entries = [];
  await tar.list({
    file: archivePath,
    onentry(entry) {
      entries.push(entry.path);
    },
  });
  return entries;
}

function sandboxSum(left, right) {
  const vm = new VM({ timeout: 50, sandbox: { left, right } });
  return vm.run("Number(left) + Number(right)");
}

function serveBillingIpc(id) {
  ipc.config.id = id;
  ipc.config.retry = 1500;
  ipc.config.silent = true;
  ipc.serve(() => {
    ipc.server.on("ping", (_data, socket) => {
      ipc.server.emit(socket, "pong", { ok: true, id });
    });
  });
  ipc.server.start();
  return ipc.config.id;
}

async function rememberSession(url, cookieHeader) {
  const jar = new CookieJar();
  await jar.setCookie(cookieHeader, url);
  return jar.getCookieString(url);
}

async function readStatement(xmlText) {
  const parsed = await xml2js.parseStringPromise(xmlText || STATEMENT);
  return parsed.statement || parsed;
}

function messageRoot() {
  const root = new protobuf.Root();
  root.addJSON({
    Settlement: {
      fields: {
        id: { type: "string", id: 1 },
        amount: { type: "string", id: 2 },
      },
    },
  });
  return root.lookupType("Settlement");
}

async function describeBatch(rows) {
  const ids = await payments.settlementIds(rows);
  const Type = messageRoot();
  const payload = Type.create({ id: ids[0] || "none", amount: "0" });
  return {
    label: theme.label("billing"),
    ids,
    bytes: Type.encode(payload).finish().length,
  };
}

module.exports = {
  readFlags,
  ensureOutDir,
  listArchive,
  sandboxSum,
  serveBillingIpc,
  rememberSession,
  readStatement,
  describeBatch,
};
