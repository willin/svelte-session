// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, test, expect } from 'vitest';
import { createSignedSessionCookieFactory } from './cookies.js';
import { sign, unsign } from './crypto.js';

describe('cookies', () => {
	test('createSignedSessionCookieFactory', async () => {
		const factory = createSignedSessionCookieFactory({ sign, unsign });
		expect(factory).toBeDefined();
		const signed = factory('name');
		expect(signed.name).toBe('name');
		expect(signed.isSigned).toBe(false);
		expect(signed.expires).toBe(undefined);
	});

	test('createSignedSessionCookieFactory with options', async () => {
		const factory = createSignedSessionCookieFactory({ sign, unsign });
		expect(factory).toBeDefined();
		const signed = factory('name', {
			maxAge: 1000
		});
		expect(signed.name).toBe('name');
		expect(signed.isSigned).toBe(false);
		expect(signed.expires).toBeInstanceOf(Date);
	});

	describe('Signed Session Cookie', () => {
		const factory = createSignedSessionCookieFactory({ sign, unsign });

		const encodedTest = 'InRlc3Qi.Ayos0MfPrSPVxT8vE4m8xKb1MrVOok0EbCBuvuKgWLk';
		const cookies = {
			get(key: string) {
				if (key === 'undefined') return undefined;
				if (key === 'name') return '';
				if (key === 'unsigned') return 'InRlc3Qi';
				return encodedTest;
			},
			set(key: string, value: string) {
				return value;
			},
			delete(key: string) {
				return key;
			}
		};

		test('set value', async () => {
			const signed = factory('value', {
				secrets: ['s3cr3t']
			});
			const value = await signed.set(cookies, 'test');
			expect(value).toBe(encodedTest);
			const valueEmpty = await signed.set(cookies, '');
			expect(valueEmpty).toBe('');
		});

		test('get undefined', async () => {
			const signed = factory('undefined', {
				secrets: ['s3cr3t']
			});
			const value = await signed.get(cookies);
			expect(value).toBe(null);
		});

		test('get empty string', async () => {
			const signed = factory('name', {
				secrets: ['s3cr3t']
			});
			const value = await signed.get(cookies);
			expect(value).toBe('');
		});

		test('get string', async () => {
			const signed = factory('test', {
				secrets: ['s3cr3t']
			});
			const value = await signed.get(cookies);
			expect(value).toBe('test');
		});

		test('delete', async () => {
			const signed = factory('test', {
				secrets: ['s3cr3t']
			});
			const value = await signed.delete(cookies);
			expect(value).toBe('test');
		});

		test('unsigned cookie', async () => {
			const unsigned = factory('unsigned', {});
			const value = await unsigned.set(cookies, 'test');
			expect(value).toBe('InRlc3Qi');
			const obj = await unsigned.get(cookies);
			expect(obj).toBe('test');
		});
	});
});
