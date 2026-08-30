import { getPlatform } from "miniprogram-platform";

export const platform = /*#__PURE__*/getPlatform() as {
    name: string;
    mp: {
        request: TRequestFunc;
        getStorageSync: (key: string) => unknown;
        setStorage: (value: { key: string; data: string }) => void;
    };
};

export function getRequestFunc() {
    const extractFn = function (platform: { mp: { request: TRequestFunc } }) {
        // @ts-ignore
        const request = platform && (platform.mp.request || platform.mp.httpRequest /* DingTalk Mini Program */);
        return typeof request === "function" ? request.bind(platform.mp) : request;
    }

    return extractFn(platform) || function errorRequest(options: IRequestOptions): IRequestTask {
        const errMsg = "NOT_SUPPORTED_ERR", errno = 9;  // DOMException (NotSupportedError)

        const errInfo = {
            errMsg,
            errno,
            exception: {
                retryCount: 0,
                reasons: [{ errMsg, errno }],
            },
            useHttpDNS: false,
        };

        Promise.resolve(errInfo)
            .then(function (err: typeof errInfo) {
                try { if (options.fail) { options.fail(err); } } catch (e) { console.error(e); }
                if (options.complete) { options.complete(err); }
            });

        throw new ReferenceError("request is not defined");
    }
}

/**
 * 发起 HTTPS 网络请求。
 */
export type TRequestFunc = (options: IRequestOptions) => IRequestTask;

export interface IRequestOptions {
    /**
     * 开发者服务器接口地址
     */
    url: string;

    /**
     * 请求的参数
     */
    data?: string | object | ArrayBuffer | undefined;

    /**
     * 设置请求的 header，header 中不能设置 Referer。content-type 默认为 application/json
     */
    header?: object;

    /**
     * 支付宝：设置请求的 HTTP 头对象，默认 {'content-type':'application/json'}，该对象里面的 key 和 value 必须是 String 类型
     */
    headers?: object;

    /**
     * 超时时间，单位为毫秒。默认值为 60000
     */
    timeout?: number;

    /**
     * HTTP 请求方法
     * 默认值：GET
     */
    method?: "OPTIONS" | "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "TRACE" | "CONNECT";

    /**
     * 返回的数据格式
     * 合法值：
     * - json(默认值): 返回的数据为 JSON，返回后会对返回的数据进行一次 JSON.parse
     * - 其他: 不对返回的内容进行 JSON.parse
     * - 支付宝（额外类型）："json_or_text" | "base64" | "arraybuffer"
     */
    dataType?: "json" | "text" | "json_or_text" | "base64" | "arraybuffer";

    /**
     * 响应的数据类型
     * 合法值：
     * - text(默认值): 响应的数据为文本
     * - arraybuffer: 响应的数据为 ArrayBuffer
     */
    responseType?: "text" | "arraybuffer";

    /**
     * 使用高性能模式。从基础库 v3.5.0 开始在 Android 端默认开启，其他端暂不生效。该模式下有更优的网络性能表现，更多信息请查看下方说明。
     * 默认值：true
     */
    useHighPerformanceMode?: boolean;

    withCredentials?: boolean;

    /**
     * 支付宝
     * 是否手工设置 cookie。如果为 true，请求将使用 headers 中设置的 cookie；如果为 false，则 headers 中的 cookie 字段将被忽略，请求头中将包含服务端上一次返回的 cookie（如果有且未过期）
     * 默认值：false
     */
    enableCookie?: boolean;

    /**
     * 开启 http2
     * 默认值：false
     */
    enableHttp2?: boolean;

    /**
     * 是否开启 profile。iOS 和 Android 端默认开启，其他端暂不支持。开启后可在接口回调的 res.profile 中查看性能调试信息。
     * 默认值：true
     */
    enableProfile?: boolean;

    /**
     * 是否开启 Quic/h3 协议（iOS 微信目前使用 gQUIC-Q43；Android 微信在 v8.0.54 前使用 gQUIC-Q43，v8.0.54 开始使用 IETF QUIC，即 h3 协议；PC微信使用 IETF QUIC，即 h3 协议）
     * 默认值：false
     */
    enableQuic?: boolean;

    /**
     * 开启 Http 缓存
     * 默认值：false
     */
    enableCache?: boolean;

