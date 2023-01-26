import path from "path";
import { server } from "./server";
import { describe, test, expect } from "vitest";

describe("server", () => {
  test("it should return a new Koa server", async () => {
    const s = await server({
      rootDirectory: path.join(__dirname, "__fixtures__"),
      routes: { directory: "./routes" },
      server: {
        port: 5544,
      },
    });
    expect("instance" in s).toEqual(true);
    expect("app" in s).toEqual(true);
    s.instance.close();
  });
});
