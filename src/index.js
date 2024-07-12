const fs = require("fs-extra");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("../package.json");
const { handleError } = require("./utils/errorHandler");
const { readIgnoreFiles, showDefaultIgnore } = require("./utils/ignoreUtils");
const { writeAllOutputs } = require("./utils/outputUtils");
const { escapeRegExp, convertWildcard } = require("./utils/stringUtils");
const { processDirectory } = require("./utils/processDirectory");

const yargsBuilder = yargs(hideBin(process.argv));

if (
  !process.argv.includes("--show-default-ignore") &&
  !process.argv.includes("--show-prompts")
) {
  yargsBuilder
    .option("path", {
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
      default: "*", // Set default value to "*"
    });
}
yargsBuilder
  .option("output-filename", {
    alias: "o",
    describe: "Output filename",
    type: "string",
    demandOption: false,
  })
  .option("include-comments", {
    describe: "Include comments? (Default: false)",
    type: "boolean",
    demandOption: false,
    alias: "i",
  })
  .option("compress", {
    alias: "c",
    describe: "Compress? (Default: false)",
    type: "boolean",
    demandOption: false,
  })
  .option("chunk-size", {
    describe: "Maximum size (in kilobytes) of each file",
    type: "number",
    demandOption: false,
  })
  .option("suppress-layout", {
    alias: "s",
    describe: "Suppress layout in output (Default: false)",
    type: "boolean",
    demandOption: false,
  })
  .option("default-ignore", {
    describe: "Use a custom default ignore file",
    type: "string",
    demandOption: false,
  })
  .option("ignore-gitignore", {
    describe: "Ignore .gitignore file in the root of the project directory",
    type: "boolean",
    demandOption: false,
  })
  .option("show-default-ignore", {
    describe: "Show default ignore file",
    type: "boolean",
    demandOption: false,
  })
  .option("show-prompts", {
    describe: "Show example prompts in your browser",
    type: "boolean",
    demandOption: false,
  })
  .option("custom-ignore-string", {
    describe: "Comma-separated list of ignore patterns",
    type: "string",
    demandOption: false,
  })
  .option("custom-ignore-filename", {
    describe: "Path to a file containing ignore patterns",
    type: "string",
    demandOption: false,
  })
  .version("v", "Display the version number", packageJson.version)
  .alias("v", "version").argv;

const argv = yargsBuilder.argv;

main(argv).catch(handleError);

async function main(argv) {
  let layout = "";
  let layoutIncluded = false;

  if ("show-default-ignore" in argv) {
    await showDefaultIgnore(argv);
    return;
  } else if ("show-prompts" in argv) {
    const open = (await import("open")).default;
    await open(
      "https://github.com/samestrin/llm-prepare/blob/main/example-prompts/README.md",
    );
    return;
  }

  const filePattern = new RegExp(
    convertWildcard(escapeRegExp(argv["file-pattern"])),
  );

  const ig = await readIgnoreFiles(argv["path"], argv["default-ignore"], argv);
  const {
    layout: updatedLayout,
    singleFileOutput,
    layoutIncluded: layoutAlreadyIncluded,
  } = await processDirectory(
    argv["path"],
    argv["path"],
    ig,
    0,
    [],
    filePattern,
    layout,
    argv,
  );

  layout = updatedLayout;
  layoutIncluded = layoutAlreadyIncluded;

  await writeAllOutputs(singleFileOutput, layout, layoutIncluded, argv);
}
