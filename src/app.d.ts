// See https://kit.svelte.dev/docs/types#app

import type { FlashSessionData, SessionData, SessionStorage } from '$lib/index.ts';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: SessionStorage<{ views: number }>;
		}
		interface PageData {
			session: FlashSessionData<SessionData, SessionData>;
		}
		interface Session extends SessionStorage {}
		interface Platform {}
	}
}

export {};
