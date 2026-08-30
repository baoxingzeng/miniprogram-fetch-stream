import { Blob, Headers, RequestP, ResponseP, setReadableStreamClass as setRSC } from "fetch-xhr-shim";
import { checkArgsLength, normalizeName, normalizeValue, encode, coerceBody } from "fetch-xhr-shim/internal";
import { DOMException, Payload, isEventTarget, isHeaders, isArrayBuffer, ArrayBuffer_isView } from "fetch-xhr-shim/helpers";
import { statusTextMap } from "./statusTextMap";
import { getRequestFunc } from "./request";
import type { TRequestFunc, IRequestOptions, IRequestTask, IRequestSuccessCallbackBaseResult, IRequestFailCallbackResult } from "./request";

const enableChunked = { value: false };
export function setEnableChunked(value: boolean) { enableChunked.value = !!value; }

const mp = {
    request: /*#__PURE__*/getRequestFunc(),
    ReadableStream: /*#__PURE__*/function () {
        return (typeof ReadableStream !== "undefined" && ReadableStream) as typeof ReadableStream || undefined;
    }(),
};

export function setRequestFunc(request: unknown, thisArg?: any) {
    mp.request = (typeof request === "function" && thisArg !== undefined) ? request.bind(thisArg) : request as TRequestFunc;
}

function getReadableStreamClass() {
    return mp.ReadableStream || (function () { throw new ReferenceError("ReadableStream is not defined") })();
}

export function setReadableStreamClass(RSClass: unknown) {
    setRSC(RSClass); mp.ReadableStream = RSClass as typeof ReadableStream;
}

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {   // @ts-expect-error
    if (this instanceof fetchP) { throw new TypeError("fetch is not a constructor"); }
    checkArgsLength(arguments.length, 1, "globalThis", "fetch");

    return new Promise(function (resolve: ((value: Response) => void), reject: ((reason?: any) => void)) {
        const request = new RequestP(input, init);  // @ts-ignore
        const signal = request.__Request__.signal as (AbortSignal | undefined);

        if (signal && signal.aborted) {
            return reject(signal.reason);
        }

        let aborted = false;    // @ts-ignore
        let payload = request.__Body__.payload as (Payload | undefined);
        let response: ResponseP;

        function onload(res: Awaited<IRequestStreamResult>) {
            let options = {
                status: res.status,
                statusText: statusTextMap[res.status] || "unknown",
            };

            setTimeout(function () {
                response = new ResponseP(null, options);    // @ts-ignore
                response.__Response__.url = request.url;

                // @ts-ignore
                response.__Response__.headers = res.headers;

                if (enableChunked.value) {
                    Object.defineProperty(response, "body", {
                        configurable: true,
                        enumerable: true,
                        get: function body() { return res.body; },
                    });
                }

                // @ts-ignore
                let _payload = response.__Body__.payload = createPayload(res);
                let _contentType = response.headers.get("Content-Type") || "";
                if (_contentType) { _payload.type = _contentType; }

                if (!aborted) resolve(response);
                else reject(createAbortException());
            }, 0);
        }

        let reqopts: IRequestInitOptions = {
            method: request.method,
            headers: {},
        };

        if (request.credentials === "include") {
            reqopts.withCredentials = true;
        } else if (request.credentials === "omit") {
            reqopts.withCredentials = false;
        }

        if (init && typeof init === "object" && init.headers && typeof init.headers === "object" && !isHeaders(init.headers)) {
            let headers = init.headers as Record<string, string>;
            let names: string[] = [];

            Object.getOwnPropertyNames(headers).forEach(function (name) {
                names.push(normalizeName(name));
                reqopts.headers![name] = normalizeValue(headers[name]!);
            });

            request.headers.forEach(function (value: string, name: string) {
                if (names.indexOf(name) === -1) {
                    reqopts.headers![name] = value;
                }
            });
        } else {
            request.headers.forEach(function (value: string, name: string) {
                reqopts.headers![name] = value;
            });
        }

        if (signal) {
            const abortFn = function () { aborted = true; removeFn(); }
            const removeFn = function () { signal.removeEventListener("abort", abortFn); }

            signal.addEventListener("abort", abortFn);
            reqopts.complete = function () { removeFn(); }
        }

        Promise.resolve(payload ? payload.promise : null).then(function (body) {
            if (aborted) { return reject(createAbortException()); }
            if (body) { reqopts.body = coerceBody(body); }
            if (signal) { reqopts.signal = signal; }

            MiniProgram_request(request.url, reqopts)
                .then(function (res) { onload(res); })
                .catch(function (e) { reject(e); console.error(e); });
        })
            .catch(function (e) {
                reject(new TypeError("Failed to fetch"));
                console.error(e);
            });
    });
}

function createAbortException() {
    return new DOMException("The user aborted a request.", "AbortError");
}

