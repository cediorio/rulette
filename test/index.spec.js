import {expect} from "chai"
import facts from './test_data/facts.js'
import rules from './test_data/rules.js'
import RuleEngine from '../src/engine.js'

describe("imports test", () => {
    describe("import facts", () => {
        it("should make a facts object available", () => {
            expect(facts).to.be.an("object")
        })
    })
    describe("import rules", () => {
        it("should make a rules object available", () => {
            expect(rules).to.be.an("object")
        })
    })
    
    describe("new RuleEngine instance", () => {
        it("should not throw", () => {
            expect(() => new RuleEngine).not.to.throw();
        })
    }) 
})
let engine = new RuleEngine(rules, facts, true);

describe("Create a RuleEngine instance with facts and rules", () => {
    describe("once rules are loaded from the constructor,", () => {
        it("there should be a rules object", () => {
            expect(engine.rules).to.be.an("object");
        })
        it("all the rules in the test rules file should be loaded", () => {
            expect(engine.rules).to.have.all.keys(
                's7_agmt',
                'CCPC_deferral',
                "ee_option_deduction",
                "harsh_test"
            )
        })        
    })
    describe("Once facts are loaded from the constructor", () => {
        it("there should be a facts object", () => {
            expect(engine.facts).to.be.an("object");
        })
        it("all of the following facts in the test facts file should be loaded", () => {
            expect(engine.facts).to.have.any.keys(
                "corporation_type",
                "agmt_to_issue_shares",
                "ee_AL",
                "prescribed_shares"
            )
        })
    })
})

describe("Parse facts that have been loaded to this instance", () => {
    it("parseFacts is not implemented yet");
})

describe("Rule parsing", () => {
    it("Should throw an exception if the rule has no name", () => {
        let rule = {};
        expect(engine.parseRule.bind(engine, rule)).to.throw("No name specified for rule");
    })

    it("Should throw an exception if the rule is missing lhs", () => {
        let rule = { 'name': 'a'};
        expect(engine.parseRule.bind(engine, rule)).to.throw("No left-hand side specified for rule");        
    })

    it("Should throw an exception if the rule is missing rhs", () => {
        let rule = { 'name': 'a', 'lhs': 'test'};
        expect(engine.parseRule.bind(engine, rule)).to.throw("No right-hand side specified for rule");        
    })

    it("Should return the rule parsed to javascript operators", () => {
        let rule = { 
            'name': 'test', 
            'lhs': 'a="snack" and b or not c',
            'rhs': 'snackey'    
        }
        // console.log(engine.parseRule(rule));
        expect(engine.parseRule(rule)).to.have.property('lhs')
            .that.contains('a=="snack" && b || !c');
    })

    it("there should not be an exception where rules object is parsed", () => {
        expect(engine.parseRules.bind(engine)).not.to.throw();
    })

    it("the parsing should have removed all occurrences of 'and', 'or' or 'not'", () => {
        Object.values(engine.rules).forEach( key => {
            expect(key.lhs).to.not.include(' and ');
            expect(key.lhs).to.not.include(' or ');
            expect(key.lhs).to.not.include(' not ');
        })
    })
})

describe("Once rules are parsed, set the agenda for their firing", () => {
    it("setAgenda not implemented yet");
})

describe("Evaluate rules", () => {
    it.skip("evalRules should not throw an exception when invoked", () => {
        expect(engine.evalRules.bind(engine)).to.not.throw();
    });
})