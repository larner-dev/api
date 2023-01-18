import { Options } from "@koa/cors";
import { IncomingHttpHeaders, Server } from "http";
import { Key } from "path-to-regexp";
import Koa from "koa";
import { ParsedUrlQuery } from "querystring";
import { HTTPRedirect } from "@larner.dev/http-codes";

export type JSONPrimitiveLAPI = string | number | boolean | null;
export type JSONValueLAPI = JSONPrimitiveLAPI | JSONObjectLAPI | JSONArrayLAPI;
export type JSONObjectLAPI = { [member: string]: JSONValueLAPI };
export type JSONArrayLAPI = Array<JSONValueLAPI>;

export interface StringValueObjectLAPI {
  [key: string]: string;
}

export type AppLAPI = Koa;

export type ParameterizedContext = Koa.ParameterizedContext;

type HandleRequestFn = (ctx: Koa.ParameterizedContext) => Promise<unknown>;

export interface BootstrapLAPI {
  config: ValidatedConfigLAPI;
  handleRequest: HandleRequestFn;
}

export interface ServerLAPI {
  app: Koa<Koa.DefaultState, Koa.DefaultContext>;
  instance: Server;
  config: ValidatedConfigLAPI;
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface ValidatedConfigLAPI {
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

export interface ConfigLAPI
  extends Omit<DeepPartial<ValidatedConfigLAPI>, "rootDirectory"> {
  rootDirectory: string;
}

export type MethodLAPI = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RouteMetadataLAPI<T extends ContextLAPI = ContextLAPI> {
  method: MethodLAPI;
  pattern: string;
  keys: Key[];
  regexp: RegExp;
  fns: RouteHandlerLAPI<T>[];
  middleware: RouteHandlerLAPI<T>[];
}

export interface ContextLAPI<B = JSONValueLAPI> {
  query: ParsedUrlQuery;
  params: StringValueObjectLAPI;
  body: B;
  headers: IncomingHttpHeaders;
  rawBody: string;
}

export type RouteHandlerLAPI<C1 extends ContextLAPI, C2 = {}> = (
  context: C1,
  rawContext: Koa.ParameterizedContext & C2
) => Promise<JSONValueLAPI | HTTPRedirect>;

export interface LAPIModelMethods {
  [key: string]: () => unknown;
}

export interface TestRequestLAPI {
  get: (
    path: string,
    query?: StringValueObjectLAPI,
    headers?: StringValueObjectLAPI
  ) => Promise<unknown>;
  post: (
    path: string,
    body?: JSONValueLAPI,
    headers?: StringValueObjectLAPI
  ) => Promise<unknown>;
  put: (
    path: string,
    body?: JSONValueLAPI,
    headers?: StringValueObjectLAPI
  ) => Promise<unknown>;
  patch: (
    path: string,
    body?: JSONValueLAPI,
    headers?: StringValueObjectLAPI
  ) => Promise<unknown>;
  delete: (
    path: string,
    body?: JSONValueLAPI,
    headers?: StringValueObjectLAPI
  ) => Promise<unknown>;
}

export interface TestHelpersLAPI extends TestRequestLAPI {
  handleRequest: HandleRequestFn;
}

export type RoutesLAPI<C1 extends ContextLAPI, C2> =
  | Record<string, RouteHandlerLAPI<C1, C2>>
  | Record<"middleware", RouteHandlerLAPI<C1, C2>[]>
  | Record<"prefix", string>
  | Record<"suffix", string>;
