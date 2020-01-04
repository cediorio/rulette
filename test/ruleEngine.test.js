import { RuleBase, Fact, Rule, ParseError } from '../src/ruleEngine';
import { Graph } from '../src/graph';

describe( "Fact class creation", () => {
    it( "should return an object", () => {
	const fact = new Fact();
	expect( fact ).toBeInstanceOf( Fact );
	expect( typeof fact.name ).toBe('string');
	
    });
});

describe( "Rule class creation", () => {
    it( "should return an object", () => {
	const rule = new Rule();
	expect( rule ).toBeInstanceOf( Rule );
    });
});

describe( "RuleBase.parseRule", () => {
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

    describe( "RuleBase.parseRule", () => {
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
	    expect( () => RuleBase.createRuleTree( ast, graph ) ).not.toThrow();
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

	const goalNodes = updatedGraph.findGoalNodes();
	
	it( "should find the goal node of 'd' in the rule tree", () => {
	    expect( goalNodes ).toEqual( ['d'] );
	});

	it( "should evaluate the rule tree", () => {
	    expect( updatedGraph.evalGoalNodes( goalNodes )).toEqual(
		{"d":
		 {
		     "missing": ["a", "b", "c"],
		     "truthiness": null
		 }
		}
	    );
	    
	    for ( let i of ['a', 'b', 'c'] ) 
		updatedGraph.getNodeByName(i).value = true;

	    debugger;
	    expect( updatedGraph.evalGoalNodes( goalNodes )).toEqual();
	    
	    console.log( updatedGraph.nodes );
	    
	});
    });
    
});
