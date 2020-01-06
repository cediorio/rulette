"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setAgenda = exports.fire = exports.RuleBase = void 0;

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

const fire = kb => {
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
};

exports.fire = fire;

const setAgenda = rules => {
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
};

exports.setAgenda = setAgenda;
//# sourceMappingURL=ruleEngine.js.map