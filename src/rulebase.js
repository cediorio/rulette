/** Define classes for RuleBase **/

import { Graph, Node, DuplicateNameError } from "./graph";
import jsep from "jsep";

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

export class RuleBase {
  static createRuleTree(ast, graph) {
    // debugger;
    if (!graph)
      throw new ParseError(
        "createRuleTree requires a graph object as its second parameter."
      );
    let parent = null;
    this._parseASTNode(ast, graph, parent);
    return graph;
  }

  static _parseASTNode(ast, graph, parent) {
    // check to see if the type is 'Identifier' in which
    // case it's a variable name and we can create a
    // prop(osition) node for it
    const testIdentifier = node => {
      return node && node.type === "Identifier" ? true : false;
    };

    const processVariable = () => {
      const root = graph.createNode({name: ast.name, nodeType: "prop"});
      graph.addEdge(parent, root.name);
    };
    
    const processBinary = () => {
      const left = ast.left;
      const right = ast.right;
      // process the operator itself (the root of this iteration)
      const root = graph.createNode({ nodeType: ast.operator });
      graph.addEdge(parent, root.name);

      let newLeftNode, newRightNode;
      // process the left side

      // begin by testing if the node is of type 'Identifier',
      // in which case it corresponds to a fact and should be
      // added as a 'prop' node
      if (testIdentifier(left)) {
        // only add a new node if the name is not already in the list
        // if it is in the list, add an edge from this rule to the
        // pre-existing Node with the same name
        try {
          newLeftNode = graph.createNode({ name: left.name, nodeType: "prop" });
          graph.addEdge(root.name, newLeftNode.name);
        } catch (e) {
          if (e instanceof DuplicateNameError)
            graph.addEdge(root.name, left.name);
        }
      } else this._parseASTNode(left, graph, root.name);

      // process the right side
      if (testIdentifier(right)) {
        // same process as the left side above
        try {
          newRightNode = graph.createNode({
            name: right.name,
            nodeType: "prop"
          });
          graph.addEdge(root.name, newRightNode.name);
        } catch (e) {
          if (e instanceof DuplicateNameError)
            graph.addEdge(root.name, right.name);
        }
      } else this._parseASTNode(right, graph, root.name);

      return root;
    };

    const processNotOperator = () => {
      const notNode = graph.createNode({ nodeType: "not" });
      graph.addEdge(parent, notNode.name);

      if (ast.argument.type === "Identifier") {
        try {
          const notOperandNode = graph.createNode({
            name: ast.argument.name,
            nodeType: "prop"
          });
          graph.addEdge(notNode.name, notOperandNode.name);
        } catch (e) {
          if (e instanceof DuplicateNameError)
            graph.addEdge(notNode.name, ast.argument.name);
        }
      } else this._parseASTNode(ast.argument, graph, notNode.name);

      return notNode;
    };

    switch (ast.type) {
      case "BinaryExpression":
        switch (ast.operator) {
          case "then":
            let rhs;
            let lhs;
            if (ast.right && ast.right.type === "Identifier") {
              try {
                rhs = graph.createNode({
                  name: ast.right.name,
                  nodeType: "prop"
                });
              } catch (e) {
                if (e instanceof DuplicateNameError) {
                  graph.logging(e.message);
                  rhs = graph.getNodeByName(ast.right.name);
                } else {
                  throw e;
                }
              }
              // if the left side is just an 'Identifier' (i.e., no further logic)
              // then we don't need further parsing
              if (ast.left.type !== "Identifier")
                lhs = this._parseASTNode(ast.left, graph, rhs.name);
              else {
                // we do have a Node whose type is 'Identifier'
                lhs = graph.getNodeByName(ast.left.name);
                // if the previous call didn't find the node in the graph
                // then create it
                if (typeof lhs === "undefined")
                  lhs = graph.createNode({
                    name: ast.left.name,
                    nodeType: "prop"
                  });
                // and finally add it to adjacency list
                graph.addEdge(rhs.name, lhs.name);
              }
            } else
              throw new Error(
                `There was a problem with the form of the AST provided: the RHS was not of type 'Identifier'`
              );
            break;
          case "and":
          case "or":
            return processBinary();
            break;
          default:
            throw new ParseError(`_parseASTNode could not parse the BinaryExpression with the following properties:
					operator: ${ast.operator}
					
				`);
        }
        break;
      case "UnaryExpression":
        switch (ast.operator) {
          case "not":
            return processNotOperator();
            break;
          default:
            throw new ParseError(
              `_parseASTNode could not parse the UnaryExpression that had a ${ast.operator} operator`
            );
        }
      break;
    case "Identifier":
      return processVariable();
    default:
      throw new ParseError(`_parseASTNode could not parse the ast.type - parameters passed in were:
					ast.type:	${ast.type}
					ast.operator:	${ast.operator}`);
    }
  }

  static parseRule(rule) {
    // add custom operators

    jsep.addUnaryOp("not", 10);
    jsep.addBinaryOp("and", 10);
    jsep.addBinaryOp("or", 10);
    jsep.addBinaryOp("then", 1);

    try {
      return jsep(rule);
    } catch (err) {
      throw new ParseError(`jsep encountered the following error parsing the supplied rule text:
		RULE TEXT:		${rule}
		JSEP ERROR:		${err}`);
    }
  }
}
