/* Nodes are of type 'op'{erator} or 'prop'{osition}
 */

export class Graph {
  constructor({ name = "" } = {}) {
    this._name = name;
    this._adjList = {};
    this._nodes = [];
    this._log = "";
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
    args["nodeNames"] = this.nodeNames;
    // console.log(`from createNode: this.nodeNames = ${'test' in args.nodeNames}`);
    let n = new Node(args);
    // console.log(`Node name: ${n.name}`);
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
    if (typeof vertex1 !== "undefined" && typeof vertex2 !== "undefined") {
      if (typeof vertex1 === "object" && typeof vertex2 === "object")
        this._adjList[vertex1.name].push(vertex2.name);
      if (typeof vertex1 === "string" && typeof vertex2 === "string")
        this._adjList[vertex1].push(vertex2);
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
      const neighbours = this.adjList[node];
      // console.log(`node: ${node}\nvisited: ${visited[node]}\nneighbours: ${neighbours}`);
      if (typeof neighbours !== "undefined") {
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
      if (this._detectCycleUtil(node, visited, recStack)) return "CYCLE EXISTS";
    }

    return "NO CYCLE EXISTS";
  }

  _detectCycleUtil(node, visited, recStack) {
    if (!visited[node]) {
      visited[node] = true;
      recStack[node] = true;
      const nodeNeighbours = this.adjList[node];
      if (typeof nodeNeighbours !== "undefined") {
        for (let currentNode of nodeNeighbours) {
          // console.log(`parent: ${node}, Child: ${currentNode}`);
          if (
            !visited[currentNode] &&
            this._detectCycleUtil(currentNode, visited, recStack)
          ) {
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
    const nodesWithParents = new Set(
      Object.entries(hasParentTestList)
        .filter(e => e[1] === true)
        .map(e => e[0])
    );

    const goalNodes = this.nodeNames.filter(e => !nodesWithParents.has(e));
    return goalNodes;
  }

  evalGoalNodes(goals) {
    let results = {};

    for (let goal of goals) {
      let missingValuesStack = []; // init to empty
      results[goal] = this.evalRuleTree(goal, missingValuesStack);
    }

    return results;
  }

  evalRuleTree(c, missingValuesStack) {
    // _evalRTUtil will return an object with the truthiness of
    // the evaluated rule tree if it can reject or accept it and
    // the node that was evaluated -- otherwise, it returns an
    // array of the props it was unable to find values for
    const visited = {}; // note that this isn't currently set anywhere, but may become useful
    // in future to iterate where facts are solicited interactively
    const result = this._evalRTUtil(c, visited, missingValuesStack);
    return result;
  }

  _evalRTUtil(c, visited, missingValuesStack) {
    /* Will return: (1) on success: the node that was successfully
     * evaluated; (2) on failure, an array containing the nodes
     * which are missing truth values.
     */

    if (typeof c === "undefined")
      throw new Error(
        "You must supply a root node to begin the backtracking search."
      );

    if (this._reject(c, missingValuesStack))
      return {
        result: "reject",
        nodes: missingValuesStack
      };

    if (this._accept(c))
      return {
        result: "accept",
        nodes: this.getNodeByName(c)
      };

    const children = this.adjList[c];

    for (let s of children) {
      if (!visited[s]) this._evalRTUtil(s, visited);
    }

    throw new Error(`_evalRTUtil was unable to evaluate the rule tree provided:
				rule tree root node: ${this.getNodeByName(c).name}
			`);
  }

  _checkIfUndefined(c) {
    const node = this.getNodeByName(c);
    if (node.value === null) {
      return true;
    } else return false;
  }

  pushToMissingValues(n, missingValuesStack) {
    if (!(n instanceof Node))
      throw new Error("usage: pushToMissingValues( <Node> )");
    if (n.value === null) {
      if (!missingValuesStack.includes(n.name)) missingValuesStack.push(n.name);
    }
  }

  _reject(c, missingValuesStack) {
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
    const RHS = operator === "prop" && children.length > 0;
    // if the node is an RHS, then give it a special operator
    operator = RHS ? "rhs" : operator;
    const left = children[0];
    const right = children[1];
    let leftUndefValue = left ? this._checkIfUndefined(children[0].name) : null;
    // a node that is either a 'not' or an RHS will have no right child
    let rightUndefValue =
      operator !== "not" &&
      !RHS &&
      (right ? this._checkIfUndefined(children[1].name) : null);

    switch (operator) {
      case "rhs":
      case "not":
        leftUndefValue =
          leftUndefValue &&
          (this.adjList[left.name].length > 0
            ? this._reject(left.name, missingValuesStack)
            : true);

        if (rootUndefValue && leftUndefValue) {
          // only one operand with 'not'
          [root, left].forEach(e =>
            this.pushToMissingValues(e, missingValuesStack)
          );
          return true;
        }
        break;

      case "and":
        leftUndefValue =
          leftUndefValue &&
          (this.adjList[left.name].length > 0
            ? this._reject(left.name, missingValuesStack)
            : true);
        rightUndefValue =
          rightUndefValue &&
          (this.adjList[right.name].length > 0
            ? this._reject(right.name, missingValuesStack)
            : true);

      if (rootUndefValue && (leftUndefValue || rightUndefValue)) {
	// console.log(`
	// 	NEW TESTS:
	// 	root.name: ${root.name}
	// 	rootUndefValue: ${rootUndefValue}
	// 	left.name: ${left.name}
	// 	leftUndefValue: ${leftUndefValue}
	// 	right.name: ${right.name}
	// 	rightUndefValue: ${rightUndefValue}
	// 	missingValuesStack: ${missingValuesStack}`);

          [root, left, right].forEach(e =>
            this.pushToMissingValues(e, missingValuesStack)
          );
          return true;
        }
        break;

      case "or":
        leftUndefValue =
          leftUndefValue &&
          (this.adjList[left.name].length > 0
            ? this._reject(left.name, missingValuesStack)
            : true);
        rightUndefValue =
          rightUndefValue &&
          (this.adjList[right.name].length > 0
            ? this._reject(right.name, missingValuesStack)
            : true);

        if (rootUndefValue && leftUndefValue && rightUndefValue) {
          [root, left, right].forEach(e =>
            this.pushToMissingValues(e, missingValuesStack)
          );
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
    const RHS = operator === "prop" && children.length > 0;
    // if the root is an RHS, then give it a special operator
    operator = RHS ? "rhs" : operator;
    const left = this.getNodeByName(children[0]);
    const right = this.getNodeByName(children[1]);

    // return true if the root already has a value
    if (root.value !== null) return true;

    // different tests for different operators, obviously

    switch (operator) {
      case "rhs":
        if (left.value !== null) {
          root.value = left.value;
          return true;
        } else if (this._accept(left.name)) {
          root.value = left.value;
          return true;
        }
        break;
      case "not":
        if (left.value === null) this._accept(left.name);
        root.value = left.value ? false : true;
        return true;
        break;

      case "or":
        if (left.value === null) this._accept(left.name);
        if (right.value === null) this._accept(right.name);

        root.value = left.value || right.value;
        return true;
        break;

      case "and":
        if (left.value === null) this._accept(left.name);
        if (right.value === null) this._accept(right.name);

        root.value = left.value && right.value;
        return true;
        break;
    }
    return false;
  } // end _accept

  traverseNodesBFS(c) {
    // the path of left and right nodes all the way to the bottom
    // of the tree, by breadth

    let pathOfProps = []; // this is only the props (facts and RHSs)
    let pathOfNodes = []; // full list of all nodes in the path
    let queue = [c];
    const _addToPathBFS = c => {
      let node = this.getNodeByName(c);
      // push the node name onto the pathOfNodes
      pathOfNodes.push(c);
      // if the node is a not, first push it onto the pathOfNodes and
      // then sub in its operand, which is the first entry in the
      // adjList for that node
      if (node.nodeType === "not") {
        pathOfNodes.push(this.adjList[node.name][0]);
        c = this.adjList[node.name][0];
      }
      if (this.getNodeByName(c).nodeType === "prop") pathOfProps.push(c);
      for (let i of this.adjList[c]) queue.unshift(i);
    };

    while (queue.length > 0) {
      _addToPathBFS(queue.pop());
    }

    return {
      pathOfNodes: pathOfNodes,
      pathOfProps: pathOfProps
    };
  }
}

export class Node {
  constructor({
    name = null,
    nodeType = "prop",
    value = null,
    nodeNames = []
  } = {}) {
    // let {name, nodeType, value, nodeNames} = args;

    this.name = { name: name, nodeType: nodeType, takenNames: nodeNames };
    this.nodeType = nodeType;
    this.value = value;
  }

  // has to be a props object with {name: <name>, nodeType: <nodeType>, takenNames: <names
  // that are not available>}
  set name({ name = null, nodeType = null, takenNames = [] } = {}) {
    // throw if name is already in the graph
    if (takenNames && takenNames.includes(name))
      throw new DuplicateNameError(
        `Node name ${name} has already been used in this graph instance.`
      );
    // generate a unique name if a unique name isn't provided
    if (name) this._name = name;
    else {
      this._name = _uniqueName(nodeType, takenNames);
    }
  }

  get name() {
    return this._name;
  }

  set nodeType(nodeType) {
    // enforce use one of the permissible nodeTypes (defaults to 'prop' when no args are provided)
    const nodeTypes = ["prop", "and", "or", "not"];
    if (nodeTypes.includes(nodeType)) this._nodeType = nodeType;
    else if (typeof nodeType !== "undefined")
      throw new Error(`nodeType must be one of ${nodeTypes}`);
    else this._nodeType = "prop";
  }

  get nodeType() {
    return this._nodeType;
  }

  // enforces use of set valueTypes
  set value(value) {
    const valueTypes = [true, false, "true", "false"]; // truth values may be received as strings

    if (valueTypes.includes(value)) {
      if (value === "true") value = true;
      if (value === "false") value = false;
      this._value = value;
    } else if (
      value !== null &&
      typeof value !== "undefined" &&
      !valueTypes.includes(value)
    ) {
      throw new Error(`value must be one of ${valueTypes}`);
    } else this._value = null;
  }

  get value() {
    return this._value;
  }

}

const _uniqueName = (nodeType, takenNames) => {
  let proposedName = _defaultName(nodeType);
  if (typeof takenNames === "undefined" || takenNames.length < 1)
    return proposedName;
  else if (proposedName in takenNames) _uniqueName(takenNames);
  else return proposedName;
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
    return String.fromCharCode(
      parseInt(((e - rMin) / (rMax - rMin)) * (tMax - tMin) + tMin)
    );
  };
  var name = "";
  for (let i = 0; i < randomWordLen; i++) {
    name += charNum(Math.random());
  }

  name = nodeType + "_" + name;

  return name;
};

export class DuplicateNameError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "DuplicateNameError";
  }
}
