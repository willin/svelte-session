import type { Cookies } from '@sveltejs/kit';
import type { SignFunction, UnsignFunction } from '../session/crypto.js';

type SimpleSpread<L, R> = R & Pick<L, Exclude<keyof L, keyof R>>;

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

export interface Cookie
	extends SimpleSpread<
		Omit<Cookies, 'serialize'>,
		{
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
			 * option is provided to `createCookie()`.
			 */
			readonly expires?: Date;

			/**
			 * Parses a raw `Cookie` header and returns the value of this cookie or
			 * `null` if it's not present.
			 */
			parse(cookies: Cookies): Promise<unknown>;

			/**
			 * Serializes the given value to a string and returns the `Set-Cookie`
			 * header.
			 */
			serialize(cookies: Cookies, value: unknown): Promise<string>;
		}
	> {}

/**
 * Cookie Options
 *
 * CookieSerializeOptions passed directly to `cookie.serialize`. See documentation [here](https://github.com/jshttp/cookie#cookieserializename-value-options)
 */
export interface CookieOptions
	extends SimpleSpread<
		Omit<import('cookie').CookieSerializeOptions, 'encode'>,
		CookieSignatureOptions
	> {}

export type CreateCookieFunction = (name: string, cookieOptions?: CookieOptions) => Cookie;

export const createCookieFactory =
	({ sign, unsign }: { sign: SignFunction; unsign: UnsignFunction }): CreateCookieFunction =>
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
			async parse(cookies) {
				const key = cookies.get(name);
				if (key === undefined) return null;
				if (key === '') return '';
				return await decodeCookieValue(unsign, key, secrets);
			},
			async serialize(cookies, value) {
				return cookies.serialize(
					name,
					value === '' ? '' : await encodeCookieValue(sign, value, secrets),
					options
				);
			}
		};
	};

async function encodeCookieValue(
	sign: SignFunction,
	value: unknown,
	secrets: string[]
): Promise<string> {
	let encoded = encodeData(value);

	if (secrets.length > 0) {
		encoded = await sign(encoded, secrets[0]);
	}

	return encoded;
}

async function decodeCookieValue(
	unsign: UnsignFunction,
	value: string,
	secrets: string[]
): Promise<unknown> {
	if (secrets.length > 0) {
		for (const secret of secrets) {
			const unsignedValue = await unsign(value, secret);
			if (unsignedValue !== false) {
				return decodeData(unsignedValue);
			}
		}

		return null;
	}

	return decodeData(value);
}

function encodeData(value: unknown): string {
	return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}

function decodeData(value: string): unknown {
	try {
		return JSON.parse(decodeURIComponent(myEscape(atob(value))));
	} catch (error: unknown) {
		return {};
	}
}

// See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.escape.js
function myEscape(value: string): string {
	const str = value.toString();
	let result = '';
	let index = 0;
	let chr, code;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (/[\w*+\-./@]/.exec(chr)) {
			result += chr;
		} else {
			code = chr.charCodeAt(0);
			if (code < 256) {
				result += '%' + hex(code, 2);
			} else {
				result += '%u' + hex(code, 4).toUpperCase();
			}
		}
	}
	return result;
}

function hex(code: number, length: number): string {
	let result = code.toString(16);
	while (result.length < length) result = '0' + result;
	return result;
}

// See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.unescape.js
function myUnescape(value: string): string {
	const str = value.toString();
	let result = '';
	let index = 0;
	let chr, part;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (chr === '%') {
			if (str.charAt(index) === 'u') {
				part = str.slice(index + 1, index + 5);
				if (/^[\da-f]{4}$/i.exec(part)) {
					result += String.fromCharCode(parseInt(part, 16));
					index += 5;
					continue;
				}
			} else {
				part = str.slice(index, index + 2);
				if (/^[\da-f]{2}$/i.exec(part)) {
					result += String.fromCharCode(parseInt(part, 16));
					index += 2;
					continue;
				}
			}
		}
		result += chr;
	}
	return result;
}
