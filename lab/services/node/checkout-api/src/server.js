const express = require("express");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const ejs = require("ejs");
const colors = require("colors");
const chalk = require("chalk");
const debug = require("debug")("lab:checkout");
const es = require("event-stream");
const UAParser = require("parser-lib");

const RECEIPT = "<p><%= order.id %> · <%= order.total %></p>";

function signOrder(order, secret) {
  return jwt.sign(
    { sub: order.id, iat: moment(order.createdAt).unix() },
    secret,
    { algorithm: "HS256", expiresIn: "15m" }
  );
}

function renderReceipt(order) {
  return ejs.render(RECEIPT, { order });
}

function browserOf(userAgent) {
  return new UAParser(userAgent).getBrowser();
}

function collectIds(orders) {
  return new Promise((resolve, reject) => {
    const ids = [];
    es.readArray(orders)
      .pipe(es.map((order, callback) => callback(null, order.id)))
      .on("error", reject)
      .pipe(es.writeArray((error, rows) => (error ? reject(error) : resolve(rows.concat(ids)))));
  });
}

function banner(text) {
  debug(text);
  return chalk.bold(colors.green(text));
}

function buildApp(secret) {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.type("text/plain").send(banner("checkout-ready"));
  });
  app.post("/orders", async (req, res) => {
    const order = {
      id: String(req.body.id || "1001"),
      total: String(req.body.total || "0"),
      createdAt: req.body.createdAt || "2024-01-15T10:00:00Z",
    };
    const token = signOrder(order, secret);
    const receipt = renderReceipt(order);
    const browser = browserOf(req.get("user-agent") || "");
    const ids = await collectIds([order]);
    res.json({ token, receipt, browser, ids });
  });
  return app;
}

module.exports = { buildApp, signOrder, renderReceipt, browserOf, collectIds, banner };
