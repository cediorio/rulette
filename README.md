# Rulette
Rulette is a simple javascript expert system. It is backward-chaining (for now) and it focuses on allowing the user to be able to write a rulebase in simple pseudo-code. Its author is a tax lawyer with no memory who is very tired of having to re-learn the rules for non-resident trusts every 9 months when a question comes up.

Note that this library is currently very much in development, but does have fairly decent test coverage.

# Usage
In rulette, a graph object is built up from rules. The graph can then be traversed to find 

The steps to put together a minimal expert system are as follows:
* `import R from 'rulette';`
* set up some rules:
  * the rule language is very simple
	* three operators 'not', 'and', 'or'
	* rules have a left-hand and right-hand side, separated by 'then': `let rule = "a and b then c"`
* create an instance of a graph: `const graph = new R.Graph();`
* parse the rule you've created using R.RuleParser.parseRule (it will return an 'abstract syntax tree' or AST):
  * `let ast = R.RuleParser.parseRule(rule);`
* create a RuleTree in the graph: `R.RuleParser.createRuleTree(ast, graph);`
* find the 'goal nodes' in the RuleTree (these are the parts of rules that have no further reasoning going on about them ['c' in 'rule' above]): `let goalNodes = graph.findGoalNodes();`
* evaluate the RuleTree in the graph: `graph.evalGoalNodes(goalNodes)`

* the point of all this is to give you some flexibility in how you set up the interface for managing rules, how you get facts from the interface and how you execute the rules

See the following example:
```
import R from 'rulette';

const rule1 = 'a and b then c';
const rule2 = 'c or d then e';
const graph = new R.Graph();

R.RuleParser.createRuleTree,(R.RuleParser.parseRule(rule2), graph);
R.RuleParser.createRuleTree(R.RuleParser.parseRule(rule1), graph);
let goalNodes = graph.findGoalNodes();

let a = graph.getNodeByName('a');
let b = graph.getNodeByName('b');

console.log('Value of facts have not yet been set:\n\ta.value is ', a.value);
console.log('\tb.value is ', b.value);
// Value of facts have not yet been set:
// 	a.value is  null
// 	b.value is  null

console.log('When values are null, goals are rejected:\n', graph.evalGoalNodes(goalNodes));
// When values are null, goals are rejected:
//  { c: { result: 'reject', nodes: [ 'and_hqxnjaecwm', 'a', 'b', 'c' ] } }

a.value = false;
b.value = false;

console.log('\n\nValue of facts now set to false:\n\ta.value is now ', a.value);
console.log('\tb.value is now', b.value);
// Value of facts now set to false:
// 	a.value is now  false
// 	b.value is now false

console.log('\nWhen values are false, goals are accepted, but value of goal node is false:\n', graph.evalGoalNodes(goalNodes));
// When values are false, goals are accepted, but value of goal node is false:
//  {
//   c: {
//     result: 'accept',
//     nodes: Node { _name: 'c', _nodeType: 'prop', _value: false }
//   }
// }

a.value = true;
b.value = true;
console.log('\n\nValue of facts now set to true:\n\ta.value is now ', a.value);
console.log('\tb.value is now', b.value);
// Value of facts now set to false:
// 	a.value is now  true
// 	b.value is now true

console.log('\nWhen values are true, goals are accepted, and value of goal node is true as well:\n', graph.evalGoalNodes(goalNodes));

```


# TO DOs
1. Implement forward-chaining.
1. Set this up for publication to npm.

# Testing
* run `npm test -- --watch` for live updating
* run `npm run debug-tests` to debug tests via jest
  * insert `debugger;` in the point in the code that you want to break on
  * Google Chrome `about:inspect` to find the link - you can press F8 to run to the breakpoint
