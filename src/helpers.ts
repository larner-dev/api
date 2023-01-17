import { ExtendableContext, ParameterizedContext } from "koa";
import querystring from "querystring";
import { bootstrap } from "./index";
import {
  LAPIConfig,
  LAPITestHelpers,
  LAPIStringValueObject,
  LAPIJSONValue,
} from "./types";

export const bootstrapTests = async (
  config: LAPIConfig
): Promise<LAPITestHelpers> => {
  const { handleRequest } = await bootstrap(config);

  return {
    handleRequest,
    async get(
      path: string,
      query: LAPIStringValueObject = {},
      headers: LAPIStringValueObject = {}
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
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
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
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
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
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
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
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
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
