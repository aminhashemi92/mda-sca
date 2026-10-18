const axios = require("axios");
const fetch = require("node-fetch");
const { http, https } = require("follow-redirects");

async function inventoryStatus(url) {
  const response = await axios.get(url, { timeout: 1500, maxRedirects: 2 });
  return response.status;
}

async function catalogDocument(url) {
  const response = await fetch(url);
  return { status: response.status, via: "node-fetch" };
}

function followStatus(url, callback) {
  const client = url.startsWith("https:") ? https : http;
  return client.get(url, (response) => {
    response.resume();
    callback(null, response.statusCode);
  }).on("error", callback);
}

module.exports = { inventoryStatus, catalogDocument, followStatus };
