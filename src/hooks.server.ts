import { handleSession } from '$lib/index.js';

export const handle = handleSession({
	adapter: {
		name: 'memory'
	}
});
