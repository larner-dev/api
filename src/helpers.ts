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
      const result = await handleRequest(
        "GET",
        `${path}?${querystring.stringify(query)}`,
        {},
        "",
        headers
      );
      return JSON.parse(JSON.stringify(result));
    },
    async post(
      path: string,
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest(
        "POST",
        path,
        body,
        JSON.stringify(body),
        headers
      );
      return JSON.parse(JSON.stringify(result));
    },
    async put(
      path: string,
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest(
        "PUT",
        path,
        body,
        JSON.stringify(body),
        headers
      );
      return JSON.parse(JSON.stringify(result));
    },
    async patch(
      path: string,
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest(
        "PATCH",
        path,
        body,
        JSON.stringify(body),
        headers
      );
      return JSON.parse(JSON.stringify(result));
    },
    async delete(
      path: string,
      body: LAPIJSONValue = {},
      headers: LAPIStringValueObject = {}
    ): Promise<unknown> {
      const result = await handleRequest(
        "DELETE",
        path,
        body,
        JSON.stringify(body),
        headers
      );
      return JSON.parse(JSON.stringify(result));
    },
  };
};
