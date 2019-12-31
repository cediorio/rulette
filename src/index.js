import { Immutable } from 'immutable';
import { fetchData, buildUrl } from './fetchKB';

const get_kb = async (kb_to_fetch) => {
    const kb = await fetchData(kb_to_fetch);

    if (kb) {
    	kb.forEach( e => {
    	    console.log(`${JSON.stringify(e)}`);
    	});
    }
}

get_kb(buildUrl('test'));

