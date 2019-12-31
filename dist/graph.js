"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Node = exports.Graph = void 0;

/* Nodes are of type 'op'{erator} or 'prop'{osition}
 */
class Graph {
  constructor(args = {
    name: ''
  }) {
    this._name = args.name;
    this._adjList = {};
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

  createNode(args = {
    name: null,
    nodeType: null,
    value: null
  }) {
    args['nodeNames'] = this.nodeNames;
    console.log(this.nodeNames);
    let n = new Node(args);
    this.addNode(n);
    return n;
  }

  addNode(node) {
    this._adjList[node.name] = [];
  }

  addEdge(args = {
    vertex1: null,
    vertex2: null
  }) {
    let {
      vertex1,
      vertex2
    } = args;

    if (typeof vertex1 !== 'undefined' && typeof vertex2 !== 'undefined') {
      this._adjList[vertex1.name].push(vertex2.name);
    } else {
      throw new Error("addEdge requires two nodes/vertices to create an edge");
    }
  }

  get adjList() {
    return this._adjList;
  }

  evalNode(args = {
    n: n,
    recStack: recStack,
    adjList: adjList
  }) {
    if (args.n.value) return true;
    if (typeof recStack === 'undefined') recStack = adjList[args.n];
    console.log(`adjList contents: ${adjList[args.n]}`);
    return recStack;
  }

}

exports.Graph = Graph;

class Node {
  constructor(args = {
    name: null,
    nodeType: 'prop',
    value: null,
    nodeNames: null
  }) {
    let {
      name,
      nodeType,
      value,
      nodeNames
    } = args;
    if (typeof name !== 'undefined') this.name = name;else {
      this.name = _uniqueName(nodeNames);
    }
    this.nodeType = args.nodeType === 'op' ? 'op' : 'prop';
    this.value = typeof value !== 'undefined' ? value : false;
  }

}

exports.Node = Node;

const _uniqueName = takenNames => {
  let proposedName = _defaultName();

  if (proposedName in takenNames) _uniqueName(takenNames);else return proposedName;
};

const _defaultName = () => {
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

  return name;
};
//# sourceMappingURL=graph.js.map