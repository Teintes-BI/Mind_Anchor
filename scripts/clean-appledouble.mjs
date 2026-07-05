#!/usr/bin/env node
import { resolve } from "node:path";
import { deleteAppleDoubleFiles } from "./lib/appledouble-cleanup.mjs";

const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const rootArgIndex = args.indexOf("--root");
const rootDir = rootArgIndex >= 0 && args[rootArgIndex + 1] ? resolve(args[rootArgIndex + 1]) : process.cwd();

const removedCount = await deleteAppleDoubleFiles(rootDir);

if (!quiet) {
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} AppleDouble sidecar file(s) under ${rootDir}.`);
  } else {
    console.log(`No AppleDouble sidecar files found under ${rootDir}.`);
  }
}
