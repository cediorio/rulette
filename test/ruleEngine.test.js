import { RuleBase, ParseError } from '../src/ruleEngine';
import { Graph } from '../src/graph';

describe( "RuleBase.parseRule to AST", () => {
    it( "should return an abstract syntax tree", () => {
	const graph = new Graph();
	const ast = RuleBase.parseRule('a and (b or not c) then d', graph);
	// console.log( ast.left.right );
	expect( typeof ast).toBe('object');
	expect( ast ).toEqual(
	    { type: 'BinaryExpression',
              operator: 'then',
              left:
              { type: 'BinaryExpression',
		operator: 'and',
		left: { type: 'Identifier', name: 'a' },
		right:
		{ type: 'BinaryExpression',
		  operator: 'or',
		  left: { type: 'Identifier', name: 'b' },
		  right:
		  { type: 'UnaryExpression',
		    operator: 'not',
		    argument: { type: 'Identifier', name: 'c' },
		    prefix: true }
		}
	      } ,
	      right: { type: 'Identifier', name: 'd' }
	    }
	);
    });

    describe( "RuleBase.parseRule grammars", () => {
	it( "should handle a variety of logical expressions", () => {
	    expect( RuleBase.parseRule( 'a' )).toStrictEqual(
		{"name": "a", "type": "Identifier"}
	    );
	    expect( RuleBase.parseRule( 'not a' )).toStrictEqual(
		{"argument": {"name": "a", "type": "Identifier"}, "operator": "not", "prefix": true, "type": "UnaryExpression"}
	    );
	    expect( () => RuleBase.parseRule( 'not alphaGetty and not and b and c )' )).toThrow(ParseError);
	    expect( RuleBase.parseRule( 'a and not ( b and c )' )).toStrictEqual(
		{
		    "left": {
			"name": "a",
			"type": "Identifier"
		    },
		    "operator": "and",
		    "right": {
			"argument": {
			    "left": {
				"name": "b",
				"type": "Identifier"
			    },
			    "operator": "and",
			    "right": {
				"name": "c",
				"type": "Identifier"
			    },
			    "type": "BinaryExpression"
			},
			"operator": "not",
			"prefix": true,
			"type": "UnaryExpression"
		    },
		    "type": "BinaryExpression"
		}
	    );
	});
    });
    
    describe( "RuleBase.createRuleTree", () => {
	it( "should throw a ParseError", () => {
	    const graph = new Graph();
	    const ast = RuleBase.parseRule('a and (b or not c) then d');

	    expect( () => RuleBase.createRuleTree( ast ) ).toThrow(ParseError);
	    expect( () => {
		RuleBase.createRuleTree( ast, graph );
	    }).not.toThrow();
	});
    });

    describe( "RuleBase.createRuleTree", () => {
	const graph = new Graph();
	const ast = RuleBase.parseRule('a and (b or not c) then d');
	const updatedGraph = RuleBase.createRuleTree( ast, graph );
	const adjList = updatedGraph.adjList;
	
	it( "should return a Graph object with the rule parsed into new nodes with appropriate edges", () => {
	    expect( adjList ).toMatchObject(
		{ d: [ expect.stringMatching(/and_.*/) ] }
	    );
	    expect( Object.keys(adjList) )
		.toEqual( expect.arrayContaining(
		    [
			'd',
			expect.stringMatching(/and_.*/),
			'a',
			expect.stringMatching(/or_.*/),
			'b',
			expect.stringMatching(/not_.*/), 'c']
		));
	});

    });

    describe( "RuleBase.createRuleTree with intra-rule references", () => {
	const graph = new Graph();
	const ast1 = RuleBase.parseRule('a and b then c');
	const ast2 = RuleBase.parseRule('c then d');
	RuleBase.createRuleTree( ast1, graph );
	const updatedGraph = RuleBase.createRuleTree( ast2, graph );
	const adjList = updatedGraph.adjList;
	
	it( "node d should have an edge to c", () => {
	    expect( adjList['d'].includes('c') ).toBe(true);
	});
    });
});

describe( "RuleBase.findGoalNodes", () => {
    const graph = new Graph();
    const ast = RuleBase.parseRule('a and (b or not c) then d');
    const updatedGraph = RuleBase.createRuleTree( ast, graph );
    const adjList = updatedGraph.adjList;
    const goalNodes = updatedGraph.findGoalNodes();
    
    it( "should find the goal node of 'd' in the rule tree", () => {
	expect( goalNodes ).toEqual( ['d'] );
    });

});


