import { RuleParser, ParseError } from '../src/ruleParser.js';
import { Graph } from '../src/graph.js';
import { jest } from '@jest/globals';

describe( "RuleParser.parseRule to AST", () => {
  it( "should return an abstract syntax tree", () => {
    const graph = new Graph();
    const ast = RuleParser.parseRule('a and (b or not c) then d', graph);
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

  describe( "RuleParser.parseRule grammars", () => {
    it( "should handle a variety of logical expressions", () => {
      expect( RuleParser.parseRule( 'a' )).toStrictEqual(
	{"name": "a", "type": "Identifier"}
      );
      expect( RuleParser.parseRule( 'a_test_underlined' )).toStrictEqual(
	{"name": "a_test_underlined", "type": "Identifier"}
      );
      expect( RuleParser.parseRule( 'not a' )).toStrictEqual(
	{"argument": {"name": "a", "type": "Identifier"}, "operator": "not", "prefix": true, "type": "UnaryExpression"}
      );
      expect( () => RuleParser.parseRule( 'not alphaGetty and not and b and c )' )).toThrow(ParseError);
      expect( RuleParser.parseRule( 'a and not ( b and c )' )).toStrictEqual(
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

  describe( "RuleParser.createRuleTree from a single node/Identifier", () => {
    it( "should return successfully", () => {
      const graph = new Graph();
      const ast = RuleParser.parseRule('a_is_a_node');
      expect( () => RuleParser.createRuleTree( ast, graph ) ).not.toThrow();
      
    });
  });

  
  describe( "RuleParser.createRuleTree", () => {
    it( "should throw a ParseError", () => {
      const graph = new Graph();
      const ast = RuleParser.parseRule('a and (b or not c) then d');

      expect( () => RuleParser.createRuleTree( ast ) ).toThrow(ParseError);
      expect( () => {
	RuleParser.createRuleTree( ast, graph );
      }).not.toThrow();
    });
  });

  describe( "RuleParser.createRuleTree", () => {
    const graph = new Graph();
    const ast = RuleParser.parseRule('a and (b or not c) then d');
    const updatedGraph = RuleParser.createRuleTree( ast, graph );
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

  describe( "RuleParser.createRuleTree with intra-rule references", () => {
    const graph = new Graph();
    const ast1 = RuleParser.parseRule('a and b then c');
    const ast2 = RuleParser.parseRule('c then d');
    RuleParser.createRuleTree( ast1, graph );
    const updatedGraph = RuleParser.createRuleTree( ast2, graph );
    const adjList = updatedGraph.adjList;
    
    it( "node d should have an edge to c", () => {
      expect( adjList['d'].includes('c') ).toBe(true);
    });
  });
});