function createPayload(res: Awaited<IRequestStreamResult>) {
    let payload = Object.create(Payload.prototype) as Payload;  // @ts-ignore
    payload._type = "";                                         // @ts-ignore
    payload.length = 0;

    let promise: Promise<string | ArrayBuffer> | null = null;
    return Object.defineProperty(payload, "promise", {
        get: function () {
            if (!enableChunked.value) { return res.arrayBuffer!(); }
            if (promise) return promise;

            let reader = res.body!.getReader();
            let chunks: Uint8Array<ArrayBuffer>[] = [];

            function pump(): Promise<Uint8Array<ArrayBuffer>[]> {
                return reader.read().then(function (result) {
                    if (result.done) {
                        reader.releaseLock();
                        return chunks;
                    }
                    chunks.push(result.value);
                    return pump();
                });
            }

            promise = pump().then(function (chunks) { return (new Blob(chunks)).arrayBuffer(); });
            return promise;
        },
    });
}

type IHeadersReceivedResult = Parameters<Parameters<IRequestTask["onHeadersReceived"]>[0]>[0];
type IChunkReceivedResult = Parameters<Parameters<IRequestTask["onChunkReceived"]>[0]>[0];

type IRequestInitOptions = Omit<IRequestOptions, "url" | "method" | "headers" | "dataType" | "responseType" | "success" | "fail"> & {
    method?: string;
    headers?: Record<string, string>;
    body?: string | ArrayBuffer;
    signal?: AbortSignal | null;
};

type IRequestStreamResult = Promise<{
    status: number;
    headers: Headers;
    body?: ReadableStream<Uint8Array<ArrayBuffer>> | null;
    arrayBuffer?: () => Promise<ArrayBuffer>;
}>;

type TGetCookieFn = (url: string, withCredentials?: boolean) => string;
type TSetCookieFn = (url: string, withCredentials?: boolean, cookies?: string | string[]) => void;

const CookieAccessor = { get: null as null | TGetCookieFn, set: null as null | TSetCookieFn };
export function useCookie(accessor: { get: TGetCookieFn; set: TSetCookieFn; }) {
    CookieAccessor.get = function (url, withCredentials) { return accessor.get(url, withCredentials); };
    CookieAccessor.set = function (url, withCredentials, cookies) { return accessor.set(url, withCredentials, cookies); };
}

