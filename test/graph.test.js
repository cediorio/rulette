import { Node, Graph } from "../src/graph";
import { RuleParser } from "../src/ruleParser";
import { jest } from '@jest/globals';

describe("Nodes", () => {
  const nodeA = new Node();
  const nodeB = new Node({ nodeType: "prop" });

  it("should have a default name", () => {
    expect(typeof nodeA.name).toBe("string");
  });

  it("should return a default empty Node object", () => {
    expect(nodeB).toHaveProperty("nodeType", "prop");
  });

  it("should have a default nodeType of 'prop'", () => {
    expect(new Node({ name: "testerA" })).toHaveProperty("nodeType", "prop");
  });
});

describe("Basic Graph Creation", () => {
  const graph = new Graph();
  const A = graph.createNode({ name: "testA", nodeType: "prop" });
  const B = graph.createNode({ name: "testB", nodeType: "prop" });

  it("should create a Graph object", () => {
    expect(graph).toBeInstanceOf(Graph);
  });

  it("should have an adjList property", () => {
    expect(graph).toHaveProperty("adjList");
  });

  it("should have node in the graph's adjacency list", () => {
    expect(graph.adjList).toHaveProperty(A.name, []);
  });

  it("should reject an attempt to provide a name that already exists in the graph", () => {
    expect(() =>
      graph.createNode({ name: "testA", nodeType: "prop" })
    ).toThrow();
  });

  it("should add an edge between nodes A and B", () => {
    graph.addEdge(A, B);
    expect(graph.adjList[A.name]).toContain(B.name);
  });
});

describe("Node operations", () => {
  const graph = new Graph("tester");
  const D = graph.createNode({ name: "D", nodeType: "prop" });
  const or_2 = graph.createNode({ name: "or_2", nodeType: "or" });
  const F = graph.createNode({ name: "F", nodeType: "prop" });
  const and_1 = graph.createNode({ name: "and_1", nodeType: "and" });
  const or_3 = graph.createNode({ name: "or_3", nodeType: "or" });
  const E = graph.createNode({ name: "E", nodeType: "prop" });
  const A = graph.createNode({ name: "A", nodeType: "prop" });
  const or_1 = graph.createNode({ name: "or_1", nodeType: "or" });
  const B = graph.createNode({ name: "B", nodeType: "prop" });
  const C = graph.createNode({ name: "C", nodeType: "prop" });
  const G = graph.createNode({ name: "G", nodeType: "prop" });
  const H = graph.createNode({ name: "H", nodeType: "prop", value: false });

  graph.addEdge(D, or_2);
  graph.addEdge(or_2, F);
  graph.addEdge(or_2, and_1);
  graph.addEdge(F, or_3);
  graph.addEdge(or_3, A);
  graph.addEdge(or_3, E);
  graph.addEdge(and_1, A);
  graph.addEdge(and_1, or_1);
  graph.addEdge(or_1, B);
  graph.addEdge(or_1, C);
  graph.addEdge(G, H);

  describe("Graph.getNodeByName", () => {
    it("should get the list of node objects", () => {
      expect(graph.nodes[0]).toBeInstanceOf(Node);
      expect(graph.nodes.filter(node => node.name === "C")[0]).toHaveProperty(
        "nodeType",
        "prop"
      );
    });

    it("should get a node by name", () => {
      expect(graph.getNodeByName("C")).toHaveProperty("name", "C");
    });

    it("should have a default .value of null", () => {
      expect(graph.getNodeByName("H")).toHaveProperty("value", false);
    });
  });

  describe("Adjacency list", () => {
    it("should have a length of 12", () => {
      expect(graph.nodeNames).toHaveLength(12);
    });

    it("should have no cycles", () => {
      expect(graph.detectCycle()).toBe("NO CYCLE EXISTS");
    });

    it("should have a cycle", () => {
      graph.addEdge(G, H);
      graph.addEdge(H, G);

      expect(graph.detectCycle()).toBe("CYCLE EXISTS");
    });
  });

  describe("Find goal nodes", () => {
    it("should have one goal node, D", () => {
      expect(graph.findGoalNodes()).toEqual(["D"]);
    });
  });
});

