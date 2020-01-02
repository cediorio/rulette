import { RuleBase, Fact, Rule } from '../src/ruleEngine';
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

    describe( "RuleBase.createRuleTree", () => {
	it( "should return the supplied graph with a new rule parsed as new nodes", () => {
	const graph = new Graph();
	const ast = RuleBase.parseRule('a and (b or not c) then d', graph);
	    expect( () => RuleBase.createRuleTree( ast ) ).toThrow();
	    expect( () => RuleBase.createRuleTree( ast, graph ) ).not.toThrow();
	    expect( RuleBase.createRuleTree( ast, graph ) ).toBeInstanceOf(Graph);
	});
    });
});
