"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RuleBase = void 0;

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
      // begin by testing if the node is of type 'Identifier',
      // in which case it corresponds to a fact and should be
      // added as a 'prop' node

      if (testIdentifier(left)) {
        // only add a new node if the name is not already in the list
        // if it is in the list, add an edge from this rule to the
        // pre-existing Node with the same name
        try {
          newLeftNode = graph.createNode({
            name: left.name,
            nodeType: 'prop'
          });
          graph.addEdge(root.name, newLeftNode.name);
        } catch (e) {
          if (e instanceof _graph.DuplicateNameError) graph.addEdge(root.name, left.name);
        }
      } else this._parseASTNode(left, graph, root.name); // process the right side


      if (testIdentifier(right)) {
        // same process as the left side above
        try {
          newRightNode = graph.createNode({
            name: right.name,
            nodeType: 'prop'
          });
          graph.addEdge(root.name, newRightNode.name);
        } catch (e) {
          if (e instanceof _graph.DuplicateNameError) graph.addEdge(root.name, right.name);
        }
      } else this._parseASTNode(right, graph, root.name);

      return root;
    };

    const processNotOperator = () => {
      const notNode = graph.createNode({
        nodeType: 'not'
      });
      graph.addEdge(parent, notNode.name);

      if (ast.argument.type === 'Identifier') {
        try {
          const notOperandNode = graph.createNode({
            name: ast.argument.name,
            nodeType: 'prop'
          });
          graph.addEdge(notNode.name, notOperandNode.name);
        } catch (e) {
          if (e instanceof _graph.DuplicateNameError) graph.addEdge(notNode.name, ast.argument.name);
        }
      } else this._parseASTNode(ast.argument, graph, notNode.name);

      return notNode;
    };

    switch (ast.type) {
      case 'BinaryExpression':
        switch (ast.operator) {
          case 'then':
            let rhs;
            let lhs;

            if (ast.right && ast.right.type === 'Identifier') {
              try {
                rhs = graph.createNode({
                  name: ast.right.name,
                  nodeType: 'prop'
                });
              } catch (e) {
                if (e instanceof _graph.DuplicateNameError) {
                  graph.logging(e.message);
                  rhs = graph.getNodeByName(ast.right.name);
                } else {
                  throw e;
                }
              } // if the left side is just an 'Identifier' (i.e., no further logic)
              // then we don't need further parsing


              if (ast.left.type !== 'Identifier') lhs = this._parseASTNode(ast.left, graph, rhs.name);else {
                // we do have a Node whose type is 'Identifier'
                lhs = graph.getNodeByName(ast.left.name); // if the previous call didn't find the node in the graph
                // then create it

                if (typeof lhs === 'undefined') lhs = graph.createNode({
                  name: ast.left.name,
                  nodeType: 'prop'
                }); // and finally add it to adjacency list

                graph.addEdge(rhs.name, lhs.name);
              }
            } else throw new Error(`There was a problem with the form of the AST provided: the RHS was not of type 'Identifier'`);

            break;

          case 'and':
          case 'or':
            return processBinary();
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
            return processNotOperator();
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
/* OLD CODE AND DATA OBJECTS FOR DEV REFERENCE

    // ruleResultsJSON.push({
    // 	name: rules[i].name,
    // 	lhs: rules[i].lhs,
    // 	rhs: rules[i].rhs,
    // 	value: rules[i].value,
    // 	topic: rules[i].topic,
    // 	source: rules[i].source,
    // 	result: resultText,
    // 	facts: lhs_facts.map(function(i) {
    // 	    var fact = getFactStatus(i, kb);
    // 	    // var support_desc = !!fact.factDescription ? fact.factDescription : "No further support provided";
    // 	    return {
    // 		name: fact.name,
    // 		value: fact.value,
    // 		support_description: fact.factDescription
    // 	    };
    // 	})
    // });

    // console.log(resultsJSON);
    return {
	ruleResultsJSON,
	openFacts,
	closedFacts
    };
};


export const setAgenda = (rules) => {
  var agenda = [];
  // get all the rule names
  // var rule_names = rules.map(function(rule) {
  //   return rule.name;
  // });

  rules.forEach(function(rule) {
    var inAgenda = false; // flag to mark presence of rule in agenda
    for (let i = 0; i < agenda.length; i++) {
      // tokenize each lhs and check to see if the current rule.rhs is in it
      var tokens = tokenize(agenda[i].lhs);
      // if it is in the agenda, put it at the front of the agenda and bail
      if (tokens.indexOf(rule.rhs) > -1) {
        inAgenda = true;
        agenda.unshift(rule);
        break;
      }
    }
    // if the previous for loop didn't find the current rule.rhs in the agenda,
    // push it onto the end of the agenda
    if (!inAgenda) agenda.push(rule);
  });

  return agenda;
};

const tokenize = (s) => {
  if (s === true) return s;
  var tokens = s.split(/[^\b\w\b]|\b\d\b/g);
  var token_map = tokens.map(function(i) {
    var token = i.trim();
    return token;
  });
  // return token_map;
  return token_map.filter(function(e) {
    return e.length > 0;
  });
};

*/


exports.RuleBase = RuleBase;
//# sourceMappingURL=ruleEngine.js.map