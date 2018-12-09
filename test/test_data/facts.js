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

export default facts