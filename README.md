# @svelte-dev/session

[![github](https://img.shields.io/github/followers/willin.svg?style=social&label=Followers)](https://github.com/willin) [![npm](https://img.shields.io/npm/v/@svelte-dev/session.svg)](https://npmjs.org/package/@svelte-dev/session) [![npm](https://img.shields.io/npm/dm/@svelte-dev/session.svg)](https://npmjs.org/package/@svelte-dev/session) [![npm](https://img.shields.io/npm/dt/@svelte-dev/session.svg)](https://npmjs.org/package/@svelte-dev/session) [![Maintainability](https://api.codeclimate.com/v1/badges/10e1e833f884c9a48f1a/maintainability)](https://codeclimate.com/github/willin/svelte-session/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/10e1e833f884c9a48f1a/test_coverage)](https://codeclimate.com/github/willin/svelte-session/test_coverage)

Simple Session Storage Management for [Svlelte](https://svelte.dev/).

## Overview

Sessions are an important part of websites that allow the server to identify requests coming from the same person, especially when it comes to server-side form validation or when JavaScript is not on the page. Sessions are a fundamental building block of many sites that let users "log in", including social, e-commerce, business, and educational websites.

Svelte-Session comes with several pre-built session storage options for common scenarios, and one to create your own:

- custom storage with `createCustomStrategy`
- `CookieSessionStrategy`
- `MemoryStrategy`
- `CloudflareKVStrategy` (Cloudflare Workers)

## Installation

To use it, install it from npm (yarn or bun):

```bash
npm install @svelte-dev/session
```

## Usage

## Advanced Usage

### Gotchas

### Session API

## 赞助 Sponsor

维护者 Owner： [Willin Wang](https://willin.wang)

如果您对本项目感兴趣，可以通过以下方式支持我：

- 关注我的 Github 账号：[@willin](https://github.com/willin) [![github](https://img.shields.io/github/followers/willin.svg?style=social&label=Followers)](https://github.com/willin)
- 参与 [爱发电](https://afdian.net/@willin) 计划
- 支付宝或微信[扫码打赏](https://user-images.githubusercontent.com/1890238/89126156-0f3eeb80-d516-11ea-9046-5a3a5d59b86b.png)

Donation ways:

- Github: <https://github.com/sponsors/willin>
- Paypal: <https://paypal.me/willinwang>
- Alipay or Wechat Pay: [QRCode](https://user-images.githubusercontent.com/1890238/89126156-0f3eeb80-d516-11ea-9046-5a3a5d59b86b.png)

## 许可证 License

Apache-2.0
