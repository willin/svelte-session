// import { type Cookies } from '@sveltejs/kit';

/**
 * An object of name/value pairs to be used in the session.
 */
export interface SessionData {
	[name: string]: unknown;
}

export type FlashSessionData<Data, FlashData> = Partial<
	Data & {
		[Key in keyof FlashData as FlashDataKey<Key & string>]: FlashData[Key];
	}
>;
type FlashDataKey<Key extends string> = `__flash_${Key}__`;

/**
 * Session persists data across HTTP requests.
 *
 * @see https://github.com/willin/svelte-session
 */
export interface Session<Data = SessionData, FlashData = Data> {
	/**
	 * A unique identifier for this session.
	 *
	 * Note: This will be the empty string for newly created sessions and
	 * sessions that are not backed by a database (i.e. cookie-based sessions).
	 */
	readonly id: string;

	/**
	 * The raw data contained in this session.
	 *
	 * This is useful mostly for SessionStorage internally to access the raw
	 * session data to persist.
	 */
	readonly data: FlashSessionData<Data, FlashData>;

	/**
	 * Returns `true` if the session has a value for the given `name`, `false`
	 * otherwise.
	 */
	has(name: (keyof Data | keyof FlashData) & string): boolean;

	/**
	 * Returns the value for the given `name` in this session.
	 */
	get<Key extends (keyof Data | keyof FlashData) & string>(
		name: Key
	):
		| (Key extends keyof Data ? Data[Key] : undefined)
		| (Key extends keyof FlashData ? FlashData[Key] : undefined)
		| undefined;

	/**
	 * Sets a value in the session for the given `name`.
	 */
	set<Key extends keyof Data & string>(name: Key, value: Data[Key]): void;

	/**
	 * Sets a value in the session that is only valid until the next `get()`.
	 * This can be useful for temporary values, like error messages.
	 */
	flash<Key extends keyof FlashData & string>(name: Key, value: FlashData[Key]): void;

	/**
	 * Removes a value from the session.
	 */
	unset(name: keyof Data & string): void;

	/**
	 * Save the session and commit the changes.
	 */
	commit(): Promise<void>;

	/**
	 * Destroy the session and remove all data.
	 */
	destroy(): Promise<void>;
}
