const faker = require("faker");
const UAParser = require("ua-parser-js");

function sampleBlurb(seed) {
  faker.seed(seed);
  return faker.lorem.sentence();
}

function widgetBrowser(userAgent) {
  return new UAParser(userAgent).getBrowser();
}

module.exports = { sampleBlurb, widgetBrowser };
