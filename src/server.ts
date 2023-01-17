import Koa from "koa";

import { HTTPRedirect } from "@larner.dev/http-codes";
import { LAPIApp, LAPIConfig, LAPIContext, LAPIServer } from "./types";
import { bootstrap } from "./bootstrap";
import { ReadStream } from "fs";
import { contentType } from "mime-types";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { basename } from "path";

export const server = async <T extends LAPIContext = LAPIContext>(
  config: LAPIConfig,
  injectMiddleware?: (app: LAPIApp) => void
): Promise<LAPIServer> => {
  const { handleRequest, config: validatedConfig } = await bootstrap<T>(config);

  // Start the server
  const app = new Koa();
  app.use(bodyParser({ enableTypes: ["json"] }));
  if (validatedConfig.server.cors) {
    app.use(cors(validatedConfig.server.cors));
  }
  if (injectMiddleware) {
    injectMiddleware(app);
  }
  app.use(async (ctx) => {
    try {
      const result = await handleRequest(ctx);
      if (result instanceof HTTPRedirect) {
        ctx.status = result.status;
        ctx.redirect(result.location);
      } else if (result instanceof ReadStream) {
        ctx.type = contentType(basename(result.path.toString())) || "";
        ctx.body = result;
      } else {
        ctx.body = result;
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "isHTTPError" in error &&
        "status" in error &&
        typeof error.status === "number" &&
        "message" in error &&
        error.isHTTPError
      ) {
        ctx.response.status = error.status;
        ctx.body = { code: error.message };
      } else {
        if (validatedConfig.server.debug) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        ctx.response.status = 500;
        ctx.body = { code: "INTERNAL_SERVER_ERROR" };
      }
    }
  });
  const instance = app.listen(validatedConfig.server.port);
  return { app, instance, config: validatedConfig };
};
