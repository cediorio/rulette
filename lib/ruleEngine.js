"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Rule = exports.Fact = exports.RuleBase = void 0;

var _graph = require("./graph");

var _jsep = _interopRequireDefault(require("jsep"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** Define classes for RuleBase **/
class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }

}

class RuleBase {
  static createRuleTree(ast, graph) {
    // debugger;
    if (!graph) throw new Error("createRuleTree requires a graph object as its second parameter.");
    let parent = null;

    this._parseASTNode(ast, graph, parent);

    return graph;
  }

  static _parseASTNode(ast, graph, parent) {
    // check to see if the type is 'Identifier' in which
    // case it's a variable name and we can create a
    // prop(osition) node for it
    const testIdentifier = node => {
      return node && node.type === 'Identifier' ? true : false;
    };

    const processBinary = () => {
      const left = ast.left;
      const right = ast.right; // process the operator itself (the root of this iteration)

      const root = graph.createNode({
        nodeType: ast.operator
      });
      graph.addEdge(parent, root.name);
      let newLeftNode, newRightNode; // process the left side

      if (testIdentifier(left)) {
        newLeftNode = graph.createNode({
          name: left.name,
          nodeType: 'prop'
        });
        graph.addEdge(root.name, newLeftNode.name);
      } else this._parseASTNode(right, graph, root.name); // process the right side


      if (testIdentifier(right)) {
        newRightNode = graph.createNode({
          name: right.name,
          nodeType: 'prop'
        });
        graph.addEdge(root.name, newRightNode.name);
      } else this._parseASTNode(right, graph, root.name);
    };

    const processNotOperator = () => {
      const notNode = graph.createNode({
        nodeType: 'not'
      });
      graph.addEdge(parent, notNode.name);

      if (ast.argument.type === 'Identifier') {
        const notOperandNode = graph.createNode({
          name: ast.argument.name,
          nodeType: 'prop'
        });
        graph.addEdge(notNode.name, notOperandNode.name);
      } else this._parseASTNode(ast.argument, graph, notNode.name);
    };

    switch (ast.type) {
      case 'BinaryExpression':
        switch (ast.operator) {
          case 'then':
            if (ast.right && ast.right.type === 'Identifier') {
              const parent = graph.createNode({
                name: ast.right.name,
                nodeType: 'prop'
              });

              this._parseASTNode(ast.left, graph, parent.name);
            }

            break;

          case 'and':
          case 'or':
            processBinary();
            break;

          default:
            throw new ParseError(`_parseASTNode could not parse the BinaryExpression with the following properties:
					operator: ${ast.operator}
					
				`);
        }

        break;

      case 'UnaryExpression':
        switch (ast.operator) {
          case 'not':
            processNotOperator();
            break;

          default:
            throw new ParseError(`_parseASTNode could not parse the UnaryExpression that had a ${ast.operator} operator`);
        }

        break;

      default:
        throw new ParseError(`_parseASTNode could not parse the ast.type - parameters passed in were:
					ast.type:	${ast.type}
					ast.operator:	${ast.operator}`);
    }
  }

  static parseRule(rule) {
    // add custom operators
    _jsep.default.addUnaryOp('not', 10);

    _jsep.default.addBinaryOp('and', 10);

    _jsep.default.addBinaryOp('or', 10);

    _jsep.default.addBinaryOp('then', 1);

    try {
      return (0, _jsep.default)(rule);
    } catch (err) {
      throw new ParseError(`jsep encountered the following error parsing the supplied rule text:
		RULE TEXT:		${rule}
		JSEP ERROR:		${err}`);
    }
  }

}

exports.RuleBase = RuleBase;

class Fact extends _graph.Node {
  constructor(args = {
    name: null,
    validValues: null,
    displayQuestion: null,
    factDescription: null
  }) {
    let {
      name,
      validValues,
      displayQuestion,
      factDescription
    } = args;
    super({
      name: name
    });
    this._validValues = validValues;
    this._displayQuestion = displayQuestion;
    this._factDescription = factDescription;
  }

}

exports.Fact = Fact;

class Rule extends _graph.Node {
  constructor(args = {
    name: null,
    lhs: null,
    rhs: null,
    trueDisplayValue: null,
    falseDisplayValue: null,
    topic: null,
    source: null,
    notes: null
  }) {
    let {
      name,
      lhs,
      rhs,
      trueDisplayValue,
      falseDisplayValue,
      topic,
      source,
      notes
    } = args;
    super({
      name: name
    });
    this._lhs = lhs;
    this._rhs = rhs;
    this._trueDisplayValue = trueDisplayValue;
    this._falseDisplayValue = falseDisplayValue;
    this._topic = topic;
    this._source = source;
    this._notes = notes;
  }

}

exports.Rule = Rule;

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
    let result = vm.runInContext(factEvalStr + "\n" + ruleEvalStr, sandbox);

    if (result) {
      resultText = rules[i].trueDisplayValue;
      vm.runInContext("var " + rules[i].rhs + " = true;", sandbox); // assert the right-hand of the rule

      rules[i].value = true;
    } else {
      resultText = rules[i].falseDisplayValue;
      vm.runInContext("var " + rules[i].rhs + " = false;", sandbox); // deny the right-hand of the rule

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
    var val = vm.runInContext(evalF, sandbox);
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