describe("evalRTUtil", () => {
  describe("_reject", () => {
    it("should reject a rule tree with an undefined direct child (a 'not' node)", () => {
      const graph = new Graph();
      graph.createNode({ name: "not", nodeType: "not" });
      graph.createNode({ name: "a" });
      graph.addEdge("not", "a");

      let missingValuesStack = [];
      const test = graph.evalRuleTree("not", missingValuesStack);

      expect(test).toHaveProperty("result", "reject");
    });
    it("should reject a rule tree with an undefined descendant (an 'or' or 'and' tree) with a child beyond a single extension", () => {
      const graph = new Graph();
      graph.createNode({ name: "and", nodeType: "and" });
      graph.createNode({ name: "a", value: false });
      graph.createNode({ name: "or", nodeType: "or" });
      graph.createNode({ name: "c" });
      graph.createNode({ name: "d" });
      graph.addEdge("and", "a");
      graph.addEdge("and", "or");
      graph.addEdge("or", "c");
      graph.addEdge("or", "d");

      let missingValuesStack = [];

      const result = graph.evalRuleTree("and", missingValuesStack);

      expect(result).toHaveProperty("result", "reject");
      expect(result.nodes.length).toEqual(4);
    });
  });
});

describe("evalRuleTree (backtracking algorithm) - simple 'not' eval", () => {
  const graph = new Graph();
  graph.createNode({ name: "a" });
  graph.createNode({ name: "not", nodeType: "not" });
  graph.addEdge("not", "a");

  describe("change value of 'not' operand to true", () => {
    it("should eval to false", () => {
      graph.getNodeByName("a").value = true;
      const result = graph.evalGoalNodes(["not"]);

      expect(result.not).toHaveProperty("result", "accept");
      expect(result.not.nodes).toHaveProperty("_value", false);
    });
  });

  describe("change value of 'not' operand to false", () => {
    it("should eval to false", () => {
      graph.getNodeByName("not").value = null; // have to reset value, since we're using the same graph object!!
      graph.getNodeByName("a").value = false;
      const result = graph.evalGoalNodes(["not"]);

      expect(result.not).toHaveProperty("result", "accept");
      expect(result.not.nodes).toHaveProperty("_value", true);
    });
  });
});

describe("evalRuleTree (backtracking algorithm) - simple 'and' eval", () => {
  const graph = new Graph();
  graph.createNode({ name: "a" });
  graph.createNode({ name: "b" });
  graph.createNode({ name: "and", nodeType: "and" });
  graph.addEdge("and", "a");
  graph.addEdge("and", "b");

  describe("when 'a' = false and 'b' = false", () => {
    it("should eval to false", () => {
      graph.getNodeByName("a").value = false;
      graph.getNodeByName("b").value = false;
      const result = graph.evalGoalNodes(["and"]);

      expect(result.and).toHaveProperty("result", "accept");
      expect(result.and.nodes).toHaveProperty("_value", false);
    });
  });

  describe("when 'a' = true and 'b' = true", () => {
    it("should eval to true", () => {
      graph.getNodeByName("a").value = true;
      graph.getNodeByName("b").value = true;
      graph.getNodeByName("and").value = null; // need to reset value
      const result = graph.evalGoalNodes(["and"]);

      expect(result.and).toHaveProperty("result", "accept");
      expect(result.and.nodes).toHaveProperty("_value", true);
    });
  });
});

describe("evalRuleTree (backtracking algorithm) - simple 'or' eval", () => {
  const graph = new Graph();
  graph.createNode({ name: "a" });
  graph.createNode({ name: "b" });
  graph.createNode({ name: "or", nodeType: "or" });
  graph.addEdge("or", "a");
  graph.addEdge("or", "b");

  describe("when 'a' = false and 'b' = false", () => {
    it("should eval to false", () => {
      graph.getNodeByName("a").value = false;
      graph.getNodeByName("b").value = false;
      const result = graph.evalGoalNodes(["or"]);

      expect(result.or).toHaveProperty("result", "accept");
      expect(result.or.nodes).toHaveProperty("_value", false);
    });
  });

  describe("when 'a' = true and 'b' = false", () => {
    it("should eval to true", () => {
      graph.getNodeByName("a").value = true;
      graph.getNodeByName("b").value = false;
      graph.getNodeByName("or").value = null;
      const result = graph.evalGoalNodes(["or"]);

      expect(result.or).toHaveProperty("result", "accept");
      expect(result.or.nodes).toHaveProperty("_value", true);
    });
  });

  describe("when 'a' = false and 'b' = true", () => {
    it("should eval to true", () => {
      graph.getNodeByName("a").value = false;
      graph.getNodeByName("b").value = true;
      graph.getNodeByName("or").value = null;
      const result = graph.evalGoalNodes(["or"]);

      expect(result.or).toHaveProperty("result", "accept");
      expect(result.or.nodes).toHaveProperty("_value", true);
    });
  });
});

