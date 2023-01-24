import querystring from "querystring";
import { bootstrap } from "./index";
import { Config, StringValueObject, JSONValue, HandleRequestFn } from "./types";
import { createMockContext } from "./createMockContext";

export interface TestHelpers {
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
      const url = new URL(path, "http://localhost");
      url.search = querystring.stringify(query);
      const result = await handleRequest(
        createMockContext({
          method: "GET",
          url: url.toString(),
          headers,
        })
      );
      return JSON.parse(JSON.stringify(result));
    },
    async post(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const url = new URL(path, "http://localhost");
      const result = await handleRequest(
        createMockContext({
          method: "POST",
          url: url.toString(),
          headers,
          rawBody: JSON.stringify(body),
          requestBody: body,
        })
      );
      return JSON.parse(JSON.stringify(result));
    },
    async put(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const url = new URL(path, "http://localhost");
      const result = await handleRequest(
        createMockContext({
          method: "PUT",
          url: url.toString(),
          headers,
          rawBody: JSON.stringify(body),
          requestBody: body,
        })
      );
      return JSON.parse(JSON.stringify(result));
    },
    async patch(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const url = new URL(path, "http://localhost");
      const result = await handleRequest(
        createMockContext({
          method: "PATCH",
          url: url.toString(),
          headers,
          rawBody: JSON.stringify(body),
          requestBody: body,
        })
      );
      return JSON.parse(JSON.stringify(result));
    },
    async delete(
      path: string,
      body: JSONValue = {},
      headers: StringValueObject = {}
    ): Promise<unknown> {
      const url = new URL(path, "http://localhost");
      const result = await handleRequest(
        createMockContext({
          method: "DELETE",
          url: url.toString(),
          headers,
          rawBody: JSON.stringify(body),
          requestBody: body,
        })
      );
      return JSON.parse(JSON.stringify(result));
    },
  };
};