    /**
     * 是否开启 HttpDNS 服务。如开启，需要同时填入 httpDNSServiceId 。
     * 默认值：false
     */
    enableHttpDNS?: boolean

    /**
     * HttpDNS 服务商 Id。
     */
    httpDNSServiceId?: string;

    /**
     * HttpDNS 超时时间。HttpDNS解析时间超过该值时不再走HttpDNS，本次请求将回退到localDNS。默认为 60000 毫秒。
     * 默认值：60000
     */
    httpDNSTimeout?: number;

    /**
     * 开启 transfer-encoding chunked。
     * 默认值：false
     */
    enableChunked?: boolean;

    /**
     * 强制使用蜂窝网络发送请求
     * 默认值：false
     */
    forceCellularNetwork?: boolean;

    /**
     * 重定向拦截策略。（目前安卓、iOS、开发者工具已支持，PC端将在后续支持）
     * 合法值：
     * - follow(默认值): 不拦截重定向，即客户端自动处理重定向
     * - manual: 拦截重定向。开启后，当 http 状态码为 3xx 时客户端不再自动重定向，而是触发 onHeadersReceived 回调，并结束本次 request 请求。可通过 onHeadersReceived 回调中的 header.Location 获取重定向的 url
     */
    redirect?: "follow" | "manual";

    /**
     * 接口调用成功的回调函数
     */
    success?: (res: IRequestSuccessCallbackResult) => void;

    /**
     * 接口调用失败的回调函数
     */
    fail?: (err: IRequestFailCallbackResult) => void;

    /**
     * 接口调用结束的回调函数（调用成功、失败都会执行）
     */
    complete?: Function;
}

export interface IGeneralCallbackResult {
    /**
     * 网络请求过程中的一些异常信息，例如httpdns超时等
     */
    exception: {
        /**
         * 本次请求底层重试次数
         */
        retryCount: number;

        /**
         * 本次请求底层失败信息，所有失败信息均符合Errno错误码
         */
        reasons: Array<{
            /**
             * 错误原因
             */
            errMsg: string;

            /**
             * 错误码
             */
            errno: number;
        }>;
    };

    /**
     * 最终请求是否使用了HttpDNS解析的IP。仅当enableHttpDNS传true时返回此字段。如果开启enableHttpDNS但最终请求未使用HttpDNS解析的IP，可在exception查看原因。
     */
    useHttpDNS: boolean;
}

export interface IRequestSuccessCallbackBaseResult {
    /**
     * 开发者服务器返回的数据
     */
    data: string | object | ArrayBuffer;

    /**
     * 开发者服务器返回的 cookies，格式为字符串数组
     */
    cookies?: string[];

    /**
     * 开发者服务器返回的 HTTP 状态码
     */
    statusCode: number;

    /**
     * 开发者服务器返回的 HTTP Response Header
     */
    header: object;

    /**
     * 支付宝：目标服务器返回的 HTTP 状态码
     */
    status?: number;

    /**
     * 支付宝：目标服务器返回的 HTTP 响应头
     */
    headers?: object;
}

