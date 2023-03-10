#!/usr/bin/env node

import { program } from "commander";
import pkg from "../package.json";
import { build } from "./cli/build";

program
  .name("api")
  .description("CLI to help with building your API")
  .version(pkg.version);

program
  .command("build")
  .description("Build typescript files")
  .argument("<srcDir>", "Source directory for your project")
  .option("-w, --watch", "Watch mode: rebuild on file system changes")
  .action(build);
program.showHelpAfterError();

await program.parseAsync();
