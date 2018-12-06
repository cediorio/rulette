export {facts, rules, RuleEngine};
var dev = true;
var debug = (msg) => dev ? console.log(msg) : null;
var facts = {
    "corporation_type":
    {
        "question": "What type of corporation is the employer?",
        "values": ["CCPC", "private corporation", "public corporation"],
        "value": "CCPC"
    },
    "agmt_to_issue_shares":
    {
        "question": "Is there a legally binding agreement to issue shares?",
        "values": ["true", "false"],
        "value": "true"
    },
    "ee_AL":
    {
        "question": "Immediately after the agreement was made, was the employee dealing at arm's length with the employer and/or the corporation or mutual fund that agreed to issue securities?",
        "values": ["true", "false"],
        "value": "true"
    },
    "prescribed_shares":
    {
        "question": "Did the shares qualify as prescribed shares at the time they were issued (or would have been issued if the taxpayer disposed of their options)?", 
        "values": ["true", "false"],
        "value": "true"
    },
    // testing values
    "aa":
    {
        "value": "touchy feely"
    },
    "b1":
    {
        "value": "fine with me"
    },
    "c1":
    {
        "value": "true"
    }

};

var rules = {
    "s7_agmt":
    {
        "lhs": "agmt_to_issue_shares",
        "rhs": "s7_agmt"
    },
    "CCPC_deferral":
    {
        "lhs": "corporation_type='CCPC' and ee_AL",
        "rhs": "CCPC_deferral"
    },
    "ee_option_deduction":
    {
        "lhs": "ee_AL and agmt_to_issue_shares and prescribed_shares",
        "rhs": "p110_1_d_deduction"        
    },
    "harsh_test":
    {
        "lhs": "(aa = 'touchy feely' or b1 = 'fine with me') and c1",
        "rhs": "harsh_test_passed"
    }
};

var results = {};

var eeval = expr => Function('"use strict";return (' + expr + ')')();
// function eeval(expr){ eval(expr); }

class RuleEngine {
    constructor(rules, facts){
        this.rules = rules;
        this.facts = facts;
        this.results = {};
    }

    parseFacts(){
        debug("running parseFacts...");
        // presently have nothing to do here, but may need to
        // parse facts as the scripting language develops
    }
    
    evalRules(){
        // we loop through the rules, first substituting
        // legal JS boolean operations for "and", "or" and "not"
        // and then evaluating the truthiness via evalRule
        debug(`running evalRules...`);
        Object.keys(this.rules).forEach( key => {
	    let rule = this.rules[key];
	    rule['name'] = key;
	    rule.lhs = rule.lhs.replace( / +and +/g, " && ");
	    rule.lhs = rule.lhs.replace( / +or +/g, " || ");
	    rule.lhs = rule.lhs.replace( / +not +/g, " ! ");
	    
	    // use JSON methods to clone a new object, so you
	    // don't send a reference to this.rules's member
	    this.evalRule(JSON.parse(JSON.stringify(rule)));
        });
    }

    evalRule(rule){
        debug("========================\nrunning evalRule...");
        let result = null;
        let eval_log = []; // a list of the results of evaluation to use in reasons
        // first must parse for any rule clauses that have assignments
        // and evaluate them based on their corresponding fact value
        debug(`parsing the rule <${rule.name}> as:
              ${rule.lhs}`);
        let regex_find_assignments = /(\w+ *= *["'][\w ]*["'])/g;
        let assignments = rule.lhs.match(regex_find_assignments);
        if(assignments){
	    for(let i of assignments){
                let regex_parse_assignment = /(\w+) *= *["']([\w ]*)["']/g;
                let lexed = regex_parse_assignment.exec(i);
                if(lexed){
		    let key = lexed[1];
		    let val = lexed[2];
		    // evaluate the rule's required value against the
		    // fact value
		    let value = val === this.facts[key].value ? true : false;

		    // now replace the var from the clause with its
		    // truth value
		    rule.lhs = rule.lhs.replace(i, value);
                }
	    }
        }

        // unary tokens are simply replaced with their truth value
        let stop_words = ['true', 'false', 'and', 'or', 'not'];
        let regex_find_unaries = /(\w+)/g
        let unaries = rule.lhs.match(regex_find_unaries);
        if(unaries){
	    for(let i of unaries){
                if(!stop_words.includes(i)){
		    let value = this.facts[i].value;
		    rule.lhs = rule.lhs.replace(i, value);
                }
	    }
        }
        this.results[rule.rhs] = {
	    'value': eeval(rule.lhs)
        };

        debug(`New result added after rule eval:
              ${rule.rhs} -> ${this.results[rule.rhs].value}`);
    }
    fire(){
        this.parseFacts();
        this.evalRules();
        return "fired!";
    }
}
