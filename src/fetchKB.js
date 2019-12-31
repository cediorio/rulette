/* Returns a JSON object consisting of rules and facts from the
 tax-apis.com server. */

import { Immutable } from 'immutable'
import axios from 'axios'

export const fetchData = async (url) => {
    try {
    	let kb = await axios.get(url);
    	if(kb) {
    	    return kb.data;
    	} else {
    	    return new Error(`There was a problem fetching the data.`);
    	}
    } catch (error) {
    	throw new Error( error );
    }
};

export const buildUrl = (kb_to_fetch) => {
    return `https://tax-apis.com/kb_json/${kb_to_fetch}.json`;
};
