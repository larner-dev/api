import { Options } from "@koa/cors";
import { IncomingHttpHeaders } from "http";
import Koa from "koa";
import { ParsedUrlQuery } from "querystring";
import { HTTPRedirect } from "@larner.dev/http-codes";
import { ReadStream } from "fs";

type JSONPrimitive = string | number | boolean | Date | null;
type JSONObject = { [member: string]: JSONValue };
type JSONArray = Array<JSONValue>;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export interface StringValueObject {
  [key: string]: string;
}

export type ParameterizedContext = Koa.ParameterizedContext;

export type HandleRequestFn = (
  ctx: Koa.ParameterizedContext
) => Promise<RouteHandlerResult>;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface ValidatedConfig {
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

export interface Config
  extends Omit<DeepPartial<ValidatedConfig>, "rootDirectory"> {
  rootDirectory: string;
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type MethodOrAny = Method | "ANY";

export interface Context<B = JSONValue> {
  query: ParsedUrlQuery;
  params: StringValueObject;
  body: B;
  headers: IncomingHttpHeaders;
  rawBody: string;
  method: Method;
}

export type RouteHandlerResult = JSONValue | HTTPRedirect | ReadStream | void;

export type RouteHandler<
  C1 extends Context = Context,
  C2 = Record<string, unknown>
> = (
  context: C1,
  rawContext: Koa.ParameterizedContext & C2
) => Promise<RouteHandlerResult>;

export type MiddlewareHandler<
  C1 extends Context = Context,
  C2 = Record<string, unknown>
> = (context: C1, rawContext: Koa.ParameterizedContext & C2) => Promise<void>;

export type Routes<C1 extends Context, C2> =
  | Record<
      string,
      | RouteHandler<C1, C2>
      | (RouteHandler<C1, C2> | MiddlewareHandler<C1, C2>)[]
    >
  | Record<"middleware", MiddlewareHandler<C1, C2>[]>
  | Record<"prefix", string>
  | Record<"suffix", string>
  | Record<"priority", number>;
