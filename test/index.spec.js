import {expect} from "chai"
import facts from './test_data/facts.js'
import rules from './test_data/rules.js'
import RuleEngine from '../src/engine.js'

describe("imports test", function() {
    describe("import facts", function() {
        it("should make a facts object available", function() {
            expect(facts).to.be.an("object")
        })
    })
    describe("import rules", function() {
        it("should make a rules object available", function() {
            expect(rules).to.be.an("object")
        })
    })
    
    describe("new RuleEngine instance", function() {
        it("should not throw", function() {
            expect(() => new RuleEngine).not.to.throw();
        })
    }) 
})
// the last parameter is for debug printing
let engine = new RuleEngine(rules, facts, false);

describe("Create a RuleEngine instance with facts and rules", function() {
    describe("once rules are loaded from the constructor,", function() {
        it("there should be a rules object", function() {
            expect(engine.rules).to.be.an("object");
        })
        it("all the rules in the test rules file should be loaded", function() {
            expect(engine.rules).to.have.all.keys(
                's7_agmt',
                'CCPC_deferral',
                "ee_option_deduction",
                "harsh_test"
            )
        })        
    })
    describe("Once facts are loaded from the constructor", function() {
        it("there should be a facts object", function() {
            expect(engine.facts).to.be.an("object");
        })
        it("all of the following facts in the test facts file should be loaded", function() {
            expect(engine.facts).to.have.any.keys(
                "corporation_type",
                "agmt_to_issue_shares",
                "ee_AL",
                "prescribed_shares"
            )
        })
    })
})

describe("Parse facts that have been loaded to this instance", function() {
    it("parseFacts is not implemented yet");
})

describe("Rule parsing", function() {
    it("Should throw an exception if the rule has no name", function() {
        let name = null;
        let rule = {};
        expect(engine.parseRule.bind(engine, name, rule)).to.throw("No name specified for rule");
    })

    it("Should throw an exception if the rule is missing lhs", function() {
        let name = 'testName';
        let rule = { 'name': 'a'};
        expect(engine.parseRule.bind(engine, name, rule)).to.throw("No left-hand side specified for rule");        
    })

    it("Should throw an exception if the rule is missing rhs", function() {
        let name = 'testName';
        let rule = { 'name': 'a', 'lhs': 'test'};
        expect(engine.parseRule.bind(engine, name, rule)).to.throw("No right-hand side specified for rule");        
    })

    it("Should return the rule parsed to javascript operators", function() {
        let name = 'test';
        let rule = { 
            'lhs': 'a="snack" and b or not c',
            'rhs': 'snackey'    
        };
        // console.log(engine.parseRule(rule));
        expect(engine.parseRule(name, rule)).to.have.property('lhs')
            .that.contains('a="snack" && b || !c');
    })

    it("there should not be an exception where rules object is parsed", function() {
        expect(engine.parseRules.bind(engine)).not.to.throw();
    })

    it("the parsing should have removed all occurrences of 'and', 'or' or 'not'", function() {
        Object.values(engine.rules).forEach( key => {
            expect(key.lhs).to.not.include(' and ');
            expect(key.lhs).to.not.include(' or ');
            expect(key.lhs).to.not.include(' not ');
        })
    })
})

describe("Evaluate single rules", function() {
    let facts = {'a': true, 'b': true, 'c': true, 'd': true, 'e': 'sqwade'};
    let name = "testRule";
    let rule = {'lhs': "a = true and b = true", 'rhs': true};
    let ruleParsed = engine.parseRule(name,rule);    
    it("true values should evaluate to true (duh)...", function() {
        expect(engine.evalRule(ruleParsed, facts))
            .to.have.property('lhs', 'true && true')
        expect(engine.results)
            .to.have.property('testRule', true);
    })
    it("a false atom should make the rule false", function() {
        let rule = {'lhs': "a = true and b = false", 'rhs': null};
        let ruleParsed = engine.parseRule(name,rule); 
        expect(engine.evalRule(ruleParsed, facts))
            .to.have.property('lhs', 'true && false'); 
        expect(engine.results)
            .to.have.property("testRule", false);
    })
    it("a false or a true atom should be true ", function() {
        let rule = {'lhs': "a = true or b = false", 'rhs': null};
        let ruleParsed = engine.parseRule(name,rule); 
        expect(engine.evalRule(ruleParsed, facts))
            .to.have.property('lhs', 'true || false'); 
        expect(engine.results)
            .to.have.property("testRule", true);
    })
    it("brackets should work to give precedence ", function() {
        let rule = {'lhs': "a = false or (b = false and c = true)", 'rhs': null};
        let ruleParsed = engine.parseRule(name,rule); 
        expect(engine.evalRule(ruleParsed, facts))
            .to.have.property('lhs', 'false || (false && true)'); 
        expect(engine.results)
            .to.have.property("testRule", false);
    })
    it("terse syntax should work", function() {
        let rule = {'lhs': "!a or (!b and c)", 'rhs': null};
        let ruleParsed = engine.parseRule(name,rule); 
        expect(engine.evalRule(ruleParsed, facts))
            .to.have.property('lhs', '!true || (!true && true)'); 
        expect(engine.results)
            .to.have.property("testRule", false);
    })
})

describe("Once rules are parsed, set the agenda for their firing", function() {
    it("setAgenda not implemented yet");
})

describe("Evaluate rules object", function() {
    it("evalRules should not throw an exception when invoked", function() {
        engine.parseRules();
        expect(engine.evalRules.bind(engine)).to.not.throw();
    });
})

