/** Define classes for RuleBase **/

import { Graph, Node, DuplicateNameError } from "./graph";
import jsep from "jsep";


// var ruleResultsJSON = {
//   name: rules[i].name,
//   lhs: rules[i].lhs,
//   rhs: rules[i].rhs,
//   value: rules[i].value,
//   topic: rules[i].topic,
//   source: rules[i].source,
//   result: resultText,
//   facts: lhs_facts.map(function(i) {
//     var fact = getFactStatus(i, kb);
//     // var support_desc = !!fact.factDescription ? fact.factDescription : "No further support provided";
//     return {
//       name: fact.name,
//       value: fact.value,
//       support_description: fact.factDescription
//     };
//   })
// };

// console.log(resultsJSON);
// return {
//   ruleResultsJSON,
//   openFacts,
//   closedFacts
// };



export const setAgenda = (rules) => {
  var agenda = [];
  // get all the rule names
  // var rule_names = rules.map(function(rule) {
  //   return rule.name;
  // });

  rules.forEach(function(rule) {
    var inAgenda = false; // flag to mark presence of rule in agenda
    for (let i = 0; i < agenda.length; i++) {
      // tokenize each lhs and check to see if the current rule.rhs is in it
      var tokens = tokenize(agenda[i].lhs);
      // if it is in the agenda, put it at the front of the agenda and bail
      if (tokens.indexOf(rule.rhs) > -1) {
        inAgenda = true;
        agenda.unshift(rule);
        break;
      }
    }
    // if the previous for loop didn't find the current rule.rhs in the agenda,
    // push it onto the end of the agenda
    if (!inAgenda) agenda.push(rule);
  });

  return agenda;
};

const tokenize = (s) => {
  if (s === true) return s;
  var tokens = s.split(/[^\b\w\b]|\b\d\b/g);
  var token_map = tokens.map(function(i) {
    var token = i.trim();
    return token;
  });
  // return token_map;
  return token_map.filter(function(e) {
    return e.length > 0;
  });
};

