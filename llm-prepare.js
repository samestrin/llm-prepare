#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const ignore = require("ignore");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Set up command line arguments
const argv = yargs(hideBin(process.argv))
  .option("path-name", {
    alias: "p",
    describe: "Path to the project directory",
    type: "string",
    demandOption: true,
  })
  .option("file-pattern", {
    alias: "f",
    describe:
      "Pattern of files to include, e.g., '\\.js$' or '*' for all files",
    type: "string",
    demandOption: true,
  })
  .option("compress", {
    alias: "c",
    describe: "Should we compress the output?",
    type: "boolean",
    demandOption: false,
  }).argv;
console.log(argv);
// Store the file pattern in a variable early in the script
const filePattern = argv.files;
const compress = argv.compress;

// Variables to hold content and layout
let singleFileOutput = "";
let layout = "";

async function readIgnoreFiles(dir) {
  const ig = ignore();
  ig.add(".git"); // Ignore .git folder
  ig.add(".gitignore"); // Ignore .gitignore file
  try {
    const files = await fs.readdir(dir);
    const ignoreFiles = files.filter((file) => file.endsWith(".ignore"));

    await Promise.all(
      ignoreFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        ig.add(content);
      })
    );
  } catch (error) {
    console.error("Error reading ignore files: ", error);
  }
  return ig;
}

async function processDirectory(dir, baseDir = dir, ig) {
  try {
    const entries = await fs.readdir(dir);
    const notIgnoredEntries = ig.filter(entries);
    console.log(
      `Processing directory: ${dir}, entries found: ${notIgnoredEntries.join(
        ", "
      )}`
    ); // Debug log

    for (const entry of notIgnoredEntries) {
      const entryPath = path.join(dir, entry);
      const stats = await fs.stat(entryPath);
      if (stats.isDirectory()) {
        layout +=
          "│   ".repeat(
            dir.split(path.sep).length - baseDir.split(path.sep).length
          ) +
          "├── " +
          entry +
          "/\n";
        await processDirectory(entryPath, baseDir, ig);
      } else if (stats.isFile()) {
        console.log(`Checking file: ${entry} against pattern: ${filePattern}`); // Debug log
        let pattern = filePattern === "*" ? ".*" : filePattern; // Convert '*' to a regex that matches any string
        if (entry.match(new RegExp(pattern))) {
          layout +=
            "│   ".repeat(
              dir.split(path.sep).length - baseDir.split(path.sep).length
            ) +
            "└── " +
            entry +
            "\n";
          let content = await fs.readFile(entryPath, "utf8");
          content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""); // Remove comments
          content = content.replace(/[ \t]+/g, " "); // Normalize spaces and tabs to single space

          if (compress) {
            content = content.replace(/\s+/g, " ").trim(); // Normalize whitespace
          } else {
            content = content.replace(/(?:\r\n|\r|\n){2,}/g, "\n"); // Condense multiple newlines to a single newline}
          }
          singleFileOutput +=
            `// File: ${path.relative(baseDir, entryPath)}\n` + content + "\n";
        }
      }
    }
  } catch (error) {
    console.error("Error processing directory: ", error);
  }
}

async function main() {
  try {
    const ig = await readIgnoreFiles(argv["path-name"]);
    layout += "/" + path.basename(argv["path-name"]) + "\n";
    await processDirectory(argv["path-name"], argv["path-name"], ig);
    singleFileOutput = layout + "\n" + singleFileOutput;
    console.log(singleFileOutput);
  } catch (error) {
    console.error("Error during main execution: ", error);
  }
}

main().catch(console.error);
