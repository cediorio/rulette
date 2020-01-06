"use strict";

var _immutable = require("immutable");

var _fetchKB = require("./fetchKB");

const get_kb = async kb_to_fetch => {
  const kb = await (0, _fetchKB.fetchData)(kb_to_fetch);

  if (kb) {
    kb.forEach(e => {
      console.log(`${JSON.stringify(e)}`);
    });
  }
};

get_kb((0, _fetchKB.buildUrl)('test'));
//# sourceMappingURL=index.js.map