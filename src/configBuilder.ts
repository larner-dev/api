import { LAPIConfig, LAPIValidatedConfig } from "./types";
import path from "path";

export const configBuilder = (config: LAPIConfig): LAPIValidatedConfig => {
  const finalConfig = <LAPIValidatedConfig>{ ...config };

  // Set defaults
  if (!finalConfig.routes) {
    finalConfig.routes = {
      directory: "./routes",
    };
  }
  if (!finalConfig.routes.directory) {
    finalConfig.routes.directory = "./routes";
  }

  if (!finalConfig.server) {
    finalConfig.server = {
      port: 4444,
      index: "index",
    };
  }

  if (!finalConfig.server.port) {
    finalConfig.server.port = 4444;
  }

  if (!finalConfig.server.index) {
    finalConfig.server.index = "index";
  }

  if (finalConfig.static && !finalConfig.static.directory) {
    finalConfig.static.directory = "static";
  }

  // Standardize paths
  if (!path.isAbsolute(finalConfig.routes.directory)) {
    finalConfig.routes.directory = path.join(
      finalConfig.rootDirectory,
      finalConfig.routes.directory
    );
  }

  if (
    finalConfig.static &&
    finalConfig.static.directory &&
    !path.isAbsolute(finalConfig.static.directory)
  ) {
    finalConfig.static.directory = path.join(
      finalConfig.rootDirectory,
      finalConfig.static.directory
    );
  }

  return finalConfig;
};
