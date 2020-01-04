import { Node, Graph } from '../src/graph';

describe("Nodes", () => {
    const nodeA = new Node();
    const nodeB = new Node({nodeType: 'prop',});
    
    it( "should have a default name", () => {
	expect( typeof nodeA.name ).toBe('string');
    });
    
    it("should return a default empty Node object", () => {
	expect(nodeB).toHaveProperty('nodeType', 'prop');
    });

    it("should have a default nodeType of 'prop'", () => {
	expect( new Node({name: 'testerA'}) ).toHaveProperty('nodeType', 'prop');
    });

});

describe("Basic Graph Creation", () => {
    
    const graph = new Graph();
    const A = graph.createNode({name: 'testA', nodeType: 'prop'});
    const B = graph.createNode({name: 'testB', nodeType: 'prop'});

    it("should create a Graph object", () => {
    	expect(graph).toBeInstanceOf(Graph);
    });
    
    it("should have an adjList property", () => {
	expect(graph).toHaveProperty('adjList');
    });

    it("should have node in the graph's adjacency list", () => {
	expect(graph.adjList).toHaveProperty(A.name, []);
    });

    it("should reject an attempt to provide a name that already exists in the graph", () => {
	expect( () => graph.createNode({name: 'testA', nodeType: 'prop'})).toThrow();
    });

    it("should add an edge between nodes A and B", () => {
	graph.addEdge(A,B);
	expect(graph.adjList[A.name]).toContain(B.name);
    });    
});

const graph = new Graph("tester");
const D = graph.createNode({name: 'D', nodeType: 'prop'});
const or_2 = graph.createNode({name: 'or_2', nodeType: 'or'});
const F = graph.createNode({name: 'F', nodeType: 'prop'});
const and_1 = graph.createNode({name: 'and_1', nodeType: 'and'});
const or_3 = graph.createNode({name: 'or_3', nodeType: 'or'});
const E = graph.createNode({name: 'E', nodeType: 'prop'});
const A = graph.createNode({name: 'A', nodeType: 'prop'});
const or_1 = graph.createNode({name: 'or_1', nodeType: 'or'});
const B = graph.createNode({name: 'B', nodeType: 'prop'});
const C = graph.createNode({name: 'C', nodeType: 'prop'});
const G = graph.createNode({name: 'G', nodeType: 'prop'});
const H = graph.createNode({name: 'H', nodeType: 'prop', value: false });

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

describe( "Node operations", () => {
    it( "should get the list of node objects", () => {
	expect( graph.nodes[0] ).toBeInstanceOf( Node );
	expect( graph.nodes.filter(node => node.name === 'C')[0] ).toHaveProperty('nodeType', 'prop');
    });

    it( "should get a node by name", () => {
	expect( graph.getNodeByName('C') ).toHaveProperty('name', 'C');
    });

    it( "should have a default .value of null", () => {
	expect( graph.getNodeByName('H') ).toHaveProperty('value', false);
    });
});

describe( "Adjacency list", () => {

    it( "should have a length of 12", () => {
	expect(graph.nodeNames).toHaveLength(12);
    });

    it( "should have no cycles", () => {
	expect(graph.detectCycle()).toBe('NO CYCLE EXISTS');
    });

    it( "should have a cycle", () => {
    
	graph.addEdge(G, H);
	graph.addEdge(H, G);
	
	expect( graph.detectCycle()).toBe('CYCLE EXISTS');
    });
});

describe( "Find goal nodes", () => {
    it( "should have one goal node, D", () => {

	expect( graph.findGoalNodes() ).toEqual( ['D'] );
    });
});

describe( "evalRuleTree (backtracking algorithm) - simple not eval with operand set to false", () => {
    const graph = new Graph();
    graph.createNode( { name: 'a', value: false } );
    graph.createNode( { name: 'not', nodeType: 'not' } );
    graph.addEdge( 'not', 'a' );
    debugger;
    it( "should eval to true", () => {
	expect( graph.evalGoalNodes( 'not' ) ).toHaveProperty( 'truthiness', true );
    });

    describe( "change value of 'not' operand to false", () => {
	graph.getNodeByName('a').value = true;

	it( "should eval to false", () => {
	    expect( graph.evalRuleTree( 'not' ) ).toHaveProperty( 'truthiness', false );
	});
    });
});


describe.skip( "evalRuleTree (backtracking algorithm)", () => {
    const graph = new Graph();
    graph.createNode({name: 'd'});
    graph.createNode({name: 'and', nodeType: 'and'});
    graph.createNode({name: 'a'});
    graph.createNode({name: 'or', nodeType: 'or'});
    graph.createNode({name: 'b', value: true});
    graph.createNode({name: 'not', nodeType: 'not'});
    graph.createNode({name: 'c', value: false});
    graph.addEdge('d', 'and');
    graph.addEdge('and', 'a');
    graph.addEdge('and', 'or');
    graph.addEdge('or', 'b');
    graph.addEdge('or', 'not');
    graph.addEdge('not', 'c');
    

    it( "should throw an error if there is no supplied node name (the root of the partial candidate)", () => {
	expect( ()=> graph.evalRuleTree() ).toThrow('You must supply a root node to begin the backtracking search.');
    });

    it( "should reject if the value of the root of the candidate is unknown", () => {
	expect( graph.evalRuleTree( 'c' ) ).toHaveProperty('truthiness', false);
    });

    it( "should return the result object if the root of the candidate is true", () => {
	expect( graph.evalRuleTree( 'b' ) ).toHaveProperty('node');
    });

    it( "should return the result object with node after evaluation to true where the root is a 'not' operator and its child is false", () => {
	expect( graph.evalRuleTree( 'not' ) ).toHaveProperty('truthiness', true);
    });

    it( "should return the result object with the node after evaluation to true where the root is an 'or' operator and it has children to be evaluated with a true branch", () => {
	expect( graph.evalRuleTree( 'or' ) ).toHaveProperty('node');
    });

    it( "should return missingValuesStack after evaluation where the root has an 'and' operator and it has a null child", () => {
	expect( graph.evalRuleTree( 'd' ) ).toHaveProperty('missing', ['a']);
    });

    it( "should return the result object node where the root has an 'and' operator and the previously false child is set to true", () => {
	const a = graph.getNodeByName('a');
	a.value = true;
	
	expect( graph.evalRuleTree( 'd' ) ).toHaveProperty('truthiness', true);
    });    
});

describe( "Evaluate a set of goal nodes", () => {
    const goals = graph.findGoalNodes();
    const evalGoals = graph.evalGoalNodes( goals );
    expect( evalGoals ).toHaveProperty('D');
    expect( evalGoals["D"] ).toHaveProperty('missing');
});

