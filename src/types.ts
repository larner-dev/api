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
    errorHandler?: (error: unknown) => void;
  };
}

export interface Config
  extends Omit<DeepPartial<ValidatedConfig>, "rootDirectory"> {
  rootDirectory: string;
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type MethodOrAny = Method | "ANY";

type PlainObject = { [key: string]: unknown };

export interface Context<
  B = JSONValue,
  K extends PlainObject = Record<string, unknown>
> {
  query: ParsedUrlQuery;
  params: StringValueObject;
  body: B;
  headers: IncomingHttpHeaders;
  rawBody: string;
  method: Method;
  ip: string;
  ips: string[];
  koaCtx: () => ParameterizedContext & K;
}

export type RouteHandlerResult = JSONValue | HTTPRedirect | ReadStream | void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteHandler = (context: any) => Promise<RouteHandlerResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MiddlewareHandler = (context: any) => Promise<void>;

export type Routes =
  | {
      middleware?: MiddlewareHandler[];
      prefix?: string;
      suffix?: string;
      priority?: number;
    }
  | {
      [key: string]: RouteHandler | (RouteHandler | MiddlewareHandler)[];
    };
