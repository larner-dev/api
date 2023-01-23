import esbuild from "esbuild";
import { resolve } from "path";
import { readdir } from "fs/promises";

const getFiles = async (dir: string) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
};

export const build = async (srcDir: string): Promise<void> => {
  const entryPoints = (await getFiles(srcDir)).filter(
    (p) => !p.endsWith(".test.ts")
  );
  const filter = /.*/;

  esbuild.build({
    entryPoints,
    bundle: true,
    outdir: "build/esm",
    platform: "node",
    target: "node16",
    format: "esm",
    packages: "external",
    plugins: [
      {
        name: "alias",
        setup(build) {
          build.onResolve({ filter }, (args) => {
            let { path } = args;
            if (args.kind === "import-statement") {
              if (args.path.startsWith(".") && !args.path.endsWith(".js")) {
                path = `${args.path}.js`;
              }
              return {
                path,
                external: true,
              };
            }
          });
        },
      },
    ],
  });
};
