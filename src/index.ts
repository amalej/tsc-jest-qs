#!/usr/bin/env node

import { execSync } from "child_process";
import chalk from "chalk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join as pathJoin } from "path";

const cwd = process.cwd();
console.log(chalk.green(`[ok] Setup npm package in "${cwd}"`));
console.log(
  chalk.yellow(`[warning] Test script will be overwritten with \`jest\``)
);

execSync("npm init", { stdio: "inherit" });
// Hack: using stdio: "inherit" causes `execSync` to always return null
// Workaround is to check if `package.json` was created before proceeding
const packageJsonFile = pathJoin(cwd, "package.json");
const packageJsonExists = existsSync(packageJsonFile);
if (!packageJsonExists) {
  console.log(chalk.green("[ok] Canceled creation"));
  process.exit(0);
}

// Create the `tsconfig.json` file
console.log(chalk.blue("[info] Creating `tsconfig.json`"));
execSync("npx tsc --init", { stdio: "inherit" });
console.log(chalk.blue("[info] Modifying `tsconfig.json`"));
const tsconfigFile = pathJoin(cwd, "tsconfig.json");
let tsconfig: any = readFileSync(tsconfigFile, "utf-8");
tsconfig = JSON.parse(
  tsconfig.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
    (m: string, g: string) => (g ? "" : m)
  )
);
tsconfig["compilerOptions"]["outDir"] = "lib";
tsconfig["include"] = ["src"];
tsconfig["exclude"] = [];
writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 2));

// Create a `src` folder and `index.ts` file
console.log(chalk.blue("[info] Creating `index.ts` file"));
const indexTs = `console.log("Hello World");`;
const srcDir = pathJoin(cwd, "src");
const indexFile = pathJoin(srcDir, "index.ts");
mkdirSync(srcDir);
writeFileSync(indexFile, indexTs);

// Install dependencies
console.log(chalk.blue("[info] Installing dependencies"));
execSync("npm i --save-dev typescript", { stdio: "inherit" });
execSync("npm i --save-dev jest", { stdio: "inherit" });
execSync("npm i --save-dev @types/jest", { stdio: "inherit" });

// Create test folder and example test file
console.log(chalk.blue("[info] Creating sample test"));
const sampleTest = `describe("Test simple math operations", () => {
  it("should add 1 and 2 to equal 3", () => {
    expect(1 + 2).toEqual(3);
  });

  it("should multiply 2 and 3 to equal 6", () => {
    expect(2 * 3).toEqual(6);
  });
});
`;
const testDir = pathJoin(cwd, "test");
const testFile = pathJoin(testDir, "sample.test.ts");
mkdirSync(testDir);
writeFileSync(testFile, sampleTest);

// Modify the `package.json` file
console.log(chalk.blue("[info] Modifying `package.json`"));
let packageJson: any = readFileSync(packageJsonFile, "utf-8");
packageJson = JSON.parse(
  packageJson.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
    (m: string, g: string) => (g ? "" : m)
  )
);
packageJson["main"] = "lib/index.js";
packageJson["scripts"] = {
  build: "tsc",
  "build:watch": "tsc --watch",
  test: "jest",
};
writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2));

console.log(chalk.green("[ok] Completed!"));
