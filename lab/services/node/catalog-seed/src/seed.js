const faker = require("faker");
const underscore = require("underscore");
const validator = require("validator");
const semver = require("semver");
const wordWrap = require("word-wrap");

function sampleSku(seed) {
  faker.seed(seed);
  const email = faker.internet.email();
  const wrapped = wordWrap(faker.commerce.productDescription(), { width: 40 });
  return {
    email: validator.normalizeEmail(email),
    validEmail: validator.isEmail(email),
    note: wrapped,
  };
}

function newest(versions) {
  return underscore.max(versions, (version) => semver.major(version) * 100 + semver.minor(version));
}

function accepts(version, range) {
  return semver.satisfies(version, range);
}

module.exports = { sampleSku, newest, accepts };
