import { ParameterizedContext } from "koa";
import querystring from "querystring";
import { bootstrap } from "./index";
import { Config, StringValueObject, JSONValue, HandleRequestFn } from "./types";

interface TestHelpers {
  get: (
    path: string,
    query?: StringValueObject,
    headers?: StringValueObject
  ) => Promise<unknown>;
  post: (
    path: string,
    body?: JSONValue,
    headers?: StringValueObject
  ) => Promise<unknown>;
  put: (
    path: string,
    body?: JSONValue,
    headers?: StringValueObject
  ) => Promise<unknown>;
  patch: (
    path: string,
    body?: JSONValue,
    headers?: StringValueObject
  ) => Promise<unknown>;
  delete: (
    path: string,
    body?: JSONValue,
    headers?: StringValueObject
  ) => Promise<unknown>;
  handleRequest: HandleRequestFn;
}

export const bootstrapTests = async (config: Config): Promise<TestHelpers> => {
  const { handleRequest } = await bootstrap(config);

  return {
    handleRequest,
    async get(
      path: string,
      query: StringValueObject = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest({
        method: "GET",
        path: `${path}?${querystring.stringify(query)}`,
        body: {},
        rawBody: "",
        headers,
      } as unknown as ParameterizedContext);
      return JSON.parse(JSON.stringify(result));
    },
    async post(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest({
        method: "POST",
        path,
        body,
        rawBody: JSON.stringify(body),
        headers,
      } as unknown as ParameterizedContext);
      return JSON.parse(JSON.stringify(result));
    },
    async put(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest({
        method: "PUT",
        path,
        body,
        rawBody: JSON.stringify(body),
        headers,
      } as unknown as ParameterizedContext);
      return JSON.parse(JSON.stringify(result));
    },
    async patch(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest({
        method: "PATCH",
        path,
        body,
        rawBody: JSON.stringify(body),
        headers,
      } as unknown as ParameterizedContext);
      return JSON.parse(JSON.stringify(result));
    },
    async delete(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest({
        method: "DELETE",
        path,
        body,
        rawBody: JSON.stringify(body),
        headers,
      } as unknown as ParameterizedContext);
      return JSON.parse(JSON.stringify(result));
    },
  };
};
