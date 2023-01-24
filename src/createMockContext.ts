// Modified from: https://github.com/Shopify/quilt/blob/main/packages/jest-koa-mocks/src/create-mock-context/create-mock-context.ts

import { URL } from "url";
import stream from "stream";

import httpMocks, { RequestMethod } from "node-mocks-http";
import Koa, { Context } from "koa";

export interface Dictionary<T> {
  [key: string]: T;
}

export interface MockContext extends Context {
  request: Context["request"] & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
    rawBody?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session?: any;
  };
}

export interface Options<
  CustomProperties extends object,
  RequestBody = undefined
> {
  url?: string;
  method?: RequestMethod;
  statusCode?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: Dictionary<any>;
  headers?: Dictionary<string>;
  cookies?: Dictionary<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: Dictionary<any>;
  encrypted?: boolean;
  host?: string;
  requestBody?: RequestBody;
  rawBody?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  throw?: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  redirect?: Function;
  customProperties?: CustomProperties;
}

export const createMockContext = <
  CustomProperties extends object,
  RequestBody = undefined
>(
  options: Options<CustomProperties, RequestBody> = {}
) => {
  const app = new Koa();

  const {
    method,
    statusCode,
    session,
    requestBody,
    rawBody = "",
    url = "",
    host = "test.com",
    encrypted = false,
    throw: throwFn = () => null,
    redirect = () => null,
    headers = {},
    state = {},
    customProperties = {},
  } = options;

  const extensions = {
    ...customProperties,
    throw: throwFn,
    session,
    redirect,
    state,
  };

  const protocolFallback = encrypted ? "https" : "http";
  const urlObject = new URL(url, `${protocolFallback}://${host}`);

  const req = httpMocks.createRequest({
    url: urlObject.toString(),
    method,
    statusCode,
    session,
    headers: {
      // Koa determines protocol based on the `Host` header.
      Host: urlObject.host,
      ...headers,
    },
  });

  // Some functions we call in the implementations will perform checks for `req.encrypted`, which delegates to the socket.
  // MockRequest doesn't set a fake socket itself, so we create one here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req.socket = new stream.Duplex() as any;
  Object.defineProperty(req.socket, "encrypted", {
    writable: false,
    value: urlObject.protocol === "https:",
  });

  const res = httpMocks.createResponse();

  // Koa sets a default status code of 404, not the node default of 200
  // https://github.com/koajs/koa/blob/master/docs/api/response.md#responsestatus
  res.statusCode = 404;

  // This is to get around an odd behavior in the `cookies` library, where if `res.set` is defined, it will use an internal
  // node function to set headers, which results in them being set in the wrong place.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.set = undefined as any;

  const context = app.createContext(req, res) as MockContext & CustomProperties;
  Object.assign(context, extensions);

  // ctx.request.body is a common enough custom property for middleware to add that it's handy to just support it by default
  context.request.body = requestBody;
  context.request.rawBody = rawBody;

  return context as Context;
};
