# miniprogram-fetch-stream <!-- omit in toc -->

A fetch polyfill for multi-platform mini programs，为小程序提供符合 W3C 标准的 Fetch API，一套代码，多端复用。

**[English](https://github.com/baoxingzeng/miniprogram-fetch-stream/blob/main/README.en.md)**

## 目录 <!-- omit in toc -->

- [小程序支持](#小程序支持)
- [特性](#特性)
- [安装](#安装)
- [API](#api)
- [快速开始](#快速开始)
- [超时设置](#超时设置)
- [兼容性](#兼容性)
- [Stream 支持](#stream-支持)
- [Cookie 支持](#cookie-支持)
- [平台集成](#平台集成)
- [文本模式](#文本模式)
- [开源协议](#开源协议)

## 小程序支持

| 微信  | 支付宝 | 百度  | 字节跳动 |  QQ   | 快手  | 京东  | 小红书 |
| :---: | :----: | :---: | :------: | :---: | :---: | :---: | :----: |
|   ✔   |   ✔    |   ✔   |    ✔     |   ✔   |   ✔   |   ✔   |   ✔    |

> 在 Chrome、Firefox、Edge、Safari 等浏览器中，库导出的模块会直接返回浏览器原生实现，无性能损耗。

## 特性

- W3C 标准兼容，提供与浏览器一致的 `fetch`、`Headers`、`Request`、`Response` 等 API
- 提供 `URLSearchParams`、`Blob`、`File`、`FormData`，覆盖常用 body 类型
- 流式请求（Streaming），支持 Transfer-Encoding Chunked，通过 `ReadableStream` 逐块接收响应数据
- 可选插件 [miniprogram-cookie-shim](https://www.npmjs.com/package/miniprogram-cookie-shim)，支持跨请求自动携带与持久化存储
- 自动适配微信、支付宝、百度、字节跳动、QQ、快手、京东、小红书等主流小程序平台

## 安装

```bash
npm install miniprogram-fetch-stream
```

## API

| 模块                     | 说明                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `fetch`                  | 在浏览器环境中为原生 `fetch`，在小程序环境中自动回退为 polyfill，保证 Web 标准行为一致 |
| `Headers`                | 浏览器原生 `Headers` / 小程序 polyfill 自适应                                          |
| `Request`                | 浏览器原生 `Request` / 小程序 polyfill 自适应                                          |
| `Response`               | 浏览器原生 `Response` / 小程序 polyfill 自适应                                         |
| `URLSearchParams`        | 浏览器原生 `URLSearchParams` / 小程序 polyfill 自适应                                  |
| `Blob`                   | 浏览器原生 `Blob` / 小程序 polyfill 自适应                                             |
| `File`                   | 浏览器原生 `File` / 小程序 polyfill 自适应                                             |
| `FormData`               | 浏览器原生 `FormData` / 小程序 polyfill 自适应                                         |
| `AbortController`        | 浏览器原生 `AbortController` / 小程序 polyfill 自适应                                  |
| `AbortSignal`            | 浏览器原生 `AbortSignal` / 小程序 polyfill 自适应                                      |
| `TextEncoder`            | 浏览器原生 `TextEncoder` / 小程序 polyfill 自适应                                      |
| `TextDecoder`            | 浏览器原生 `TextDecoder` / 小程序 polyfill 自适应                                      |
| `setRequestFunc`         | 当无法自动检测到平台的 `request` API 时，手动指定请求函数                              |
| `setTextMode`            | 强制以文本模式发送请求，适用于不支持 ArrayBuffer 发送的小程序平台                      |
| `setEnableChunked`       | 开启 Transfer-Encoding Chunked 模式，使请求支持流式接收响应数据                        |
| `setReadableStreamClass` | 指定 `ReadableStream` 实现类，用于在不支持原生流的小程序环境中启用流式响应             |

> 设计要点：`fetch` 在浏览器中直接返回原生实现，在小程序中自动切换为 polyfill，同一套代码无需任何修改即可在浏览器和小程序中以 Web 标准方式运行。

## 快速开始

### GET 请求 <!-- omit in toc -->

```javascript
import { fetch } from "miniprogram-fetch-stream";

fetch("https://example.com/api/user?id=88")
    .then(response => {
        console.log(response.status);   // 200
        return response.text();
    })
    .then(responseText => {
        console.log(responseText);      // 响应文本
    });
```

### POST 请求（JSON） <!-- omit in toc -->

```javascript
import { fetch } from "miniprogram-fetch-stream";

fetch("https://example.com/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8", },
    body: JSON.stringify({ name: "张三", age: 25 }),
})
    .then(response => response.json())
    .then(data => {
        console.log(data);
    });
```

### POST 请求（FormData 上传） <!-- omit in toc -->

```javascript
import { fetch, Blob, FormData } from "miniprogram-fetch-stream";

const formData = new FormData();
formData.append("name", "李四");
formData.append("file", new Blob(["文件内容"], { type: "text/plain" }), "test.txt");

fetch("https://example.com/api/upload", {
    method: "POST",
    body: formData,
})
    .then(response => {
        console.log(response.status);
    });
```

### POST 请求（URLSearchParams） <!-- omit in toc -->

```javascript
import { fetch, URLSearchParams } from "miniprogram-fetch-stream";

fetch("https://example.com/api/search", {
    method: "POST",
    body: new URLSearchParams({ q: "关键词", page: "1" }),
})
    .then(response => {
        console.log(response.status);
    });
```

> `RequestInit` 的 body 选项支持 `string`、`ArrayBuffer`、`TypedArray`、`DataView`、`URLSearchParams`、`Blob`、`FormData` 等类型。内部通过特征判断，因此也兼容其他符合 Web 标准的实现。

## 超时设置

```javascript
import { fetch, AbortController } from "miniprogram-fetch-stream";

const controller = new AbortController();
setTimeout(() => { controller.abort(); }, 5000); // 5 秒超时

fetch("https://example.com/api/slow", {
    signal: controller.signal,
})
    .catch(() => {
        console.log("请求超时");
    });
```

> 注意：设置的 timeout 值应小于小程序平台默认的超时时间（通常为 60000ms），否则会被平台优先终止。

## 兼容性

> 参考 [fetch-xhr-shim](https://www.npmjs.com/package/fetch-xhr-shim)。

## Stream 支持

通过 `ReadableStream` 接口以流式方式逐块接收响应数据，适用于大文件下载、SSE（Server-Sent Events）等场景。

> **前提条件**：小程序的 `request` 请求函数需要支持 `enableChunked` 参数，且请求函数的返回值 `RequestTask` 需要支持 `onHeadersReceived` 和 `onChunkReceived` 事件监听。

> **SSE 接口要求**：使用 Server-Sent Events 时，服务端响应头必须包含以下字段，否则小程序可能无法正常接收流式数据：
>
> ```
> Content-Type: text/event-stream; charset=utf-8
> Transfer-Encoding: chunked
> ```
>
> 流式请求异常时，请优先检查服务端响应头是否符合上述要求。

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
            console.log("收到数据块：", chunk);
        }
    });
```

> **已知限制**：
>
> - `setEnableChunked(true)` 在不支持 Chunked Transfer Encoding 的小程序平台（如支付宝）中开启时，可能导致请求无法正常发起，请确认目标平台的支持情况后再启用；
> - 微信小程序开启流式请求后，若响应的 `statusCode` 非 2XX 成功状态码，`wx.request` 可能无法正确获取响应数据，此时建议回退到普通请求模式或对非 2XX 响应做特殊处理。

## Cookie 支持

```bash
npm install miniprogram-cookie-shim
```

```javascript
import { useCookie } from "miniprogram-fetch-stream";
import { Cookie, createAccessor } from "miniprogram-cookie-shim";

// 启用 Cookie 支持，默认值为 "same-origin"
// 跨域请求需设置 RequestInit.credentials = "include"
useCookie(createAccessor("https://example.com"));

// 读写 Cookie —— 与 document.cookie 的 getter/setter 语义一致
Cookie.set("token=abc123; Max-Age=3600; Path=/");
console.log(Cookie.get()); // "token=abc123"
```

> 详见 [miniprogram-cookie-shim](https://www.npmjs.com/package/miniprogram-cookie-shim)。

> 浏览器中 `document.cookie` 实际定义在 `Document.prototype` 上，小程序没有 `Document` 构造函数，自然无法在原型上挂载。但如果你的运行环境提供了全局 `document` 对象（如 Taro.js 等跨端框架），可以通过以下方式将 Cookie 模拟实现挂载到实例属性上，达到类似效果：
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
> 如果上述代码成功执行，之后即可像在浏览器中一样操作 `document.cookie`：
>
> ```javascript
> document.cookie = "token=abc123; Max-Age=3600; Path=/";
> console.log(document.cookie); // "token=abc123"
> ```

## 平台集成

自动检测运行环境（微信、支付宝、百度、字节跳动、QQ、快手、京东、小红书等），并使用对应平台的 `request` API 发起网络请求，无需手动配置。

### 手动指定请求函数 <!-- omit in toc -->

如果运行环境比较特殊，无法自动检测到 `request` API 时，可以通过 `setRequestFunc` 显式指定：

```javascript
import { setRequestFunc } from "miniprogram-fetch-stream";

setRequestFunc(wx.request); // 比如在某个类微信但没被自动识别的环境中
```

> **支付宝小程序开发者注意**：支付宝官方将 `globalThis`、`window`、`document`、`fetch` 等浏览器内置对象名列为保留字，不应作为导入标识符使用，否则可能导致框架无法正常访问导入内容。如遇导入异常，可通过导入重命名规避，例如 `import { fetch as myFetch } from "..."`。

## 文本模式

部分小程序平台（如较早版本的百度小程序）的 `request` API 不支持发送 `ArrayBuffer`，导致 `Blob`、`FormData` 等二进制 body 无法正常上传。可通过 `setTextMode(true)` 强制将所有请求数据转为字符串发送：

```javascript
import { setTextMode } from "miniprogram-fetch-stream";

setTextMode(true);
```

启用后，`ArrayBuffer` 类型的 body 会自动解码为字符串后再发起请求。此模式默认关闭，请仅在遇到不支持 ArrayBuffer 发送的平台时进行设置。

## 开源协议

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
