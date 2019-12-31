"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildUrl = exports.fetchData = void 0;

var _immutable = require("immutable");

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Returns a JSON object consisting of rules and facts from the
 tax-apis.com server. */
const fetchData = async url => {
  try {
    let kb = await _axios.default.get(url);

    if (kb) {
      return kb.data;
    } else {
      return new Error(`There was a problem fetching the data.`);
    }
  } catch (error) {
    throw new Error(error);
  }
};

exports.fetchData = fetchData;

const buildUrl = kb_to_fetch => {
  return `https://tax-apis.com/kb_json/${kb_to_fetch}.json`;
};

exports.buildUrl = buildUrl;
//# sourceMappingURL=fetchKB.js.map