describe("evalRuleTree (backtracking algorithm)", () => {
  const graph = new Graph();
  graph.createNode({ name: "d" });
  graph.createNode({ name: "and", nodeType: "and" });
  graph.createNode({ name: "a" });
  graph.createNode({ name: "or", nodeType: "or" });
  graph.createNode({ name: "b", value: true });
  graph.createNode({ name: "not", nodeType: "not" });
  graph.createNode({ name: "c", value: false });
  graph.addEdge("d", "and");
  graph.addEdge("and", "a");
  graph.addEdge("and", "or");
  graph.addEdge("or", "b");
  graph.addEdge("or", "not");
  graph.addEdge("not", "c");

  it("should throw an error if there is no supplied node name (the root of the partial candidate)", () => {
    expect(() => graph.evalRuleTree()).toThrow(
      "You must supply a root node to begin the backtracking search."
    );
  });

  it("should accept if the value of the root of the candidate is known to be false", () => {
    expect(graph.evalRuleTree("c")).toHaveProperty("result", "accept");
    expect(graph.evalRuleTree("c").nodes).toHaveProperty("value", false);
  });

  it("should accept if the value of the root of the candidate is known to be true", () => {
    expect(graph.evalRuleTree("b")).toHaveProperty("result", "accept");
    expect(graph.evalRuleTree("b").nodes).toHaveProperty("value", true);
  });

  it("should accept where an undefined root has a known truth-value child", () => {
    expect(graph.evalRuleTree("not")).toHaveProperty("result", "accept");
    expect(graph.evalRuleTree("not").nodes).toHaveProperty("value", true);
  });

  it("should accept where the root is an 'or' operator and it has children with known truth values", () => {
    expect(graph.evalRuleTree("or")).toHaveProperty("result", "accept");
    expect(graph.evalRuleTree("or").nodes).toHaveProperty("value", true);
  });

  it("should return missingValuesStack after evaluation where the root has an 'and' operator and it has a null child", () => {
    let missingValuesStack = [];
    const result = graph.evalRuleTree("d", missingValuesStack);

    expect(result).toHaveProperty("result", "reject");
    expect(result.nodes).toEqual(["and", "a", "d"]);
  });

  it("should return the result object node where the root has an 'and' operator and the previously false child is set to true", () => {
    const a = graph.getNodeByName("a");
    a.value = true;
    const result = graph.evalRuleTree("d");

    expect(result).toHaveProperty("result", "accept");
  });
});

describe("evalGoalNodes - simple one rule if-then", () => {
  const graph = new Graph();
  const ast = RuleParser.parseRule("d then e");
  const updatedGraph = RuleParser.createRuleTree(ast, graph);
  const adjList = updatedGraph.adjList;
  updatedGraph.getNodeByName("d").value = true;
  const goalNodes = updatedGraph.findGoalNodes();

  const result = updatedGraph.evalGoalNodes(goalNodes);

  it("should eval to accepted", () => {
    expect(result.e.result).toEqual("accept");
  });

  it("result.e.nodes.value should be true", () => {
    expect(result.e.nodes.value).toEqual(true);
  });
});

describe("evalGoalNodes - simple one rule with not LHS", () => {
  const graph = new Graph();
  const ast = RuleParser.parseRule("not d then e");
  const updatedGraph = RuleParser.createRuleTree(ast, graph);
  const adjList = updatedGraph.adjList;
  updatedGraph.getNodeByName("d").value = false;
  const goalNodes = updatedGraph.findGoalNodes();
  const result = updatedGraph.evalGoalNodes(goalNodes);

  it("should eval to accepted", () => {
    expect(result.e.result).toEqual("accept");
  });

  it("result.e.nodes.value should be true", () => {
    expect(result.e.nodes.value).toEqual(true);
  });
});

