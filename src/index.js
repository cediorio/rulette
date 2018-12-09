import RuleEngine from './engine'
import facts from '../test/test_data/facts'
import rules from '../test/test_data/rules'

let engine = new RuleEngine(rules, facts, true);
engine.debug('something test');
engine.parseFacts();

