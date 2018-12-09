export default

class RuleEngine {
    constructor(rules, facts, dev=false){
        this.dev = dev;
        this.rules = rules;
        this.facts = facts;
        this.results = {};
        this.agenda = []
    }

    debug(msg) {
        this.dev ? console.log(msg) : null;
    }

    eeval() { 
        expr => Function('"use strict";return (' + expr + ')')()
    }

    parseFacts(){
        this.debug("running parseFacts...");
        // presently have nothing to do here, but may need to
        // parse facts as the scripting language develops
    }

    parseRules(){
        // we loop through the rules, substituting
        // legal JS boolean operations for "and", "or" and "not"
        this.debug(`running parseRules...`);
        Object.entries(this.rules).forEach( item => {
            this.parseRule(item[0], item[1]);
        });
    }

    parseRule(name,rule) {
        if(!name) {
            throw new Error("No name specified for rule");
            return false;
        } else if(!rule.hasOwnProperty('lhs')) {
            throw new Error("No left-hand side specified for rule");
            return false;
        } else if(!rule.hasOwnProperty('rhs')) {
            throw new Error("No right-hand side specified for rule");
            return false;
        }
        rule.lhs = rule.lhs.replace( / +and +/g, " && ");
        rule.lhs = rule.lhs.replace( / +or +/g, " || ");
        rule.lhs = rule.lhs.replace( / +not +/g, " !");
        return rule;
    }

    setAgenda() {
        this.debug(`setting agenda for rule firing...`);
    }

    evalRules(){
        this.debug(`running evalRules...`);
        Object.keys(this.rules).forEach( key => {
            // use JSON methods to clone a new object, so you
            // don't send a reference to this.rules's member
            this.evalRule(JSON.parse(JSON.stringify(rule)));
        });
    }
    /*
        evalRule can accept a rule and can also take an optional facts
        object. If there is no facts object, then the class facts 
        object will be searched.
    */
    evalRule(rule, facts=null){
        this.debug("========================\nrunning evalRule...");
        let result = null;
        let eval_log = []; // a list of the results of evaluation to use in reasons
        // first must parse for any rule clauses that have assignments
        // and evaluate them based on their corresponding fact value
        this.debug(`parsing the rule <${rule.name}> as:
              ${rule.lhs}`);
        let regex_find_assignments = /(\w+ *(!=|=) *['"]*(\w+|true|false|null)['"]*)/g;
        let assignments = rule.lhs.match(regex_find_assignments);
        if(assignments){
            for(let i of assignments){
                let regex_parse_assignment = /(\w+) *(!=|=) *["']*([\w]*["']*)/g;
                let lexed = regex_parse_assignment.exec(i);
                if(lexed){
                    let key = lexed[1];
                    let val = lexed[3];
                    // need to convert any js truth values that may 
                    // have been provided as strings
                    if (val === 'true') { val = true; }
                    else if (val === 'false') { val = false; }
                    else if (val.contains('none', 'None','null', 'Null')) { val = null; }

                    // evaluate the rule's required value against the
                    // fact value
                    // let value = val === this.facts[key].value ? true : false; 
                    let fact_value = facts ? facts[key] : this.facts[key].value;
                    let value = val === fact_value ? true : false;
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
            // old version when it was a utility
            // var eeval = expr => Function('"use strict";return (' + expr + ')')();
            'value': this.eeval(rule.lhs)
        };

        this.debug(`New result added after rule eval:
              ${rule.rhs} -> ${this.results[rule.rhs].value}`);

        return rule;
    }

    fire(){
        this.parseFacts();
        this.parseRules();
        this.evalRules();
        return "fired!";
    }
}