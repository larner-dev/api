import * as Koa from "koa";
export {
  HTTPError,
  HTTPRedirect,
  isHTTPError,
  HTTPErrorCode,
} from "@larner.dev/http-codes";
export { server } from "./server";
export { bootstrap } from "./bootstrap";
export {
  Config,
  Context,
  Routes,
  RouteHandler,
  MiddlewareHandler,
  JSONValue,
  ParameterizedContext,
} from "./types";
export { bootstrapTests, TestHelpers } from "./helpers";
import _cors from "@koa/cors";
import _bodyParser from "koa-bodyparser";

export const cors = _cors;
export const bodyParser = _bodyParser;

export type App = Koa;
