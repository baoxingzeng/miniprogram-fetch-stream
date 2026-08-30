export * from "./index";
import { TextEncoderP } from "fetch-xhr-shim";
import { TextDecoderP } from "fetch-xhr-shim";

import { AbortControllerP } from "fetch-xhr-shim";
import { AbortSignalP } from "fetch-xhr-shim";

import { BlobP } from "fetch-xhr-shim";
import { FileP } from "fetch-xhr-shim";

import { URLSearchParamsP } from "fetch-xhr-shim";
import { FormDataP } from "fetch-xhr-shim";

import { fetchP } from "./fetchP";
import { fixFetch } from "fetch-xhr-shim";
import { HeadersP } from "fetch-xhr-shim";
import { RequestP } from "fetch-xhr-shim";
import { ResponseP } from "fetch-xhr-shim";

/* eslint-disable no-prototype-builtins */
const g: typeof globalThis =
    (typeof globalThis !== "undefined" && globalThis) ||
    (typeof window !== "undefined" && window) ||
    (typeof self !== "undefined" && self) ||
    // @ts-ignore eslint-disable-next-line no-undef
    (typeof global !== "undefined" && global) ||
    {};

if (!g.fetch) {
    g.fetch = fetchP;
    if (!g.Headers) { g.Headers = HeadersP; }
    if (!g.Request) { g.Request = RequestP; }
    if (!g.Response) { g.Response = ResponseP; }
} else {
    if (!g.Blob || !g.FormData) {
        g.fetch = fixFetch();
    }
}

if (!g.TextEncoder) { g.TextEncoder = TextEncoderP; }
if (!g.TextDecoder) { g.TextDecoder = TextDecoderP; }

if (!g.AbortController) { g.AbortController = AbortControllerP; }
if (!g.AbortSignal) { g.AbortSignal = AbortSignalP; }

if (!g.Blob) { g.Blob = BlobP; }
if (!g.File) { g.File = FileP; }

if (!g.URLSearchParams) { g.URLSearchParams = URLSearchParamsP; }
if (!g.FormData) { g.FormData = FormDataP; }