describe("evalGoalNodes - simple three rule graph", () => {
  const graph = new Graph();
  const ast1 = RuleParser.parseRule("a and (b or not c) then d");
  RuleParser.createRuleTree(ast1, graph);
  const ast2 = RuleParser.parseRule("d then e");
  let updatedGraph = RuleParser.createRuleTree(ast2, graph);
  const ast3 = RuleParser.parseRule("e and f then g");
  updatedGraph = RuleParser.createRuleTree(ast3, graph);
  const adjList = updatedGraph.adjList;
  updatedGraph.getNodeByName("a").value = false;
  updatedGraph.getNodeByName("b").value = true;
  updatedGraph.getNodeByName("f").value = true;
  const goalNodes = updatedGraph.findGoalNodes();

  const result = updatedGraph.evalGoalNodes(goalNodes);

  it("result should be accept", () => {
    expect(result.g.result).toEqual("accept");
  });

  it("result.e.nodes.value should be false", () => {
    expect(result.g.nodes.value).toEqual(false);
  });
});

describe("traverseNodesBFS", () => {
  const graph = new Graph();
  const ast1 = RuleParser.parseRule("b and (not f or (g and not h) ) then a");
  let updatedGraph = RuleParser.createRuleTree(ast1, graph);
  const ast2 = RuleParser.parseRule(" not c or e then b");
  updatedGraph = RuleParser.createRuleTree(ast2, graph);

  const path = updatedGraph.traverseNodesBFS("a");

  it("should provide the correct path to the last leaves of the tree", () => {
    expect(path.pathOfProps).toEqual(["a", "b", "f", "c", "e", "g", "h"]);
    expect(path.pathOfNodes[1]).toEqual(expect.stringMatching(/^and.*/));
    expect(path.pathOfNodes[3]).toEqual(expect.stringMatching(/^or.*/));
    expect(path.pathOfNodes[8]).toEqual(expect.stringMatching(/^not.*/));
  });
  it("should provide the correct path if provided a leaf in the tree", () => {
    expect(updatedGraph.traverseNodesBFS("b").pathOfProps).toEqual([
      "b",
      "c",
      "e"
    ]);
  });
  it("should provide the correct path if provided a leaf in the tree", () => {
    expect(updatedGraph.traverseNodesBFS("f").pathOfProps).toEqual(["f"]);
  });
});


describe( "RuleParser.findGoalNodes", () => {
  const graph = new Graph();
  const ast = RuleParser.parseRule('a and (b or not c) then d');
  const updatedGraph = RuleParser.createRuleTree( ast, graph );
  const adjList = updatedGraph.adjList;
  const goalNodes = updatedGraph.findGoalNodes();
  
  it( "should find the goal node of 'd' in the rule tree", () => {
    expect( goalNodes ).toEqual( ['d'] );
  });

});


describe( "RuleParse.evalGoalNodes test multiple rules", () => {
  const graph = new Graph();
  const ast1 = RuleParser.parseRule('a and b then c');
  const ast2 = RuleParser.parseRule('c or d then e');
  RuleParser.createRuleTree( ast1, graph);
  RuleParser.createRuleTree( ast2, graph);
  const goalNodes = graph.findGoalNodes();
  let result = graph.evalGoalNodes(goalNodes);
  it( "should be rejected because the facts are null", () => {
    expect( result.e.result ).toBe('reject');
  });
  let a = graph.getNodeByName('a');
  a.value = true;
  let result2 = graph.evalGoalNodes(goalNodes);
  it( "should still be rejected because only 'a' is true", () => {
    expect( result2.e.result ).toBe('reject');
  });
  let b = graph.getNodeByName('b');
  b.value = true;
  let result3 = graph.evalGoalNodes(goalNodes);
  it( "should now be accepted because 'a' and 'b' are true", () => {
    expect( result3.e.result ).toBe('accept');
  });  
});