export interface IRequestSuccessCallbackResult extends IGeneralCallbackResult, IRequestSuccessCallbackBaseResult {
    /**
     * 网络请求过程中一些调试信息。目前仅 iOS 和 Android 端支持，其他端暂不支持。
     */
    profile: {
        /**
         * 调用接口的时间。
         */
        invokeStart: number;

        /**
         * httpDNS 开始查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持
         */
        httpDNSDomainLookUpStart: number;

        /**
         * httpDNS 完成查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持
         */
        httpDNSDomainLookUpEnd: number;

        /**
         * 开始排队的时间。达到并行上限时才需要排队。
         */
        queueStart: number;

        /**
         * 结束排队的时间。达到并行上限时才需要排队。如果未发生排队，则该字段和 queueStart 字段值相同
         */
        queueEnd: number;

        /**
         * 第一个 HTTP 重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0
         */
        redirectStart: number;

        /**
         * 最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为 0
         */
        redirectEnd: number;

        /**
         * 组件准备好使用 HTTP 请求抓取资源的时间，这发生在检查本地缓存之前
         */
        fetchStart: number;

        /**
         * Local DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
         */
        domainLookUpStart: number;

        /**
         * Local DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
         */
        domainLookUpEnd: number;

        /**
         * HTTP（TCP） 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间
         */
        connectStart: number;

        /**
         * HTTP（TCP） 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间。注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过
         */
        connectEnd: number;

        /**
         * SSL建立连接的时间,如果不是安全连接,则值为 0
         */
        SSLconnectionStart: number;

        /**
         * SSL建立完成的时间,如果不是安全连接,则值为 0
         */
        SSLconnectionEnd: number;

        /**
         * HTTP请求读取真实文档开始的时间（完成建立连接），包括从本地读取缓存。连接错误重连时，这里显示的也是新建立连接的时间
         */
        requestStart: number;

        /**
         * HTTP请求读取真实文档结束的时间
         */
        requestEnd: number;

        /**
         * HTTP 开始接收响应的时间（获取到第一个字节），包括从本地读取缓存
         */
        responseStart: number;

        /**
         * HTTP 响应全部接收完成的时间（获取到最后一个字节），包括从本地读取缓存
         */
        responseEnd: number;

        /**
         * 当次请求连接过程中实时 rtt
         */
        rtt: number;

        /**
         * 评估的网络状态 unknown, offline, slow 2g, 2g, 3g, 4g, last/0, 1, 2, 3, 4, 5, 6
         */
        estimate_nettype: number;

        /**
         * 协议层根据多个请求评估当前网络的 rtt（仅供参考）
         */
        httpRttEstimate: number;

        /**
         * 传输层根据多个请求评估的当前网络的 rtt（仅供参考）
         */
        transportRttEstimate: number;

        /**
         * 评估当前网络下载的kbps
         */
        downstreamThroughputKbpsEstimate: number;

        /**
         * 当前网络的实际下载kbps
         */
        throughputKbps: number;

        /**
         * 当前请求的IP
         */
        peerIP: string;

        /**
         * 当前请求的端口
         */
        port: number;

        /**
         * 是否复用连接
         */
        socketReused: boolean;

        /**
         * 发送的字节数
         */
        sendBytesCount: number;

        /**
         * 收到字节数
         */
        receivedBytedCount: number;

        /**
         * 使用协议类型，有效值：http1.1, h2, quic, unknown
         */
        protocol: string;

        /**
         * 是否走到了高性能模式。基础库 v3.3.4 起支持。
         */
        usingHighPerformanceMode: boolean;
    };
}

export interface IRequestFailCallbackResult extends IGeneralCallbackResult {
    /**
     * 错误信息
     */
    errMsg: string;

    /**
     * errno 错误码
     */
    errno: number;
}

export interface IAliRequestFailCallbackResult {
    /**
     * 错误码
     */
    error: number;

    /**
     * 错误信息
     */
    errorMessage: string;

    /**
     * 开发者服务器返回的数据，格式取决于请求时的 dataType 参数。
     * 注意：当错误码为 14 或 19 时才会返回此字段
     */
    data?: string | object | ArrayBuffer;

    /**
     * 开发者服务器返回的 HTTP 状态码
     * 注意：当错误码为 14 或 19 时才会返回此字段
     */
    status?: number;

    /**
     * 开发者服务器返回的 HTTP Response Header
     * 注意：当错误码为 14 或 19 时才会返回此字段
     */
    headers?: object;

    /* Alipay IDE */ statusCode?: number;
    /* Alipay IDE */ header?: object;
}

export interface IRequestTask {
    /**
     * 中断请求任务
     */
    abort: () => void;

    /**
     * 监听 HTTP Response Header 事件。会比请求完成事件更早
     */
    onHeadersReceived: (listener: (res: {
        /**
         * 开发者服务器返回的 HTTP Response Header
         */
        header: object;

        /**
         * 开发者服务器返回的 HTTP 状态码 （目前开发者工具上不会返回 statusCode 字段，可用真机查看该字段，后续将会支持）
         */
        statusCode: number;

        /**
         * 开发者服务器返回的 cookies，格式为字符串数组
         */
        cookies: string[];
    }) => void) => void;

    /**
     * 移除 HTTP Response Header 事件的监听函数
     */
    offHeadersReceived: (listener: Function) => void;

    /**
     * 监听 Transfer-Encoding Chunk Received 事件。当接收到新的chunk时触发。
     */
    onChunkReceived: (listener: (res: {
        /**
         * 返回的chunk buffer
         */
        data: ArrayBuffer;
    }) => void) => void;

    /**
     * 移除 Transfer-Encoding Chunk Received 事件的监听函数
     */
    offChunkReceived: (listener: Function) => void;
}
