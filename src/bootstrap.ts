import url from "url";
import querystring from "querystring";
import { HTTPError } from "@larner.dev/perk-response-codes";
import { Key, pathToRegexp } from "path-to-regexp";
import { IncomingHttpHeaders } from "http";
import { configBuilder } from "./configBuilder";
import {
  LAPIBootstrap,
  LAPIConfig,
  LAPIContext,
  LAPIJSONValue,
  LAPIMethod,
  LAPIRouteMetadata,
  LAPIStringValueObject,
} from "./types";
import { createReadStream } from "fs";
import { extname, resolve } from "path";
import { readdir, stat } from "fs/promises";

export const bootstrap = async <T extends LAPIContext>(
  config: LAPIConfig
): Promise<LAPIBootstrap> => {
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

  const routes: LAPIRouteMetadata<T>[] = [];
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
      const keys = Object.keys(endpoints).filter((k) => k !== "middleware");
      for (const key of keys) {
        const [method, subPattern] = key.split(" ");
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          throw new Error(
            `Endpoint "${key}" in route "${routePath}" does not start with a valid request type (GET, POST, PUT, PATCH or DELETE)`
          );
        }
        let prefix = route;
        let suffix = subPattern;
        if (prefix === validatedConfig.server.index) {
          prefix = "";
        }
        if (suffix.startsWith("/")) {
          suffix = suffix.substring(1);
        }
        const pattern = "/" + [prefix, suffix].filter((v) => v).join("/");
        const keys: Key[] = [];
        const regexp = pathToRegexp(pattern, keys);
        const fns = Array.isArray(endpoints[key])
          ? endpoints[key]
          : [endpoints[key]];
        routes.push({
          method: method as LAPIMethod,
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
    async handleRequest(
      method: LAPIMethod,
      requestUrl: string,
      body: LAPIJSONValue,
      rawBody: string,
      headers: IncomingHttpHeaders
    ): Promise<unknown> {
      const { pathname, query } = url.parse(requestUrl);
      const parsedQuery = querystring.parse(query || "");
      let matchedRoute: LAPIRouteMetadata<T> | null = null;
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
        const params: LAPIStringValueObject = {};
        for (let i = 0; i < matchedRoute.keys.length; i++) {
          params[matchedRoute.keys[i].name] = match[i + 1];
        }
        const context: LAPIContext = {
          query: parsedQuery,
          params,
          body,
          rawBody,
          headers,
        };
        let result: LAPIJSONValue = null;

        for (const fn of matchedRoute.middleware) {
          result = await fn(context as T);
        }
        for (const fn of matchedRoute.fns) {
          result = await fn(context as T);
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
