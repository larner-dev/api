import { Options } from "@koa/cors";
import { IncomingHttpHeaders, Server } from "http";
import { Key } from "path-to-regexp";
import Koa from "koa";
import { ParsedUrlQuery } from "querystring";

export type LAPIJSONPrimitive = string | number | boolean | null;
export type LAPIJSONValue = LAPIJSONPrimitive | LAPIJSONObject | LAPIJSONArray;
export type LAPIJSONObject = { [member: string]: LAPIJSONValue };
export type LAPIJSONArray = Array<LAPIJSONValue>;

export interface LAPIStringValueObject {
  [key: string]: string;
}

export type LAPIApp = Koa;

type HandleRequestFn = (ctx: Koa.ParameterizedContext) => Promise<unknown>;

export interface LAPIBootstrap {
  config: LAPIValidatedConfig;
  handleRequest: HandleRequestFn;
}

export interface LAPIServer {
  app: Koa<Koa.DefaultState, Koa.DefaultContext>;
  instance: Server;
  config: LAPIValidatedConfig;
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface LAPIValidatedConfig {
  rootDirectory: string;
  routes: {
    globalPrefix?: string;
    directory: string;
    excludeRegex?: string;
  };
  static?: {
    directory: string;
  };
  server: {
    cors?: Options;
    debug?: boolean;
    port: number;
    index: string;
  };
}

export interface LAPIConfig
  extends Omit<DeepPartial<LAPIValidatedConfig>, "rootDirectory"> {
  rootDirectory: string;
}

export type LAPIMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface LAPIRouteMetadata<T extends LAPIContext = LAPIContext> {
  method: LAPIMethod;
  pattern: string;
  keys: Key[];
  regexp: RegExp;
  fns: LAPIRouteHandler<T>[];
  middleware: LAPIRouteHandler<T>[];
}

export interface LAPIContext<B = LAPIJSONValue> {
  query: ParsedUrlQuery;
  params: LAPIStringValueObject;
  body: B;
  headers: IncomingHttpHeaders;
  rawBody: string;
}

export type LAPIRouteHandler<T extends LAPIContext> = (
  context: T,
  rawContext: Koa.ParameterizedContext
) => Promise<LAPIJSONValue>;

export interface LAPIModelMethods {
  [key: string]: () => unknown;
}

export interface LAPITestRequest {
  get: (
    path: string,
    query?: LAPIStringValueObject,
    headers?: LAPIStringValueObject
  ) => Promise<unknown>;
  post: (
    path: string,
    body?: LAPIJSONValue,
    headers?: LAPIStringValueObject
  ) => Promise<unknown>;
  put: (
    path: string,
    body?: LAPIJSONValue,
    headers?: LAPIStringValueObject
  ) => Promise<unknown>;
  patch: (
    path: string,
    body?: LAPIJSONValue,
    headers?: LAPIStringValueObject
  ) => Promise<unknown>;
  delete: (
    path: string,
    body?: LAPIJSONValue,
    headers?: LAPIStringValueObject
  ) => Promise<unknown>;
}

export interface LAPITestHelpers extends LAPITestRequest {
  handleRequest: HandleRequestFn;
}
