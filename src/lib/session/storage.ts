import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { SessionData, SessionStorageOptions, SessionStorageStrategy } from './types.js';
import { Session } from './session.js';
import { decodeCookieValue, encodeCookieValue } from './utils.js';
import { sign, unsign } from './crypto.js';
import { MemoryStrategy } from '$lib/index.js';

export class SessionStorage<Data = SessionData, FlashData = Data> {
	#options: Pick<SessionStorageOptions, 'cookie' | 'session'>;
	#cookies: Cookies;
	#session: Session<Data, FlashData> | null = null;
	#adapter: SessionStorageStrategy<Data, FlashData>;
	#needSync: boolean = false;

	constructor(
		event: RequestEvent,
		opts: SessionStorageOptions<Data, FlashData> = {} as SessionStorageOptions<Data, FlashData>
	) {
		const { adapter, ...rest } = opts;
		this.#options = rest;
		this.#cookies = event.cookies;
		const { strategy: S, name = 'cookie', options = {} } = adapter ?? {};
		if (S) {
			this.#adapter = new S(options) as SessionStorageStrategy<Data, FlashData>;
		} else {
			switch (name) {
				case 'memory': {
					this.#adapter = new MemoryStrategy();
					break;
				}
				case 'cookie':
				default: {
					this.#adapter = {} as SessionStorageStrategy<Data, FlashData>;
				}
			}
		}
	}

	/**
	 * You must init Storage from handler first
	 */
	async init() {
		const key = this.#options?.session?.key ?? '__sid';
		const secrets = this.#options?.session?.secrets ?? [];
		const signedId = this.#cookies.get(key);
		if (signedId) {
			const { id } = await decodeCookieValue<{ id?: string }>(unsign, signedId, secrets);
			if (id) {
				const data = await this.#adapter.readData(id);
				this.#session = new Session((data ?? {}) as any, id);
				return;
			}
		}
		const id = await this.#adapter.createData({}, this.#expires);
		this.#session = new Session({}, id);
		this.#cookies.set(key, await encodeCookieValue(sign, { id }, secrets), this.#options.cookie);
	}

	get sid() {
		if (!this.#session) throw new Error('Not Initialized');
		return this.#session.id;
	}
	/**
	 * Change the session id
	 */
	async updateSid(id: string, initData?: Data) {
		if (initData) {
			await this.#adapter.updateData(id, initData);
			this.#session = new Session(initData as any, id);
			return;
		}
		const data = await this.#adapter.readData(id);
		this.#session = new Session((data ?? {}) as any, id);
	}

	get data() {
		if (!this.#session) throw new Error('Not Initialized');
		return this.#session?.data;
	}

	get<Key extends keyof Data & string>(key: Key) {
		if (!this.#session) throw new Error('Not Initialized');
		return this.#session.get(key);
	}

	async set<Key extends keyof Data & string>(key: Key, value: Data[Key]) {
		if (!this.#session) throw new Error('Not Initialized');
		this.#session.set(key, value);
		await this.#adapter.updateData(this.#session.id, this.#session.data, this.#expires);
	}

	async flash<Key extends keyof FlashData & string>(key: Key, value: FlashData[Key]) {
		if (!this.#session) throw new Error('Not Initialized');
		this.#session?.flash(key, value);
		await this.#adapter.updateData(this.#session.id, this.#session.data, this.#expires);
	}

	async unset<Key extends keyof Data & string>(key: Key) {
		if (!this.#session) throw new Error('Not Initialized');
		this.#session?.unset(key);
		await this.#adapter.updateData(this.#session.id, this.#session.data, this.#expires);
	}

	async destory() {
		if (!this.#session) throw new Error('Not Initialized');
		await this.#adapter.deleteData(this.#session.id);
		this.#session = new Session({} as any, this.#session.id);
	}

	get #expires() {
		const options = this.#options.cookie ?? {};
		const expires =
			options?.maxAge != null
				? new Date(Date.now() + options.maxAge * 1000)
				: options?.expires != null
				  ? options.expires
				  : undefined;

		return expires;
	}
}