function MiniProgram_request<T extends IRequestInitOptions>(input: string, init?: T): IRequestStreamResult {
    let signal = !!init && typeof init === "object" && isEventTarget(init.signal) && init.signal;
    let saveCookie: ((res: ReturnType<typeof getHeaders>, responseHeaders: Headers) => void) | null = null;

    let ctrl = {
        enqueue: null as null | ((chunk: Uint8Array<ArrayBuffer>) => void),
        close: null as null | (() => void),
        error: null as null | ((e?: any) => void),
    };

    let responseDeferred = {
        resolve: null as null | ((value: Awaited<IRequestStreamResult>) => void),
        reject: null as null | ((e?: any) => void),
    };

    let resolved = false;
    let rejected = false;

    function requestSuccess(res: IRequestSuccessCallbackBaseResult) {
        setTimeout(function () {
            if (ctrl.close) { ctrl.close(); }
            if (signal) { signal.removeEventListener("abort", safeAbort); }

            if (!resolved && responseDeferred.resolve) {
                let resHeader = getHeaders(res);
                let responseHeaders = new Headers(resHeader.header as Record<string, string>);

                if (saveCookie) {
                    saveCookie(resHeader, responseHeaders);
                }

                let result: Awaited<IRequestStreamResult> = {
                    status: resHeader.statusCode,
                    headers: responseHeaders,
                };

                if (enableChunked.value) {
                    let ReadableStreamClass = getReadableStreamClass();
                    result.body = new ReadableStreamClass<Uint8Array<ArrayBuffer>>({
                        start(controller) {
                            controller.enqueue(new Uint8Array(getResponse(res)));
                            controller.close();
                        },
                    });
                } else {
                    result.arrayBuffer = function () { return Promise.resolve(getResponse(res)); }
                }

                resolved = true;
                responseDeferred.resolve(result);
            }
        }, 0);
    }

    function requestFail(err: IRequestFailCallbackResult) {
        // Alipay Mini Program
        if (("header" in err && "statusCode" in err) || ("headers" in err && "status" in err)) {
            let resHeader = getHeaders(err as { header: object; statusCode: number; });

            return requestSuccess({
                statusCode: resHeader.statusCode,
                header: resHeader.header,
                cookies: resHeader.cookies!,
                data: "data" in err ? err.data as string | object | ArrayBuffer || "" : "",
            });
        }

        setTimeout(function () {
            if (ctrl.error) { ctrl.error(err); }
            if (signal) { signal.removeEventListener("abort", safeAbort); }

            if (!rejected && responseDeferred.reject) {
                rejected = true;
                responseDeferred.reject(err);
            }
        }, 0);
    }

    let reqopts: IRequestOptions = {
        url: "" + input,
        method: (init?.method || "GET") as NonNullable<IRequestOptions["method"]>,
        header: (init?.headers || init?.header) as NonNullable<IRequestOptions["header"]>,
        data: init?.body || init?.data,
        dataType: "arraybuffer",
        responseType: "arraybuffer",
        withCredentials: init?.withCredentials || false,
        success: requestSuccess,
        fail: requestFail,
    };

    if (enableChunked.value) {
        reqopts.enableChunked = true;
    }

    if (CookieAccessor.get) {
        let hasCookie = false;
        if (reqopts.header && typeof reqopts.header === "object") {
            let names = Object.getOwnPropertyNames(reqopts.header);
            for (let i = 0; i < names.length; ++i) {
                let name = names[i]!;
                if (name.toLowerCase() === "cookie") {
                    hasCookie = true;
                    break;
                }
            }
        }

        if (!hasCookie) {
            let cookie = CookieAccessor.get(reqopts.url, reqopts.withCredentials);
            if (cookie) {
                reqopts.enableCookie = true;    // Alipay Mini Program
                (reqopts.header as Record<string, string>)["Cookie"] = cookie;
            }
        }
    }

    if (CookieAccessor.set) {
        saveCookie = function (res, responseHeaders) {
            let cookies = ("cookies" in res && Array.isArray(res.cookies)) ? res.cookies : (responseHeaders.get("Set-Cookie") || "");
            if (cookies.length > 0) {
                CookieAccessor.set!(reqopts.url, reqopts.withCredentials, cookies);
            }
        }
    }

    if (!!init && typeof init === "object") {
        let excludeKeys = Object.getOwnPropertyNames(reqopts).concat(["headers", "body", "signal"]);
        let keys = Object.getOwnPropertyNames(init);

        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            if (excludeKeys.indexOf(key) < 0) {
                // @ts-ignore
                reqopts[key] = init[key];
            }
        }
    }

    reqopts.headers = reqopts.header!;  // Alipay Mini Program
    let requestTask = mp.request(reqopts);

    function safeAbort() {
        let aborted = false;
        if (!!requestTask && typeof requestTask === "object") {
            if ("abort" in requestTask && typeof requestTask.abort === "function") {
                aborted = true;
                requestTask.abort();
            }
        }

        setTimeout(function () {
            if (!aborted && !rejected && responseDeferred.reject) {
                rejected = true;
                responseDeferred.reject(createAbortException());
            }
        }, 0);
    }

    if (signal) {
        signal.addEventListener("abort", safeAbort);
    }

    if (enableChunked.value && !!requestTask && typeof requestTask === "object") {
        if ("onHeadersReceived" in requestTask && "onChunkReceived" in requestTask) {
            let ReadableStreamClass = getReadableStreamClass();
            let stream = new ReadableStreamClass<Uint8Array<ArrayBuffer>>((function () {
                function headersHandler(res: IHeadersReceivedResult) {
                    setTimeout(function () {
                        if (!resolved && responseDeferred.resolve) {
                            let resHeader = getHeaders(res);
                            let responseHeaders = new Headers(resHeader.header as Record<string, string>);

                            if (saveCookie) {
                                saveCookie(resHeader, responseHeaders);
                            }

                            resolved = true;
                            responseDeferred.resolve({
                                status: resHeader.statusCode,
                                headers: responseHeaders,
                                body: stream,
                            });
                        }
                    }, 0);
                }

                function chunkHandler(res: IChunkReceivedResult) {
                    if (ctrl.enqueue) {
                        ctrl.enqueue(new Uint8Array(getResponse(res)));
                    }
                }

                function dispose() {
                    if ("offHeadersReceived" in requestTask && "offChunkReceived" in requestTask) {
                        requestTask.offHeadersReceived(headersHandler);
                        requestTask.offChunkReceived(chunkHandler);
                    }
                }

                return {
                    start(controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>) {
                        requestTask.onHeadersReceived(headersHandler);
                        requestTask.onChunkReceived(chunkHandler);

                        ctrl.enqueue = function (chunk) { controller.enqueue(chunk); }
                        ctrl.close = function () { dispose(); controller.close(); }
                        ctrl.error = function (e) { dispose(); controller.error(e); }
                    },
                    cancel() {
                        dispose();
                        safeAbort();
                    },
                };
            })());
        }
    }

    return new Promise(function (resolve: ((value: Awaited<IRequestStreamResult>) => void), reject) {
        responseDeferred.resolve = resolve;
        responseDeferred.reject = reject;
    });
}

function getHeaders(res: Omit<IHeadersReceivedResult, "cookies"> & { cookies?: string[]; }) {
    let result: typeof res = {
        header: ("header" in res ? res.header : "headers" in res ? (res as IRequestSuccessCallbackBaseResult).headers! : {}) as Record<string, string>,
        statusCode: "statusCode" in res ? res.statusCode : "status" in res ? (res as IRequestSuccessCallbackBaseResult).status! : 200,
    };
    if ("cookies" in res && !!res.cookies) { result.cookies = res.cookies; }
    return result;
}

function getResponse(res: { data: string | ArrayBuffer | object; }): ArrayBuffer {
    let data = res.data;
    return isArrayBuffer(data)
        ? data
        : ArrayBuffer_isView(data)
            ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
            : encode(typeof data === "string" ? data : JSON.stringify(data)).buffer;
}

const fetchE = /*#__PURE__*/function () { return (typeof fetch !== "undefined" && fetch) as typeof fetch || fetchP; }();
export { fetchE as fetch, MiniProgram_request as request };
