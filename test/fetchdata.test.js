import axios from 'axios';
import { fetchData, buildUrl } from '../src/fetchKB';

jest.mock('axios');

describe('fetchData', () => {
    it('fetches successfully data from an API', async () => {
	const data = {
	    data: {
		hits: [
		    {
			objectID: '1',
			title: 'a',
		    },
		    {
			objectID: '2',
			title: 'b',
		    },
		],
	    },
	};
	axios.get.mockImplementationOnce(() => Promise.resolve(data));
	await expect(fetchData('/test')).resolves.toEqual(data.data);
    });
    it('fetches erroneously data from an API', async () => {
	const errorMessage = 'Network Error';
	axios.get.mockImplementationOnce(() =>
					 Promise.reject(new Error(errorMessage)),
					);

	await expect(fetchData('test')).rejects.toThrow(errorMessage);
    });
});

