import type { Cookies } from '@sveltejs/kit';
import { decodeCookieValue, encodeCookieValue, type ImplementsOrExtends } from './utils.js';
import type { SignFunction, UnsignFunction } from './crypto.js';

export interface CookieSerializeOptions
	extends ImplementsOrExtends<Omit<import('cookie').CookieSerializeOptions, 'encode'>, object> {}

export interface CookieOptions
	extends ImplementsOrExtends<CookieSignatureOptions, CookieSerializeOptions> {}

export interface CookieSignatureOptions {
	/**
	 * An array of secrets that may be used to sign/unsign the value of a cookie.
	 *
	 * The array makes it easy to rotate secrets. New secrets should be added to
	 * the beginning of the array. `cookie.serialize()` will always use the first
	 * value in the array, but `cookie.parse()` may use any of them so that
	 * cookies that were signed with older secrets still work.
	 */
	secrets?: string[];
}

/**
 * @protected Signed Session Cookie
 */
export interface SignedSessionCookie {
	/**
	 * The name of the cookie, used in the `Cookie` and `Set-Cookie` headers.
	 */
	readonly name: string;

	/**
	 * True if this cookie uses one or more secrets for verification.
	 */
	readonly isSigned: boolean;

	/**
	 * The Date this cookie expires.
	 *
	 * Note: This is calculated at access time using `maxAge` when no `expires`
	 * option is provided to `CookieOptions`.
	 */
	readonly expires?: Date;

	/**
	 * Get SessionCookie value from event and returns the value of this cookie or
	 * `null` if it's not present.
	 */
	get<T>(cookies: Cookies): Promise<T>;

	/**
	 * Set the given value to the cookies.
	 */
	set<T>(cookies: Cookies, value: T, options?: CookieSerializeOptions): Promise<void>;

	/**
	 * Delete the SessionCookie from the cookies.
	 */
	delete(cookies: Cookies, options?: CookieSerializeOptions): Promise<void>;
}

/**
 * @private Creates a logical container for managing a session cookie from the server.
 */
export type CreateSignedSessionCookieFunction = (
	name: string,
	cookieOptions?: CookieOptions
) => SignedSessionCookie;

/**
 * @private Creates a logical container for managing a session cookie from the server.
 */
export const createSignedSessionCookieFactory =
	({
		sign,
		unsign
	}: {
		sign: SignFunction;
		unsign: UnsignFunction;
	}): CreateSignedSessionCookieFunction =>
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	(name, cookieOptions = {}) => {
		const { secrets = [], ...options } = {
			path: '/',
			sameSite: 'lax' as const,
			...cookieOptions
		};

		return {
			get name() {
				return name;
			},
			get isSigned() {
				return secrets.length > 0;
			},
			get expires() {
				// Max-Age takes precedence over Expires
				return typeof options.maxAge !== 'undefined'
					? new Date(Date.now() + options.maxAge * 1000)
					: options.expires;
			},
			async get(cookies) {
				const key = cookies.get(name);
				if (key === undefined) return null;
				if (key === '') return '';
				return await decodeCookieValue(unsign, key, secrets);
			},
			async set(cookies, value, serializeOptions) {
				return cookies.set(
					name,
					value === '' ? '' : await encodeCookieValue(sign, value, secrets),
					{ ...options, ...serializeOptions }
				);
			},
			delete(cookies, serializeOptions) {
				return cookies.delete(name, { ...options, ...serializeOptions });
			}
		};
	};
