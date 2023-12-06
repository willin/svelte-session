import { handleSession } from '$lib/index.js';

export const handle = handleSession({
	adapter: {
		name: 'cookie',
		options: {
			chunk: true
		}
	},
	session: {
		secrets: ['s3cr3t']
	},
	cookie: {
		path: '/'
	}
});
