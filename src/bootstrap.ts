import url from "url";
import querystring from "querystring";
import { HTTPError } from "@larner.dev/http-codes";
import { Key, pathToRegexp } from "path-to-regexp";
import { IncomingHttpHeaders } from "http";
import { configBuilder } from "./configBuilder";
import {
  Config,
  Context,
  HandleRequestFn,
  JSONValue,
  Method,
  MethodOrAny,
  RouteHandler,
  RouteHandlerResult,
  StringValueObject,
  ValidatedConfig,
} from "./types";
import { createReadStream } from "fs";
import { extname, join, resolve } from "path";
import { readdir, stat } from "fs/promises";

interface Bootstrap {
  config: ValidatedConfig;
  handleRequest: HandleRequestFn;
}

interface RouteMetadata<T extends Context = Context> {
  method: MethodOrAny;
  pattern: string;
  keys: Key[];
  regexp: RegExp;
  fns: RouteHandler<T>[];
  middleware: RouteHandler<T>[];
  priority?: number;
}

export const bootstrap = async <T extends Context>(
  config: Config
): Promise<Bootstrap> => {
  // Validate config and fix paths
  const validatedConfig = configBuilder(config);

  // Load all routes
  let routePaths: string[] = [];
  try {
    routePaths = await readdir(validatedConfig.routes.directory);
  } catch (error) {
    if ((error as Record<string, unknown>).code === "ENOENT") {
      throw new Error(
        `The routes directory does not exist: "${validatedConfig.routes.directory}"`
      );
    }
    throw error;
  }
  if (validatedConfig.routes.excludeRegex) {
    const excludeRegex = new RegExp(validatedConfig.routes.excludeRegex);
    routePaths = routePaths.filter((path) => {
      return !path.match(excludeRegex);
    });
  }

  const routes: RouteMetadata<T>[] = [];
  for (const routePath of routePaths) {
    if (routePath.match("^.+.m?[jt]s")) {
      const route = routePath.substring(
        0,
        routePath.length - extname(routePath).length
      );
      let endpoints = await import(
        resolve(validatedConfig.routes.directory, routePath)
      );
      // If the route uses export we need to pull default property from it
      if (endpoints.default) {
        endpoints = endpoints.default;
      }
      const middleware = endpoints.middleware || [];
      const endpointsPrefix = endpoints.prefix || "";
      const endpointsSuffix = endpoints.suffix || "";
      const priority = endpoints.priority;
      const keys = Object.keys(endpoints).filter(
        (k) => !["middleware", "prefix", "suffix", "priority"].includes(k)
      );
      for (const key of keys) {
        const [method, subPattern] = key.split(" ");
        if (
          !["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"].includes(method)
        ) {
          throw new Error(
            `Endpoint "${key}" in route "${routePath}" does not start with a valid request type (GET, POST, PUT, PATCH or DELETE)`
          );
        }
        let prefix = join(endpointsPrefix, route, endpointsSuffix);
        let suffix = subPattern;
        if (prefix === validatedConfig.server.index) {
          prefix = "";
        }
        if (suffix.startsWith("/")) {
          suffix = suffix.substring(1);
        }
        const pieces = [prefix, suffix];
        if (validatedConfig.routes.globalPrefix) {
          let { globalPrefix } = validatedConfig.routes;
          if (globalPrefix.startsWith("/")) {
            globalPrefix = globalPrefix.substring(1);
          }
          pieces.unshift(globalPrefix);
        }
        const pattern = "/" + pieces.filter((v) => v).join("/");
        const keys: Key[] = [];
        const regexp = pathToRegexp(pattern, keys);
        const fns = Array.isArray(endpoints[key])
          ? endpoints[key]
          : [endpoints[key]];
        routes.push({
          method: method as MethodOrAny,
          pattern,
          regexp,
          keys,
          fns,
          middleware,
          priority,
        });
      }
      routes.sort((a, b) => {
        if (a.priority === b.priority) {
          return 0;
        }
        if (a.priority === undefined) {
          return 1;
        }
        if (b.priority === undefined) {
          return -1;
        }
        return a.priority < b.priority ? -1 : 1;
      });
    }
  }

  return {
    async handleRequest(ctx) {
      const method = ctx.request.method as Method;
      const requestUrl = ctx.request.url;
      const body = ctx.request.body as JSONValue;
      const rawBody = ctx.request.rawBody;
      const headers: IncomingHttpHeaders = ctx.request.header;
      const { pathname, query } = url.parse(requestUrl);
      const parsedQuery = querystring.parse(query || "");
      let matchedRoute: RouteMetadata<T> | null = null;
      let match: RegExpExecArray | null = null;

      for (const route of routes) {
        if (route.method === "ANY" || route.method === method.toUpperCase()) {
          match = route.regexp.exec(pathname || "");
          if (match) {
            matchedRoute = route;
            break;
          }
        }
      }
      if (match && matchedRoute) {
        const params: StringValueObject = {};
        for (let i = 0; i < matchedRoute.keys.length; i++) {
          params[matchedRoute.keys[i].name] = match[i + 1];
        }
        const context: Context = {
          query: parsedQuery,
          params,
          body,
          rawBody,
          headers,
          method,
        };
        let result: RouteHandlerResult = null;

        for (const fn of matchedRoute.middleware) {
          result = await fn(context as T, ctx);
        }
        for (const fn of matchedRoute.fns) {
          result = await fn(context as T, ctx);
        }
        return result;
      } else {
        if (validatedConfig.static && validatedConfig.static.directory) {
          try {
            let p = resolve(validatedConfig.static.directory, pathname || "");
            let statResult = await stat(p);
            if (!statResult.isDirectory()) {
              return createReadStream(p);
            } else {
              p = resolve(p, "index.html");
              statResult = await stat(p);
              return createReadStream(p);
            }
          } catch (error) {
            if (
              error &&
              (error as Record<string, unknown>).code &&
              !["ENOENT"].includes((error as Record<string, string>).code)
            ) {
              throw error;
            }
          }
        }
        throw new HTTPError.NotFound("NOT_FOUND");
      }
    },
    config: validatedConfig,
  };
};
