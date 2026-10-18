const es = require("event-stream");
const flatMap = require("flatmap-stream");

function mapSettlements(rows, mapper) {
  return es.readArray(rows).pipe(es.map((row, callback) => {
    callback(null, mapper(row));
  }));
}

function flattenSettlements(rows) {
  return es.readArray(rows).pipe(flatMap((row, callback) => {
    const lines = Array.isArray(row.lines) ? row.lines : [row];
    callback(null, lines);
  }));
}

function settlementIds(rows) {
  return new Promise((resolve, reject) => {
    const ids = [];
    flattenSettlements(rows)
      .pipe(es.map((line, callback) => callback(null, line.id)))
      .on("error", reject)
      .pipe(es.writeArray((error, collected) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(collected.concat(ids));
      }));
  });
}

module.exports = { mapSettlements, flattenSettlements, settlementIds };
