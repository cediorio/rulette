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

export default rules