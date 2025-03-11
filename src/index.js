const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("../package.json");
const { handleError } = require("./utils/errorHandler");
const { showDefaultIgnore } = require("./utils/ignoreUtils");
const { loadConfigFile, mergeArguments } = require("./utils/configUtils");
const { processPath } = require("./utils/pathUtils"); // New import for handling paths
const { writeAllOutputs } = require("./utils/outputUtils"); // Ensure writeAllOutputs is properly imported
const { convertWildcard, escapeRegExp } = require("./utils/stringUtils");
const yargsBuilder = yargs(hideBin(process.argv));

if (
  !process.argv.includes("--show-default-ignore") &&
  !process.argv.includes("--show-prompts")
) {
  yargsBuilder
    .option("config", {
      describe: "Path to the config file",
      type: "string",
      demandOption: false,
    })
    .option("path", {
      alias: "p",
      describe: "Path to the project directory",
      type: "string",
      demandOption: false,
    })
    .option("file-pattern", {
      alias: "f",
      describe:
        "Pattern of files to include, e.g., '\\.js$' or '*' for all files",
      type: "string",
      default: "*",
    });
}

yargsBuilder
  .option("output-filename", {
    alias: "o",
    describe: "Output filename",
    type: "string",
    demandOption: false,
  })
  // Add new comment-style option
  .option("comment-style", {
    describe: "Override the comment style for file headers (e.g., 'python', 'java', 'html')",
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

async function main(argv) {
  let config = {};

  // Load and merge config file if --config option is provided
  if (argv.config) {
    config = await loadConfigFile(argv.config);
    argv = mergeArguments(argv, config.args);
  }

  // make sure compress is included
  if (!argv.compress && argv.c) {
    argv.compress = argv.c;
  }

  // Check if path is provided or fallback to include array
  let pathsToProcess = [];
  if (argv.path) {
    pathsToProcess.push(argv.path);
  } else if (config.include && config.include.length > 0) {
    pathsToProcess = config.include;
  } else {
    handleError(
      new Error("Either a path or an include array must be provided.")
    );
    return;
  }

  let layout = "";
  let layoutIncluded = false;
  let accumulatedOutput = []; // New array to accumulate all outputs

  if ("show-default-ignore" in argv) {
    await showDefaultIgnore(argv);
    return;
  } else if ("show-prompts" in argv) {
    const open = (await import("open")).default;
    await open(
      "https://github.com/samestrin/llm-prepare/tree/main/example-prompts"
    );
    return;
  }

  const filePattern = new RegExp(
    convertWildcard(escapeRegExp(argv["file-pattern"]))
  );

  for (const pathToProcess of pathsToProcess) {
    await processPath(
      pathToProcess,
      argv,
      layout,
      layoutIncluded,
      config.include || [],
      filePattern,
      accumulatedOutput
    );
  }

  // After all paths are processed, write the accumulated output
  await writeAllOutputs(accumulatedOutput, layout, layoutIncluded, argv);
}

main(argv).catch(handleError);
