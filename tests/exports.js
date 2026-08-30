// @ts-check
import {
    TextEncoder, TextEncoderP,
    TextDecoder, TextDecoderP,

    AbortController, AbortControllerP,
    AbortSignal, AbortSignalP,

    Blob, BlobP,
    File, FileP,

    URLSearchParams, URLSearchParamsP,
    FormData, FormDataP,

    fetch, fetchP,
    Headers, HeadersP,
    Request, RequestP,
    Response, ResponseP,

    fixFetch,
    setEnableChunked,
    setReadableStreamClass,
} from "../dist/esm/index.js";
// } from "../dist/fetch-xhr-shim.esm.min.js";

export {
    fixFetch,
    setEnableChunked,
    setReadableStreamClass,
};

export const protagonistConfig = {
    useNativeTextEncoder: false,
    useNativeTextDecoder: false,

    useNativeAbortController: false,
    useNativeAbortSignal: false,

    useNativeBlob: false,
    useNativeFile: false,

    useNativeURLSearchParams: false,
    useNativeFormData: false,

    useNativeFetch: false,
    useNativeHeaders: false,
    useNativeRequest: false,
    useNativeResponse: false,
};

export class Protagonist {
    static get TextEncoder() { return /** @type {typeof globalThis.TextEncoder} */(protagonistConfig.useNativeTextEncoder ? TextEncoder : TextEncoderP); }
    static get TextDecoder() { return /** @type {typeof globalThis.TextDecoder} */(protagonistConfig.useNativeTextDecoder ? TextDecoder : TextDecoderP); }

    static get AbortController() { return /** @type {typeof globalThis.AbortController} */(protagonistConfig.useNativeAbortController ? AbortController : AbortControllerP); }
    static get AbortSignal() { return /** @type {typeof globalThis.AbortSignal} */(protagonistConfig.useNativeAbortSignal ? AbortSignal : AbortSignalP); }

    static get Blob() { return /** @type {typeof globalThis.Blob} */(protagonistConfig.useNativeBlob ? Blob : BlobP); }
    static get File() { return /** @type {typeof globalThis.File} */(protagonistConfig.useNativeFile ? File : FileP); }

    static get URLSearchParams() { return /** @type {typeof globalThis.URLSearchParams} */(protagonistConfig.useNativeURLSearchParams ? URLSearchParams : URLSearchParamsP); }
    static get FormData() { return /** @type {typeof globalThis.FormData} */(protagonistConfig.useNativeFormData ? FormData : FormDataP); }

    static get fetch() { return /** @type {typeof globalThis.fetch} */(protagonistConfig.useNativeFetch ? fixFetch(fetch) : fetchP); }
    static get Headers() { return /** @type {typeof globalThis.Headers} */(protagonistConfig.useNativeHeaders ? Headers : HeadersP); }
    static get Request() { return /** @type {typeof globalThis.Request} */(protagonistConfig.useNativeRequest ? Request : RequestP); }
    static get Response() { return /** @type {typeof globalThis.Response} */(protagonistConfig.useNativeResponse ? Response : ResponseP); }
}

export const subordinateConfig = {
    useNativeTextEncoder: true,
    useNativeTextDecoder: true,

    useNativeAbortController: true,
    useNativeAbortSignal: true,

    useNativeBlob: true,
    useNativeFile: true,

    useNativeURLSearchParams: true,
    useNativeFormData: true,

    useNativeFetch: true,
    useNativeHeaders: true,
    useNativeRequest: true,
    useNativeResponse: true,
};

export class Subordinate {
    static get TextEncoder() { return /** @type {typeof globalThis.TextEncoder} */(subordinateConfig.useNativeTextEncoder ? TextEncoder : TextEncoderP); }
    static get TextDecoder() { return /** @type {typeof globalThis.TextDecoder} */(subordinateConfig.useNativeTextDecoder ? TextDecoder : TextDecoderP); }

    static get AbortController() { return /** @type {typeof globalThis.AbortController} */(subordinateConfig.useNativeAbortController ? AbortController : AbortControllerP); }
    static get AbortSignal() { return /** @type {typeof globalThis.AbortSignal} */(subordinateConfig.useNativeAbortSignal ? AbortSignal : AbortSignalP); }

    static get Blob() { return /** @type {typeof globalThis.Blob} */(subordinateConfig.useNativeBlob ? Blob : BlobP); }
    static get File() { return /** @type {typeof globalThis.File} */(subordinateConfig.useNativeFile ? File : FileP); }

    static get URLSearchParams() { return /** @type {typeof globalThis.URLSearchParams} */(subordinateConfig.useNativeURLSearchParams ? URLSearchParams : URLSearchParamsP); }
    static get FormData() { return /** @type {typeof globalThis.FormData} */(subordinateConfig.useNativeFormData ? FormData : FormDataP); }

    static get fetch() { return /** @type {typeof globalThis.fetch} */(subordinateConfig.useNativeFetch ? fixFetch(fetch) : fetchP); }
    static get Headers() { return /** @type {typeof globalThis.Headers} */(subordinateConfig.useNativeHeaders ? Headers : HeadersP); }
    static get Request() { return /** @type {typeof globalThis.Request} */(subordinateConfig.useNativeRequest ? Request : RequestP); }
    static get Response() { return /** @type {typeof globalThis.Response} */(subordinateConfig.useNativeResponse ? Response : ResponseP); }
}
