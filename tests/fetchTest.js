import { suite } from "uvu";
import * as assert from "uvu/assert";
import { getPlatform } from "miniprogram-platform";
import { ReadableStream } from "web-streams-polyfill";
import { ui_rec, testConfig } from "./utils.js";
import { Protagonist, Subordinate, setEnableChunked, setReadableStreamClass } from "./exports.js";

const _name = "fetch";
export const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

const enableChunked = (getPlatform() || {}).name === "WeChat";
setEnableChunked(enableChunked); setReadableStreamClass(ReadableStream);

test("fetch basic GET request", async () => {
    let response = await Protagonist.fetch(testConfig.api_prefix + "/api/user?id=88");
    assert.equal(response.ok, true);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    let data = await response.json();
    assert.equal(data.id, "88");
    assert.equal(data.name, "张三🎉");
    assert.equal(data.age, 25);
});

test("fetch POST request (FormData upload)", async () => {
    let formData = new Subordinate.FormData();
    formData.append("name", "李四");
    formData.append("age", "26");
    let fileContent = "This is the content of the test file.";
    let blob = new Subordinate.Blob([fileContent], { type: "text/plain" });
    formData.append("file", blob, "test-file.txt");
    let response = await Protagonist.fetch(testConfig.api_prefix + "/api/upload", {
        method: "POST",
        body: formData,
        headers: {
            "X-Custom-Header": "polyfill-test"
        },
    });
    assert.equal(response.status, 201);
    let data = await response.json();
    assert.equal(data.code, 0);
    assert.equal(data.message, "success");
    assert.equal(data.data.name, "李四");
    assert.equal(data.data.age, "26");
    assert.equal(data.data.file.filename, "test-file.txt");
    assert.equal(data.data.file.content, fileContent);
});

test("fetch abort request (AbortController)", async () => {
    let controller = new Subordinate.AbortController();
    let signal = controller.signal;
    let fetchPromise = Protagonist.fetch(testConfig.api_prefix + "/api/timeout", { signal });
    controller.abort();
    let abortError = null;
    try {
        await fetchPromise;
    } catch (e) {
        abortError = e;
    }
    assert.ok(abortError instanceof Error);
    assert.equal(abortError.name, "AbortError");
    assert.equal(signal.aborted, true);
});

if (!enableChunked) {
    test("fetch dealing with 404 error response", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/not-found");
        assert.equal(response.ok, false);
        assert.equal(response.status, 404);
        let data = await response.json();
        assert.equal(data.code, 404);
        assert.equal(data.message, "Not Found");
    });
}

test("fetch custom request header", async () => {
    let response = await Protagonist.fetch(testConfig.api_prefix + "/api/header-test", {
        headers: {
            "X-Token": "123456789",
            "Content-Type": "application/json"
        }
    });

    let data = await response.json();
    assert.equal(data.token, "123456789");
    assert.equal(data.contentType, "application/json");
});

if (enableChunked) {
    test("fetch stream - response.body is a ReadableStream", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream");
        assert.equal(response.status, 200);
        assert.ok(response.body instanceof ReadableStream);
    });

    test("fetch stream - read text chunks via getReader()", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream-text");
        assert.equal(response.status, 200);
        assert.ok(response.body instanceof ReadableStream);

        let reader = response.body.getReader();
        let chunks = [];
        let result = await reader.read();
        while (!result.done) {
            let text = new Subordinate.TextDecoder().decode(result.value);
            chunks.push(text);
            result = await reader.read();
        }
        reader.releaseLock();

        let fullText = chunks.join("");
        assert.equal(fullText, "Hello, streaming world!");
    });

    test("fetch stream - read JSON chunks via getReader()", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream");
        assert.equal(response.status, 200);
        assert.ok(response.body instanceof ReadableStream);

        let reader = response.body.getReader();
        let chunks = [];
        let result = await reader.read();
        while (!result.done) {
            chunks.push(new Subordinate.TextDecoder().decode(result.value));
            result = await reader.read();
        }
        reader.releaseLock();

        assert.equal(chunks.length, 3);
        assert.equal(JSON.parse(chunks[0]).chunk, 1);
        assert.equal(JSON.parse(chunks[0]).data, "hello");
        assert.equal(JSON.parse(chunks[1]).chunk, 2);
        assert.equal(JSON.parse(chunks[1]).data, "world");
        assert.equal(JSON.parse(chunks[2]).chunk, 3);
        assert.equal(JSON.parse(chunks[2]).data, "!");
    });

    test("fetch stream - read binary chunks via getReader()", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream-binary");
        assert.equal(response.status, 200);
        assert.ok(response.body instanceof ReadableStream);

        let reader = response.body.getReader();
        let chunks = [];
        let result = await reader.read();
        while (!result.done) {
            chunks.push(result.value);
            result = await reader.read();
        }
        reader.releaseLock();

        assert.equal(chunks.length, 3);

        let allBytes = [];
        for (let chunk of chunks) {
            for (let i = 0; i < chunk.length; i++) {
                allBytes.push(chunk[i]);
            }
        }

        assert.equal(allBytes.length, 12);
        assert.equal(allBytes[0], 0x00);
        assert.equal(allBytes[6], 0x06);
        assert.equal(allBytes[11], 0x0b);
    });

    test("fetch stream - response.text() consumes the body stream", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream-text");
        assert.equal(response.status, 200);
        let text = await response.text();
        assert.equal(text, "Hello, streaming world!");
    });

    test("fetch stream - empty response body", async () => {
        let response = await Protagonist.fetch(testConfig.api_prefix + "/api/stream-empty");
        assert.equal(response.status, 200);
        let text = await response.text();
        assert.equal(text, "");
    });
}
