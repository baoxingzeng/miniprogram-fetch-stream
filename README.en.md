# miniprogram-fetch-stream <!-- omit in toc -->

A W3C-compliant Fetch API polyfill for multi-platform mini programs. Write once, run everywhere.

## Table of Contents <!-- omit in toc -->

- [Mini-Program Support](#mini-program-support)
- [Features](#features)
- [Installation](#installation)
- [API](#api)
- [Quick Start](#quick-start)
- [Timeout](#timeout)
- [Compatibility](#compatibility)
- [Stream Support](#stream-support)
- [Cookie Support](#cookie-support)
- [Platform Integration](#platform-integration)
- [TextMode](#textmode)
- [License](#license)

## Mini-Program Support

| WeChat | Alipay | Baidu | ByteDance |  QQ   | Kwai  |  JD   | RedNote |
| :----: | :----: | :---: | :-------: | :---: | :---: | :---: | :-----: |
|   ✔    |   ✔    |   ✔   |     ✔     |   ✔   |   ✔   |   ✔   |    ✔    |

> In Chrome, Firefox, Edge, Safari, and other browsers, the exported modules return the browser's native implementations directly — zero overhead.

## Features

- W3C-compliant APIs: `fetch`, `Headers`, `Request`, `Response`, and more
- Includes `URLSearchParams`, `Blob`, `File`, `FormData` covering common body types
- Streaming responses via Transfer-Encoding Chunked using `ReadableStream`
- Optional plugin [miniprogram-cookie-shim](https://www.npmjs.com/package/miniprogram-cookie-shim) for automatic cookie handling and persistence
- Auto-adapts to WeChat, Alipay, Baidu, ByteDance, QQ, Kwai, JD, RedNote, and other major mini program platforms

## Installation

```bash
npm install miniprogram-fetch-stream
```

## API

| Export                   | Description                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `fetch`                  | Browser-native `fetch` / mini program polyfill — consistent Web-standard behavior               |
| `Headers`                | Browser-native `Headers` / mini program polyfill                                                |
| `Request`                | Browser-native `Request` / mini program polyfill                                                |
| `Response`               | Browser-native `Response` / mini program polyfill                                               |
| `URLSearchParams`        | Browser-native `URLSearchParams` / mini program polyfill                                        |
| `Blob`                   | Browser-native `Blob` / mini program polyfill                                                   |
| `File`                   | Browser-native `File` / mini program polyfill                                                   |
| `FormData`               | Browser-native `FormData` / mini program polyfill                                               |
| `AbortController`        | Browser-native `AbortController` / mini program polyfill                                        |
| `AbortSignal`            | Browser-native `AbortSignal` / mini program polyfill                                            |
| `TextEncoder`            | Browser-native `TextEncoder` / mini program polyfill                                            |
| `TextDecoder`            | Browser-native `TextDecoder` / mini program polyfill                                            |
| `setRequestFunc`         | Manually specify the request function when the platform's `request` API cannot be auto-detected |
| `setTextMode`            | Force all request data to be sent as strings                                                    |
| `setEnableChunked`       | Enable Transfer-Encoding Chunked mode for streaming response data                               |
| `setReadableStreamClass` | Specify the `ReadableStream` implementation class for platforms without native stream support   |

> **Design principle:** `fetch` returns the native implementation in browsers and automatically switches to the polyfill in mini programs — the same code runs with Web-standard behavior in both environments.

## Quick Start

### GET Request <!-- omit in toc -->

```javascript
import { fetch } from "miniprogram-fetch-stream";

fetch("https://example.com/api/user?id=88")
    .then(response => {
        console.log(response.status);   // 200
        return response.text();
    })
    .then(responseText => {
        console.log(responseText);
    });
```

### POST Request (JSON) <!-- omit in toc -->

```javascript
import { fetch } from "miniprogram-fetch-stream";

fetch("https://example.com/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify({ name: "Alice", age: 25 }),
})
    .then(response => response.json())
    .then(data => {
        console.log(data);
    });
```

### POST Request (FormData Upload) <!-- omit in toc -->

```javascript
import { fetch, Blob, FormData } from "miniprogram-fetch-stream";

const formData = new FormData();
formData.append("name", "Bob");
formData.append("file", new Blob(["file content"], { type: "text/plain" }), "test.txt");

fetch("https://example.com/api/upload", {
    method: "POST",
    body: formData,
})
    .then(response => {
        console.log(response.status);
    });
```

### POST Request (URLSearchParams) <!-- omit in toc -->

```javascript
import { fetch, URLSearchParams } from "miniprogram-fetch-stream";

fetch("https://example.com/api/search", {
    method: "POST",
    body: new URLSearchParams({ q: "keyword", page: "1" }),
})
    .then(response => {
        console.log(response.status);
    });
```

> The `body` option in `RequestInit` supports `string`, `ArrayBuffer`, `TypedArray`, `DataView`, `URLSearchParams`, `Blob`, `FormData`, and more. Detection is based on duck-typing, so it is also compatible with other Web-standard implementations.

## Timeout

```javascript
import { fetch, AbortController } from "miniprogram-fetch-stream";

const controller = new AbortController();
setTimeout(() => { controller.abort(); }, 5000); // 5-second timeout

fetch("https://example.com/api/slow", {
    signal: controller.signal,
})
    .catch(() => {
        console.log("Request timed out");
    });
```

> **Note:** The timeout value should be smaller than the mini program platform's default timeout (typically 60000 ms), otherwise the platform will terminate the request first.

## Compatibility

See [fetch-xhr-shim](https://www.npmjs.com/package/fetch-xhr-shim) for details.

## Stream Support

Receive response data incrementally via the `ReadableStream` interface, suitable for large file downloads, Server-Sent Events (SSE), and similar scenarios.

> **Prerequisites:** The mini program's `request` function must support the `enableChunked` parameter, and the returned `RequestTask` must support `onHeadersReceived` and `onChunkReceived` event listeners.

> **SSE header requirements:** When using Server-Sent Events, the server response must include the following headers, otherwise the mini program may fail to receive streaming data:
>
> ```
> Content-Type: text/event-stream; charset=utf-8
> Transfer-Encoding: chunked
> ```
>
> If streaming requests fail, first verify that the server response headers match the above requirements.

```bash
npm install web-streams-polyfill
```

```javascript
import { ReadableStream } from "web-streams-polyfill";
import { fetch, TextDecoder } from "miniprogram-fetch-stream";
import { setEnableChunked, setReadableStreamClass } from "miniprogram-fetch-stream";

setEnableChunked(true);
setReadableStreamClass(ReadableStream);

fetch("https://example.com/api/stream")
    .then(async response => {
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            console.log("Chunk:", chunk);
        }
    });
```

> **Known limitations:**
>
> - Enabling `setEnableChunked(true)` on platforms that do not support Chunked Transfer Encoding (e.g., Alipay) may cause requests to fail. Verify platform support before enabling.
> - On WeChat Mini Programs, when streaming is enabled and the response `statusCode` is not a 2XX success code, `wx.request` may fail to return the response body. Consider falling back to non-streaming mode or handling non-2XX responses separately.

## Cookie Support

```bash
npm install miniprogram-cookie-shim
```

```javascript
import { useCookie } from "miniprogram-fetch-stream";
import { Cookie, createAccessor } from "miniprogram-cookie-shim";

// Enable cookie support (default: "same-origin")
// For cross-origin requests, set RequestInit.credentials = "include"
useCookie(createAccessor("https://example.com"));

// Read and write cookies — same getter/setter semantics as document.cookie
Cookie.set("token=abc123; Max-Age=3600; Path=/");
console.log(Cookie.get()); // "token=abc123"
```

> See [miniprogram-cookie-shim](https://www.npmjs.com/package/miniprogram-cookie-shim) for details.

> In browsers, `document.cookie` is defined on `Document.prototype`. Mini programs have no `Document` constructor, so you cannot mount it on the prototype. However, if your runtime provides a global `document` object (e.g., via cross-platform frameworks like Taro.js), you can simulate `document.cookie` as an instance property:
>
> ```javascript
> if (typeof document === "object" && document && !("cookie" in document)) {
>     Object.defineProperty(document, "cookie", {
>         configurable: true,
>         enumerable: true,
>         get: Cookie.get,
>         set: Cookie.set,
>     });
> }
> ```
>
> Once this code executes, you can use `document.cookie` just like in a browser:
>
> ```javascript
> document.cookie = "token=abc123; Max-Age=3600; Path=/";
> console.log(document.cookie); // "token=abc123"
> ```

## Platform Integration

Automatically detects the runtime environment (WeChat, Alipay, Baidu, ByteDance, QQ, Kwai, JD, RedNote, etc.) and uses the corresponding platform's `request` API to make network calls—no manual configuration required.

### Manually Specify Request Function <!-- omit in toc -->

If the runtime environment is unusual and the `request` API cannot be auto-detected, use `setRequestFunc` to specify it explicitly:

```javascript
import { setRequestFunc } from "miniprogram-fetch-stream";

setRequestFunc(wx.request); // e.g., in a WeChat-like environment that is not auto-detected
```

> **Note for Alipay Mini Program developers:** Alipay reserves browser built-in names such as `globalThis`, `window`, `document`, and `fetch` as keywords. Using them as import identifiers may cause the framework to fail. If you encounter import issues, use aliased imports: `import { fetch as myFetch } from "..."`.

## TextMode

Some mini program platforms (e.g., older versions of Baidu Mini Programs) do not support sending `ArrayBuffer` via their `request` API, which prevents binary bodies like `Blob` and `FormData` from being uploaded. Enable `setTextMode(true)` to force all request data to be sent as strings:

```javascript
import { setTextMode } from "miniprogram-fetch-stream";

setTextMode(true);
```

When enabled, `ArrayBuffer`-typed bodies are automatically decoded to strings before sending. This mode is disabled by default and should only be enabled when encountering a platform that does not support ArrayBuffer sending.

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
