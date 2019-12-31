"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _vmBrowserify = _interopRequireDefault(require("vm-browserify"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sandbox = _vmBrowserify.default.createContext({});
/** Define classes for RuleBase **/


function Fact(fact) {
  this.id = fact.kb_type + fact.id;
  this.name = this.parseNames(fact.name).trim();
  this.value = fact.value;
  this.validValues = fact.validValues;
  this.displayQuestion = fact.displayQuestion;
  this.factDescription = fact.factDescription;
}

Fact.prototype.parseNames = function (name) {
  // name = name.replace( /(\w)-(\w)/g, "\1_\2" );  // we don't need to do this, just make sure fact and rule names match!
  return name;
};

function Rule(rule) {
  this.name = rule.result;
  this.lhs = this.parseRule(this.parseNames(rule.conditions));
  this.rhs = rule.result;
  this.value = null;
  this.trueDisplayValue = rule.trueDisplayValue;
  this.falseDisplayValue = rule.falseDisplayValue;
  this.topic = rule.topic;
  this.source = rule.source;
  this.notes = rule.notes;
}

Rule.prototype.parseNames = function (name) {
  return name;
};

Rule.prototype.parseRule = function (rule) {
  if (rule === true) return rule;
  rule = rule.replace(/\s+and\s+/g, " && ");
  rule = rule.replace(/\s+or\s+/g, " || ");
  rule = rule.replace(/\s*not\s+/g, " !");
  return rule;
};

function createKB(facts_range = [], rules_range = []) {
  /* takes a fact object and rules object
    and returns a kb object
  */
  var facts = [];

  for (let i = 0; i < facts_range.length; i++) {
    facts.push(new Fact(facts_range[i]));
  }

  var rules = [];
  rules_range.forEach(function (rule) {
    if (rule.conditions !== "") rules.push(new Rule(rule));
  });
  return {
    facts,
    rules
  };
}

function buildFactEvalStr(facts) {
  var evalStr = [];

  for (let i = 0; i < facts.length; i++) {
    // facts[i].name = parseNames(facts[i].name); // clean the syntax if necessary
    if (facts[i].name === "") continue; // skip if there is no fact on this line

    if (facts[i].value === "UNKNOWN") facts[i].value = null;
    evalStr.push("var " + facts[i].name + " = " + facts[i].value.toLowerCase() + ";"); // otherwise build the string for eval
  }

  return evalStr.join("\n") + "\n\n";
}

function fire(kb) {
  //set up a sandbox context for evaluation
  var rules = setAgenda(kb.rules);
  var facts = kb.facts;
  var ruleResultsJSON = []; // full report on results of Rule evaluation

  var openFacts = []; // Facts which have no answers yet

  var closedFacts = []; // Facts which have been answered

  var factEvalStr = buildFactEvalStr(facts); // evaluate the rules

  for (let i = 0; i < rules.length; i++) {
    let resultText = "";
    if (rules[i].lhs === "") continue; // skip if there is no rule on this line

    let lhs_facts = tokenize(rules[i].lhs);
    let ruleEvalStr = rules[i].lhs;

    let result = _vmBrowserify.default.runInContext(factEvalStr + "\n" + ruleEvalStr, sandbox);

    if (result) {
      resultText = rules[i].trueDisplayValue;

      _vmBrowserify.default.runInContext("var " + rules[i].rhs + " = true;", sandbox); // assert the right-hand of the rule


      rules[i].value = true;
    } else {
      resultText = rules[i].falseDisplayValue;

      _vmBrowserify.default.runInContext("var " + rules[i].rhs + " = false;", sandbox); // deny the right-hand of the rule


      rules[i].value = false;
    } // console.log('this topic is: ' + rules[i].topic);


    ruleResultsJSON.push({
      name: rules[i].name,
      lhs: rules[i].lhs,
      rhs: rules[i].rhs,
      value: rules[i].value,
      topic: rules[i].topic,
      source: rules[i].source,
      result: resultText,
      facts: lhs_facts.map(function (i) {
        var fact = getFactStatus(i, kb); // var support_desc = !!fact.factDescription ? fact.factDescription : "No further support provided";

        return {
          name: fact.name,
          value: fact.value,
          support_description: fact.factDescription
        };
      })
    });
  } // console.log(resultsJSON);


  return {
    ruleResultsJSON,
    openFacts,
    closedFacts
  };
}

function getFactStatus(i, kb) {
  var facts = kb.facts;
  var rules = kb.rules; // console.log("this fact is: " + i);
  // this is a list of stopwords that are utility function names in this module
  // if the "fact" is a function, we'll eval it and return the fact status

  var functionNames = ["getYear", "getMonth"];

  if (functionNames.filter(function (e) {
    return e === i;
  }).length > 0) {
    var evalF = i + "()";

    var val = _vmBrowserify.default.runInContext(evalF, sandbox);

    return {
      name: i,
      value: val,
      support_description: "Utility function evaluation"
    };
  }

  var fact = facts.filter(function (e) {
    return e.name === i;
  })[0]; // if the condition wasn't in facts, then it must be in rules

  if (typeof fact === "undefined") {
    var rule_match = rules.filter(function (e) {
      return e.name === i;
    })[0];
    return {
      name: rule_match.name,
      value: rule_match.value,
      support_description: "Rule evaluation"
    };
  }

  return fact;
}

function tokenize(s) {
  if (s === true) return s;
  var tokens = s.split(/[^\b\w\b]|\b\d\b/g);
  var token_map = tokens.map(function (i) {
    var token = i.trim();
    return token;
  }); // return token_map;

  return token_map.filter(function (e) {
    return e.length > 0;
  });
}

function setAgenda(rules) {
  var agenda = []; // get all the rule names
  // var rule_names = rules.map(function(rule) {
  //   return rule.name;
  // });

  rules.forEach(function (rule) {
    var inAgenda = false; // flag to mark presence of rule in agenda

    for (let i = 0; i < agenda.length; i++) {
      // tokenize each lhs and check to see if the current rule.rhs is in it
      var tokens = tokenize(agenda[i].lhs); // if it is in the agenda, put it at the front of the agenda and bail

      if (tokens.indexOf(rule.rhs) > -1) {
        inAgenda = true;
        agenda.unshift(rule);
        break;
      }
    } // if the previous for loop didn't find the current rule.rhs in the agenda,
    // push it onto the end of the agenda


    if (!inAgenda) agenda.push(rule);
  });
  return agenda;
}

function printAgenda(agenda) {
  return agenda.map(function (i) {
    return "LHS: " + i.lhs + " RHS: " + i.rhs;
  }).join(" \n");
} // function getYear() {
//   var d = new Date();
//   return d.getFullYear();
// }
// function getMonth() {
//   var d = new Date();
//   return d.getMonth();
// }


var _default = {
  fire,
  createKB,
  printAgenda
};
exports.default = _default;
//# sourceMappingURL=ruleEngine.js.map