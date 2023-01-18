import url from "url";
import Koa from "koa";
import querystring from "querystring";
import { HTTPError, HTTPRedirect } from "@larner.dev/http-codes";
import { Key, pathToRegexp } from "path-to-regexp";
import { IncomingHttpHeaders } from "http";
import { configBuilder } from "./configBuilder";
import {
  BootstrapLAPI,
  ConfigLAPI,
  ContextLAPI,
  JSONValueLAPI,
  MethodLAPI,
  RouteMetadataLAPI,
  StringValueObjectLAPI,
} from "./types";
import { createReadStream } from "fs";
import { extname, join, resolve } from "path";
import { readdir, stat } from "fs/promises";

export const bootstrap = async <T extends ContextLAPI>(
  config: ConfigLAPI
): Promise<BootstrapLAPI> => {
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

  const routes: RouteMetadataLAPI<T>[] = [];
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
      const keys = Object.keys(endpoints).filter(
        (k) => !["middleware", "prefix", "suffix"].includes(k)
      );
      for (const key of keys) {
        const [method, subPattern] = key.split(" ");
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
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
          method: method as MethodLAPI,
          pattern,
          regexp,
          keys,
          fns,
          middleware,
        });
      }
    }
  }

  return {
    async handleRequest(ctx: Koa.ParameterizedContext): Promise<unknown> {
      const method = ctx.request.method as MethodLAPI;
      const requestUrl = ctx.request.url;
      const body = ctx.request.body as JSONValueLAPI;
      const rawBody = ctx.request.rawBody;
      const headers: IncomingHttpHeaders = ctx.request.header;
      const { pathname, query } = url.parse(requestUrl);
      const parsedQuery = querystring.parse(query || "");
      let matchedRoute: RouteMetadataLAPI<T> | null = null;
      let match: RegExpExecArray | null = null;

      for (const route of routes) {
        if (route.method === method.toUpperCase()) {
          match = route.regexp.exec(pathname || "");
          if (match) {
            matchedRoute = route;
            break;
          }
        }
      }
      if (match && matchedRoute) {
        const params: StringValueObjectLAPI = {};
        for (let i = 0; i < matchedRoute.keys.length; i++) {
          params[matchedRoute.keys[i].name] = match[i + 1];
        }
        const context: ContextLAPI = {
          query: parsedQuery,
          params,
          body,
          rawBody,
          headers,
        };
        let result: JSONValueLAPI | HTTPRedirect = null;

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
