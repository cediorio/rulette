(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.rulette = factory());
}(this, (function () { 'use strict';

	/* Nodes are of type 'op'{erator} or 'prop'{osition}
	 */
	class Graph {
	  constructor({
	    name = ''
	  } = {}) {
	    this._name = name;
	    this._adjList = {};
	    this._nodes = [];
	    this.missingValuesStack = [];
	    this._log = '';
	  }

	  logging(msg) {
	    this._log += msg;
	  }

	  get log() {
	    return this._log;
	  }

	  get name() {
	    return this._name;
	  }

	  set name(value) {
	    this._name = value;
	  }

	  get nodeNames() {
	    return Object.keys(this._adjList);
	  }

	  createNode(args) {
	    // args =  = {name: <name>, nodeType: <nodeType>, value: <value>}
	    args['nodeNames'] = this.nodeNames; // console.log(`from createNode: this.nodeNames = ${'test' in args.nodeNames}`);

	    let n = new Node(args); // console.log(`Node name: ${n.name}`);

	    this._addNode(n);

	    return n;
	  }

	  get nodes() {
	    return this._nodes;
	  }

	  getNodeByName(name) {
	    return this._nodes.filter(node => node.name === name)[0];
	  }

	  getNodeChildren(name) {
	    return this.adjList[name];
	  }

	  _addNode(node) {
	    this._adjList[node.name] = [];

	    this._nodes.push(node);
	  }

	  addEdge(vertex1, vertex2) {
	    if (typeof vertex1 !== 'undefined' && typeof vertex2 !== 'undefined') {
	      if (typeof vertex1 === 'object' && typeof vertex2 === 'object') this._adjList[vertex1.name].push(vertex2.name);
	      if (typeof vertex1 === 'string' && typeof vertex2 === 'string') this._adjList[vertex1].push(vertex2);
	    } else {
	      throw new Error(`addEdge requires two names of nodes/vertices to create an edge: addEdge was provided with:
				vertex1: ${vertex1}
				vertex2: ${vertex2}`);
	    }
	  }

	  get adjList() {
	    return this._adjList;
	  }

	  dfs() {
	    const nodes = this.nodeNames;
	    const visited = {};
	    nodes.forEach(node => {
	      this._dfsUtil(node, visited);
	    });
	  }

	  _dfsUtil(node, visited) {
	    if (!visited[node]) {
	      visited[node] = true;
	      const neighbours = this.adjList[node]; // console.log(`node: ${node}\nvisited: ${visited[node]}\nneighbours: ${neighbours}`);

	      if (typeof neighbours !== 'undefined') {
	        neighbours.forEach(i => {
	          const neighbour = neighbours[i];

	          this._dfsUtil(neighbour, visited);
	        });
	      }
	    }
	  }

	  detectCycle() {
	    const graphNodes = this.nodeNames;
	    const visited = {};
	    const recStack = {};

	    for (let node of graphNodes) {
	      if (this._detectCycleUtil(node, visited, recStack)) return 'CYCLE EXISTS';
	    }

	    return 'NO CYCLE EXISTS';
	  }

	  _detectCycleUtil(node, visited, recStack) {
	    if (!visited[node]) {
	      visited[node] = true;
	      recStack[node] = true;
	      const nodeNeighbours = this.adjList[node];

	      if (typeof nodeNeighbours !== 'undefined') {
	        for (let currentNode of nodeNeighbours) {
	          // console.log(`parent: ${node}, Child: ${currentNode}`);
	          if (!visited[currentNode] && this._detectCycleUtil(currentNode, visited, recStack)) {
	            return true;
	          } else if (recStack[currentNode]) {
	            return true;
	          }
	        }
	      }
	    }

	    recStack[node] = false;
	    return false;
	  }

	  findGoalNodes() {
	    const hasParentTestList = {};
	    Object.entries(this.adjList).forEach(node => {
	      const children = node[1];
	      children.forEach(child => {
	        hasParentTestList[child] = true;
	      });
	    });
	    const nodesWithParents = new Set(Object.entries(hasParentTestList).filter(e => e[1] === true).map(e => e[0]));
	    const goalNodes = this.nodeNames.filter(e => !nodesWithParents.has(e));
	    return goalNodes;
	  }

	  evalGoalNodes(goals) {
	    let results = {};

	    for (let goal of goals) {
	      this.missingValuesStack = []; // init to empty

	      results[goal] = this.evalRuleTree(goal);
	    }

	    return results;
	  }

	  evalRuleTree(c) {
	    // _evalRTUtil will return an object with the truthiness of
	    // the evaluated rule tree if it can reject or accept it and
	    // the node that was evaluated -- otherwise, it returns an
	    // array of the props it was unable to find values for
	    const visited = {}; // note that this isn't currently set anywhere, but may become useful
	    // in future to iterate where facts are solicited interactively

	    const result = this._evalRTUtil(c, visited);

	    return result;
	  }

	  _evalRTUtil(c, visited) {
	    /* Will return: (1) on success: the node that was successfully
	     * evaluated; (2) on failure, an array containing the nodes
	     * which are missing truth values. 
	     */
	    if (typeof c === 'undefined') throw new Error('You must supply a root node to begin the backtracking search.');
	    if (this._reject(c)) return {
	      result: 'reject',
	      nodes: this.missingValuesStack
	    };
	    if (this._accept(c)) return {
	      result: 'accept',
	      nodes: this.getNodeByName(c)
	    };
	    const children = this.adjList[c];

	    for (let s of children) {
	      if (!visited[s]) this._evalRTUtil(s, visited);
	    }

	    throw new Error(`_evalRTUtil was unable to evaluate the rule tree provided:
				rule tree root node: ${this.getNodeByName(c)}
			`);
	  }

	  _checkIfUndefined(c) {
	    const node = this.getNodeByName(c);

	    if (node.value === null) {
	      return true;
	    } else return false;
	  }

	  pushToMissingValues(n) {
	    if (!(n instanceof Node)) throw new Error("usage: pushToMissingValues( <Node> )");

	    if (n.value === null) {
	      if (!this.missingValuesStack.includes(n.name)) this.missingValuesStack.push(n.name);
	    }
	  }

	  _reject(c) {
	    // The reject procedure should return true only if the
	    // candidate or its children that could evaluate to a truth
	    // result are undefined, in which case return the list of
	    // missing values
	    // determine undefined status for root and children (depending
	    // on operator type)
	    const root = this.getNodeByName(c);
	    let operator = root.nodeType;

	    const rootUndefValue = this._checkIfUndefined(c);

	    const children = this.adjList[c].map(e => this.getNodeByName(e));
	    const RHS = operator === 'prop' && children.length > 0; // if the node is an RHS, then give it a special operator

	    operator = RHS ? 'rhs' : operator;
	    const left = children[0];
	    const right = children[1];
	    let leftUndefValue = left ? this._checkIfUndefined(children[0].name) : null; // a node that is either a 'not' or an RHS will have no right child

	    let rightUndefValue = operator !== 'not' && !RHS && (right ? this._checkIfUndefined(children[1].name) : null);

	    switch (operator) {
	      case 'rhs':
	      case 'not':
	        leftUndefValue = leftUndefValue && (this.adjList[left.name].length > 0 ? this._reject(left.name) : true);

	        if (rootUndefValue && leftUndefValue) {
	          // only one operand with 'not' 
	          [root, left].forEach(e => this.pushToMissingValues(e));
	          return true;
	        }

	        break;

	      case 'and':
	        leftUndefValue = leftUndefValue && (this.adjList[left.name].length > 0 ? this._reject(left.name) : true);
	        rightUndefValue = rightUndefValue && (this.adjList[right.name].length > 0 ? this._reject(right.name) : true);

	        if (rootUndefValue && (leftUndefValue || rightUndefValue)) {
	          [root, left, right].forEach(e => this.pushToMissingValues(e));
	          return true;
	        }

	        break;

	      case 'or':
	        leftUndefValue = leftUndefValue && (this.adjList[left.name].length > 0 ? this._reject(left.name) : true);
	        rightUndefValue = rightUndefValue && (this.adjList[right.name].length > 0 ? this._reject(right.name) : true);

	        if (rootUndefValue && leftUndefValue && rightUndefValue) {
	          [root, left, right].forEach(e => this.pushToMissingValues(e));
	          return true;
	        }

	        break;
	    }

	    return false;
	  } // end _reject


	  _accept(c) {
	    /* The accept procedure should return true if c is a complete
	     * and valid solution for the problem instance P, and false
	     * otherwise. It may assume that the partial candidate c and
	     * all its ancestors in the tree have passed the reject
	     * test. */
	    const root = this.getNodeByName(c);
	    const children = this.adjList[root.name];
	    let operator = root.nodeType;
	    const RHS = operator === 'prop' && children.length > 0; // if the root is an RHS, then give it a special operator

	    operator = RHS ? 'rhs' : operator;
	    const left = this.getNodeByName(children[0]);
	    const right = this.getNodeByName(children[1]); // return true if the root already has a value

	    if (root.value !== null) return true; // different tests for different operators, obviously

	    switch (operator) {
	      case 'rhs':
	        if (left.value !== null) {
	          root.value = left.value;
	          return true;
	        } else if (this._accept(left.name)) {
	          root.value = left.value;
	          return true;
	        }

	        break;

	      case 'not':
	        if (left.value === null) this._accept(left.name);
	        root.value = left.value ? false : true;
	        return true;

	      case 'or':
	        if (left.value === null) this._accept(left.name);
	        if (right.value === null) this._accept(right.name);
	        root.value = left.value || right.value;
	        return true;

	      case 'and':
	        if (left.value === null) this._accept(left.name);
	        if (right.value === null) this._accept(right.name);
	        root.value = left.value && right.value;
	        return true;
	    }

	    return false;
	  } // end _accept


	  traverseNodesBFS(c) {
	    // the path of left and right nodes all the way to the bottom
	    // of the tree, by breadth
	    let path = [];
	    let queue = [c];

	    const _addToPathBFS = c => {
	      let node = this.getNodeByName(c); // if the node is a not, sub in its operand, which is the
	      // first entry in the adjList for that node

	      if (node.nodeType === 'not') c = this.adjList[node.name][0];
	      if (this.getNodeByName(c).nodeType === 'prop') path.push(c);

	      for (let i of this.adjList[c]) queue.unshift(i);
	    };

	    while (queue.length > 0) {
	      _addToPathBFS(queue.pop());
	    }

	    return path;
	  }

	  _addToPathBFS(c) {
	    path.push(c);
	  }

	}
	class Node {
	  constructor({
	    name = null,
	    nodeType = 'prop',
	    value = null,
	    nodeNames = []
	  } = {}) {
	    // let {name, nodeType, value, nodeNames} = args;
	    this.name = {
	      name: name,
	      nodeType: nodeType,
	      takenNames: nodeNames
	    };
	    this.nodeType = nodeType;
	    this.value = value;
	  } // has to be a props object with {name: <name>, nodeType: <nodeType>, takenNames: <names 
	  // that are not available>}


	  set name({
	    name = null,
	    nodeType = null,
	    takenNames = []
	  } = {}) {
	    // throw if name is already in the graph
	    if (takenNames && takenNames.includes(name)) throw new DuplicateNameError(`Node name ${name} has already been used in this graph instance.`); // generate a unique name if a unique name isn't provided

	    if (name) this._name = name;else {
	      this._name = _uniqueName(nodeType, takenNames);
	    }
	  }

	  get name() {
	    return this._name;
	  }

	  set nodeType(nodeType) {
	    // enforce use one of the permissible nodeTypes (defaults to 'prop' when no args are provided)
	    const nodeTypes = ['prop', 'and', 'or', 'not'];
	    if (nodeTypes.includes(nodeType)) this._nodeType = nodeType;else if (typeof nodeType !== 'undefined') throw new Error(`nodeType must be one of ${nodeTypes}`);else this._nodeType = 'prop';
	  }

	  get nodeType() {
	    return this._nodeType;
	  } // enforces use of set valueTypes


	  set value(value) {
	    const valueTypes = [true, false, 'true', 'false']; // values may be received as strings

	    if (valueTypes.includes(value)) {
	      if (value === 'true') value = true;
	      if (value === 'false') value = false;
	      this._value = value;
	    } else if (value !== null && typeof value !== 'undefined' && !valueTypes.includes(value)) {
	      throw new Error(`value must be one of ${valueTypes}`);
	    } else this._value = null;
	  }

	  get value() {
	    return this._value;
	  }

	}

	const _uniqueName = (nodeType, takenNames) => {
	  let proposedName = _defaultName(nodeType);

	  if (typeof takenNames === 'undefined' || takenNames.length < 1) return proposedName;else if (proposedName in takenNames) _uniqueName(takenNames);else return proposedName;
	};

	const _defaultName = nodeType => {
	  // get a random char number between 65 to 122
	  // thx to https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range
	  let randomWordLen = 10;

	  let charNum = e => {
	    const rMin = 0,
	          rMax = 1,
	          tMin = 97,
	          tMax = 122; // 97 to 122 is 'a' to 'z'

	    return String.fromCharCode(parseInt((e - rMin) / (rMax - rMin) * (tMax - tMin) + tMin));
	  };

	  var name = '';

	  for (let i = 0; i < randomWordLen; i++) {
	    name += charNum(Math.random());
	  }

	  name = nodeType + '_' + name;
	  return name;
	};

	class DuplicateNameError extends Error {
	  constructor(msg) {
	    super(msg);
	    this.name = 'DuplicateNameError';
	  }

	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var jsep = createCommonjsModule(function (module, exports) {
	//     JavaScript Expression Parser (JSEP) 0.3.4
	//     JSEP may be freely distributed under the MIT License
	//     http://jsep.from.so/

	/*global module: true, exports: true, console: true */
	(function (root) {
		// Node Types
		// ----------

		// This is the full set of types that any JSEP node can be.
		// Store them here to save space when minified
		var COMPOUND = 'Compound',
			IDENTIFIER = 'Identifier',
			MEMBER_EXP = 'MemberExpression',
			LITERAL = 'Literal',
			THIS_EXP = 'ThisExpression',
			CALL_EXP = 'CallExpression',
			UNARY_EXP = 'UnaryExpression',
			BINARY_EXP = 'BinaryExpression',
			LOGICAL_EXP = 'LogicalExpression',
			CONDITIONAL_EXP = 'ConditionalExpression',
			ARRAY_EXP = 'ArrayExpression',

			PERIOD_CODE = 46, // '.'
			COMMA_CODE  = 44, // ','
			SQUOTE_CODE = 39, // single quote
			DQUOTE_CODE = 34, // double quotes
			OPAREN_CODE = 40, // (
			CPAREN_CODE = 41, // )
			OBRACK_CODE = 91, // [
			CBRACK_CODE = 93, // ]
			QUMARK_CODE = 63, // ?
			SEMCOL_CODE = 59, // ;
			COLON_CODE  = 58, // :

			throwError = function(message, index) {
				var error = new Error(message + ' at character ' + index);
				error.index = index;
				error.description = message;
				throw error;
			},

		// Operations
		// ----------

		// Set `t` to `true` to save space (when minified, not gzipped)
			t = true,
		// Use a quickly-accessible map to store all of the unary operators
		// Values are set to `true` (it really doesn't matter)
			unary_ops = {'-': t, '!': t, '~': t, '+': t},
		// Also use a map for the binary operations but set their values to their
		// binary precedence for quick reference:
		// see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
			binary_ops = {
				'||': 1, '&&': 2, '|': 3,  '^': 4,  '&': 5,
				'==': 6, '!=': 6, '===': 6, '!==': 6,
				'<': 7,  '>': 7,  '<=': 7,  '>=': 7,
				'<<':8,  '>>': 8, '>>>': 8,
				'+': 9, '-': 9,
				'*': 10, '/': 10, '%': 10
			},
		// Get return the longest key length of any object
			getMaxKeyLen = function(obj) {
				var max_len = 0, len;
				for(var key in obj) {
					if((len = key.length) > max_len && obj.hasOwnProperty(key)) {
						max_len = len;
					}
				}
				return max_len;
			},
			max_unop_len = getMaxKeyLen(unary_ops),
			max_binop_len = getMaxKeyLen(binary_ops),
		// Literals
		// ----------
		// Store the values to return for the various literals we may encounter
			literals = {
				'true': true,
				'false': false,
				'null': null
			},
		// Except for `this`, which is special. This could be changed to something like `'self'` as well
			this_str = 'this',
		// Returns the precedence of a binary operator or `0` if it isn't a binary operator
			binaryPrecedence = function(op_val) {
				return binary_ops[op_val] || 0;
			},
		// Utility function (gets called from multiple places)
		// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
			createBinaryExpression = function (operator, left, right) {
				var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
				return {
					type: type,
					operator: operator,
					left: left,
					right: right
				};
			},
			// `ch` is a character code in the next three functions
			isDecimalDigit = function(ch) {
				return (ch >= 48 && ch <= 57); // 0...9
			},
			isIdentifierStart = function(ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
						(ch >= 65 && ch <= 90) || // A...Z
						(ch >= 97 && ch <= 122) || // a...z
	                    (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
			},
			isIdentifierPart = function(ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
						(ch >= 65 && ch <= 90) || // A...Z
						(ch >= 97 && ch <= 122) || // a...z
						(ch >= 48 && ch <= 57) || // 0...9
	                    (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
			},

			// Parsing
			// -------
			// `expr` is a string with the passed in expression
			jsep = function(expr) {
				// `index` stores the character number we are currently at while `length` is a constant
				// All of the gobbles below will modify `index` as we move along
				var index = 0,
					charAtFunc = expr.charAt,
					charCodeAtFunc = expr.charCodeAt,
					exprI = function(i) { return charAtFunc.call(expr, i); },
					exprICode = function(i) { return charCodeAtFunc.call(expr, i); },
					length = expr.length,

					// Push `index` up to the next non-space character
					gobbleSpaces = function() {
						var ch = exprICode(index);
						// space or tab
						while(ch === 32 || ch === 9 || ch === 10 || ch === 13) {
							ch = exprICode(++index);
						}
					},

					// The main parsing function. Much of this code is dedicated to ternary expressions
					gobbleExpression = function() {
						var test = gobbleBinaryExpression(),
							consequent, alternate;
						gobbleSpaces();
						if(exprICode(index) === QUMARK_CODE) {
							// Ternary expression: test ? consequent : alternate
							index++;
							consequent = gobbleExpression();
							if(!consequent) {
								throwError('Expected expression', index);
							}
							gobbleSpaces();
							if(exprICode(index) === COLON_CODE) {
								index++;
								alternate = gobbleExpression();
								if(!alternate) {
									throwError('Expected expression', index);
								}
								return {
									type: CONDITIONAL_EXP,
									test: test,
									consequent: consequent,
									alternate: alternate
								};
							} else {
								throwError('Expected :', index);
							}
						} else {
							return test;
						}
					},

					// Search for the operation portion of the string (e.g. `+`, `===`)
					// Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
					// and move down from 3 to 2 to 1 character until a matching binary operation is found
					// then, return that binary operation
					gobbleBinaryOp = function() {
						gobbleSpaces();
						var to_check = expr.substr(index, max_binop_len), tc_len = to_check.length;
						while(tc_len > 0) {
							// Don't accept a binary op when it is an identifier.
							// Binary ops that start with a identifier-valid character must be followed
							// by a non identifier-part valid character
							if(binary_ops.hasOwnProperty(to_check) && (
								!isIdentifierStart(exprICode(index)) ||
								(index+to_check.length< expr.length && !isIdentifierPart(exprICode(index+to_check.length)))
							)) {
								index += tc_len;
								return to_check;
							}
							to_check = to_check.substr(0, --tc_len);
						}
						return false;
					},

					// This function is responsible for gobbling an individual expression,
					// e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
					gobbleBinaryExpression = function() {
						var node, biop, prec, stack, biop_info, left, right, i;

						// First, try to get the leftmost thing
						// Then, check to see if there's a binary operator operating on that leftmost thing
						left = gobbleToken();
						biop = gobbleBinaryOp();

						// If there wasn't a binary operator, just return the leftmost node
						if(!biop) {
							return left;
						}

						// Otherwise, we need to start a stack to properly place the binary operations in their
						// precedence structure
						biop_info = { value: biop, prec: binaryPrecedence(biop)};

						right = gobbleToken();
						if(!right) {
							throwError("Expected expression after " + biop, index);
						}
						stack = [left, biop_info, right];

						// Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
						while((biop = gobbleBinaryOp())) {
							prec = binaryPrecedence(biop);

							if(prec === 0) {
								break;
							}
							biop_info = { value: biop, prec: prec };

							// Reduce: make a binary expression from the three topmost entries.
							while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
								right = stack.pop();
								biop = stack.pop().value;
								left = stack.pop();
								node = createBinaryExpression(biop, left, right);
								stack.push(node);
							}

							node = gobbleToken();
							if(!node) {
								throwError("Expected expression after " + biop, index);
							}
							stack.push(biop_info, node);
						}

						i = stack.length - 1;
						node = stack[i];
						while(i > 1) {
							node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
							i -= 2;
						}
						return node;
					},

					// An individual part of a binary expression:
					// e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
					gobbleToken = function() {
						var ch, to_check, tc_len;

						gobbleSpaces();
						ch = exprICode(index);

						if(isDecimalDigit(ch) || ch === PERIOD_CODE) {
							// Char code 46 is a dot `.` which can start off a numeric literal
							return gobbleNumericLiteral();
						} else if(ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
							// Single or double quotes
							return gobbleStringLiteral();
						} else if (ch === OBRACK_CODE) {
							return gobbleArray();
						} else {
							to_check = expr.substr(index, max_unop_len);
							tc_len = to_check.length;
							while(tc_len > 0) {
							// Don't accept an unary op when it is an identifier.
							// Unary ops that start with a identifier-valid character must be followed
							// by a non identifier-part valid character
								if(unary_ops.hasOwnProperty(to_check) && (
									!isIdentifierStart(exprICode(index)) ||
									(index+to_check.length < expr.length && !isIdentifierPart(exprICode(index+to_check.length)))
								)) {
									index += tc_len;
									return {
										type: UNARY_EXP,
										operator: to_check,
										argument: gobbleToken(),
										prefix: true
									};
								}
								to_check = to_check.substr(0, --tc_len);
							}

							if (isIdentifierStart(ch) || ch === OPAREN_CODE) { // open parenthesis
								// `foo`, `bar.baz`
								return gobbleVariable();
							}
						}

						return false;
					},
					// Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
					// keep track of everything in the numeric literal and then calling `parseFloat` on that string
					gobbleNumericLiteral = function() {
						var number = '', ch, chCode;
						while(isDecimalDigit(exprICode(index))) {
							number += exprI(index++);
						}

						if(exprICode(index) === PERIOD_CODE) { // can start with a decimal marker
							number += exprI(index++);

							while(isDecimalDigit(exprICode(index))) {
								number += exprI(index++);
							}
						}

						ch = exprI(index);
						if(ch === 'e' || ch === 'E') { // exponent marker
							number += exprI(index++);
							ch = exprI(index);
							if(ch === '+' || ch === '-') { // exponent sign
								number += exprI(index++);
							}
							while(isDecimalDigit(exprICode(index))) { //exponent itself
								number += exprI(index++);
							}
							if(!isDecimalDigit(exprICode(index-1)) ) {
								throwError('Expected exponent (' + number + exprI(index) + ')', index);
							}
						}


						chCode = exprICode(index);
						// Check to make sure this isn't a variable name that start with a number (123abc)
						if(isIdentifierStart(chCode)) {
							throwError('Variable names cannot start with a number (' +
										number + exprI(index) + ')', index);
						} else if(chCode === PERIOD_CODE) {
							throwError('Unexpected period', index);
						}

						return {
							type: LITERAL,
							value: parseFloat(number),
							raw: number
						};
					},

					// Parses a string literal, staring with single or double quotes with basic support for escape codes
					// e.g. `"hello world"`, `'this is\nJSEP'`
					gobbleStringLiteral = function() {
						var str = '', quote = exprI(index++), closed = false, ch;

						while(index < length) {
							ch = exprI(index++);
							if(ch === quote) {
								closed = true;
								break;
							} else if(ch === '\\') {
								// Check for all of the common escape codes
								ch = exprI(index++);
								switch(ch) {
									case 'n': str += '\n'; break;
									case 'r': str += '\r'; break;
									case 't': str += '\t'; break;
									case 'b': str += '\b'; break;
									case 'f': str += '\f'; break;
									case 'v': str += '\x0B'; break;
									default : str += ch;
								}
							} else {
								str += ch;
							}
						}

						if(!closed) {
							throwError('Unclosed quote after "'+str+'"', index);
						}

						return {
							type: LITERAL,
							value: str,
							raw: quote + str + quote
						};
					},

					// Gobbles only identifiers
					// e.g.: `foo`, `_value`, `$x1`
					// Also, this function checks if that identifier is a literal:
					// (e.g. `true`, `false`, `null`) or `this`
					gobbleIdentifier = function() {
						var ch = exprICode(index), start = index, identifier;

						if(isIdentifierStart(ch)) {
							index++;
						} else {
							throwError('Unexpected ' + exprI(index), index);
						}

						while(index < length) {
							ch = exprICode(index);
							if(isIdentifierPart(ch)) {
								index++;
							} else {
								break;
							}
						}
						identifier = expr.slice(start, index);

						if(literals.hasOwnProperty(identifier)) {
							return {
								type: LITERAL,
								value: literals[identifier],
								raw: identifier
							};
						} else if(identifier === this_str) {
							return { type: THIS_EXP };
						} else {
							return {
								type: IDENTIFIER,
								name: identifier
							};
						}
					},

					// Gobbles a list of arguments within the context of a function call
					// or array literal. This function also assumes that the opening character
					// `(` or `[` has already been gobbled, and gobbles expressions and commas
					// until the terminator character `)` or `]` is encountered.
					// e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
					gobbleArguments = function(termination) {
						var ch_i, args = [], node, closed = false;
						while(index < length) {
							gobbleSpaces();
							ch_i = exprICode(index);
							if(ch_i === termination) { // done parsing
								closed = true;
								index++;
								break;
							} else if (ch_i === COMMA_CODE) { // between expressions
								index++;
							} else {
								node = gobbleExpression();
								if(!node || node.type === COMPOUND) {
									throwError('Expected comma', index);
								}
								args.push(node);
							}
						}
						if (!closed) {
							throwError('Expected ' + String.fromCharCode(termination), index);
						}
						return args;
					},

					// Gobble a non-literal variable name. This variable name may include properties
					// e.g. `foo`, `bar.baz`, `foo['bar'].baz`
					// It also gobbles function calls:
					// e.g. `Math.acos(obj.angle)`
					gobbleVariable = function() {
						var ch_i, node;
						ch_i = exprICode(index);

						if(ch_i === OPAREN_CODE) {
							node = gobbleGroup();
						} else {
							node = gobbleIdentifier();
						}
						gobbleSpaces();
						ch_i = exprICode(index);
						while(ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
							index++;
							if(ch_i === PERIOD_CODE) {
								gobbleSpaces();
								node = {
									type: MEMBER_EXP,
									computed: false,
									object: node,
									property: gobbleIdentifier()
								};
							} else if(ch_i === OBRACK_CODE) {
								node = {
									type: MEMBER_EXP,
									computed: true,
									object: node,
									property: gobbleExpression()
								};
								gobbleSpaces();
								ch_i = exprICode(index);
								if(ch_i !== CBRACK_CODE) {
									throwError('Unclosed [', index);
								}
								index++;
							} else if(ch_i === OPAREN_CODE) {
								// A function call is being made; gobble all the arguments
								node = {
									type: CALL_EXP,
									'arguments': gobbleArguments(CPAREN_CODE),
									callee: node
								};
							}
							gobbleSpaces();
							ch_i = exprICode(index);
						}
						return node;
					},

					// Responsible for parsing a group of things within parentheses `()`
					// This function assumes that it needs to gobble the opening parenthesis
					// and then tries to gobble everything within that parenthesis, assuming
					// that the next thing it should see is the close parenthesis. If not,
					// then the expression probably doesn't have a `)`
					gobbleGroup = function() {
						index++;
						var node = gobbleExpression();
						gobbleSpaces();
						if(exprICode(index) === CPAREN_CODE) {
							index++;
							return node;
						} else {
							throwError('Unclosed (', index);
						}
					},

					// Responsible for parsing Array literals `[1, 2, 3]`
					// This function assumes that it needs to gobble the opening bracket
					// and then tries to gobble the expressions as arguments.
					gobbleArray = function() {
						index++;
						return {
							type: ARRAY_EXP,
							elements: gobbleArguments(CBRACK_CODE)
						};
					},

					nodes = [], ch_i, node;

				while(index < length) {
					ch_i = exprICode(index);

					// Expressions can be separated by semicolons, commas, or just inferred without any
					// separators
					if(ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
						index++; // ignore separators
					} else {
						// Try to gobble each expression individually
						if((node = gobbleExpression())) {
							nodes.push(node);
						// If we weren't able to find a binary expression and are out of room, then
						// the expression passed in probably has too much
						} else if(index < length) {
							throwError('Unexpected "' + exprI(index) + '"', index);
						}
					}
				}

				// If there's only one expression just try returning the expression
				if(nodes.length === 1) {
					return nodes[0];
				} else {
					return {
						type: COMPOUND,
						body: nodes
					};
				}
			};

		// To be filled in by the template
		jsep.version = '0.3.4';
		jsep.toString = function() { return 'JavaScript Expression Parser (JSEP) v' + jsep.version; };

		/**
		 * @method jsep.addUnaryOp
		 * @param {string} op_name The name of the unary op to add
		 * @return jsep
		 */
		jsep.addUnaryOp = function(op_name) {
			max_unop_len = Math.max(op_name.length, max_unop_len);
			unary_ops[op_name] = t; return this;
		};

		/**
		 * @method jsep.addBinaryOp
		 * @param {string} op_name The name of the binary op to add
		 * @param {number} precedence The precedence of the binary op (can be a float)
		 * @return jsep
		 */
		jsep.addBinaryOp = function(op_name, precedence) {
			max_binop_len = Math.max(op_name.length, max_binop_len);
			binary_ops[op_name] = precedence;
			return this;
		};

		/**
		 * @method jsep.addLiteral
		 * @param {string} literal_name The name of the literal to add
		 * @param {*} literal_value The value of the literal
		 * @return jsep
		 */
		jsep.addLiteral = function(literal_name, literal_value) {
			literals[literal_name] = literal_value;
			return this;
		};

		/**
		 * @method jsep.removeUnaryOp
		 * @param {string} op_name The name of the unary op to remove
		 * @return jsep
		 */
		jsep.removeUnaryOp = function(op_name) {
			delete unary_ops[op_name];
			if(op_name.length === max_unop_len) {
				max_unop_len = getMaxKeyLen(unary_ops);
			}
			return this;
		};

		/**
		 * @method jsep.removeAllUnaryOps
		 * @return jsep
		 */
		jsep.removeAllUnaryOps = function() {
			unary_ops = {};
			max_unop_len = 0;

			return this;
		};

		/**
		 * @method jsep.removeBinaryOp
		 * @param {string} op_name The name of the binary op to remove
		 * @return jsep
		 */
		jsep.removeBinaryOp = function(op_name) {
			delete binary_ops[op_name];
			if(op_name.length === max_binop_len) {
				max_binop_len = getMaxKeyLen(binary_ops);
			}
			return this;
		};

		/**
		 * @method jsep.removeAllBinaryOps
		 * @return jsep
		 */
		jsep.removeAllBinaryOps = function() {
			binary_ops = {};
			max_binop_len = 0;

			return this;
		};

		/**
		 * @method jsep.removeLiteral
		 * @param {string} literal_name The name of the literal to remove
		 * @return jsep
		 */
		jsep.removeLiteral = function(literal_name) {
			delete literals[literal_name];
			return this;
		};

		/**
		 * @method jsep.removeAllLiterals
		 * @return jsep
		 */
		jsep.removeAllLiterals = function() {
			literals = {};

			return this;
		};

		// In desktop environments, have a way to restore the old value for `jsep`
		{
			// In Node.JS environments
			if ( module.exports) {
				exports = module.exports = jsep;
			} else {
				exports.parse = jsep;
			}
		}
	}());
	});
	var jsep_1 = jsep.parse;

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
	          if (e instanceof DuplicateNameError) graph.addEdge(root.name, left.name);
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
	          if (e instanceof DuplicateNameError) graph.addEdge(root.name, right.name);
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
	          if (e instanceof DuplicateNameError) graph.addEdge(notNode.name, ast.argument.name);
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
	                if (e instanceof DuplicateNameError) {
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

	          default:
	            throw new ParseError(`_parseASTNode could not parse the UnaryExpression that had a ${ast.operator} operator`);
	        }

	      default:
	        throw new ParseError(`_parseASTNode could not parse the ast.type - parameters passed in were:
					ast.type:	${ast.type}
					ast.operator:	${ast.operator}`);
	    }
	  }

	  static parseRule(rule) {
	    // add custom operators
	    jsep.addUnaryOp('not', 10);
	    jsep.addBinaryOp('and', 10);
	    jsep.addBinaryOp('or', 10);
	    jsep.addBinaryOp('then', 1);

	    try {
	      return jsep(rule);
	    } catch (err) {
	      throw new ParseError(`jsep encountered the following error parsing the supplied rule text:
		RULE TEXT:		${rule}
		JSEP ERROR:		${err}`);
	    }
	  }

	}

	var main = {
	  Graph,
	  Node,
	  DuplicateNameError,
	  RuleBase
	};

	return main;

})));
