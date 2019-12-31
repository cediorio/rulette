import { Node, Graph } from '../src/graph';

describe("Nodes", () => {
    const nodeA = new Node();
    const nodeB = new Node({nodeType: 'prop',});
    
    it("should return a default empty Node object", () => {
	expect(nodeB).toHaveProperty('nodeType', 'prop');
    });

});

describe("Basic Graph Creation", () => {
    
    const graph = new Graph();
    const A = graph.createNode({name: 'testA'});
    const B = graph.createNode({name: 'testB'});

    it("should create a Graph object", () => {
    	expect(graph).toBeInstanceOf(Graph);
    });
    
    it("should have an adjList property", () => {
	expect(graph).toHaveProperty('adjList');
    });

    it("should add node to the graph's adjacency list", () => {
	expect(graph.adjList).toHaveProperty(A.name, []);
    });

    it("should add an edge between nodes A and B", () => {
	graph.addEdge(A,B);
	expect(graph.adjList[A.name]).toContain(B.name);
    });    
});

const graph = new Graph("tester");
const D = graph.createNode({name: 'D', nodeType: 'prop', value: false });
const or_2 = graph.createNode({name: 'or_2', nodeType: 'op', value: false });
const F = graph.createNode({name: 'F', nodeType: 'prop', value: false });
const and_1 = graph.createNode({name: 'and_1', nodeType: 'op', value: false });
const or_3 = graph.createNode({name: 'or_3', nodeType: 'op', value: false });
const E = graph.createNode({name: 'E', nodeType: 'prop', value: false });
const A = graph.createNode({name: 'A', nodeType: 'prop', value: false });
const or_1 = graph.createNode({name: 'or_1', nodeType: 'op', value: false });
const B = graph.createNode({name: 'B', nodeType: 'prop', value: false });
const C = graph.createNode({name: 'C', nodeType: 'prop', value: false });
graph.addEdge(D, or_2);
graph.addEdge(or_2, F);
graph.addEdge(or_2, and_1);
graph.addEdge(F, or_3);
graph.addEdge(or_3, A);
graph.addEdge(and_1, A);
graph.addEdge(and_1, or_1);
graph.addEdge(or_1, B);
graph.addEdge(or_1, C);

describe("Adjacency list", () => {

        it("should have a length of 10", () => {
	    expect(graph.nodeNames).toHaveLength(10);
	});

    it("should have no cycles", () => {
	expect(graph.detectCycle()).toBe('NO CYCLE EXISTS');
    });
});

graph.dfs ();


