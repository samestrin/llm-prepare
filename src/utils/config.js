const fs = require("fs-extra");
const { handleError } = require("./errorHandler");

/**
 * Loads the configuration file and parses it as JSON.
 * @param {string} filepath - Path to the config file.
 * @returns {object} Parsed JSON content of the config file.
 */
async function loadConfigFile(filepath) {
  try {
    const content = await fs.readFile(filepath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    handleError(
      new Error(`Failed to load or parse config file: ${error.message}`)
    );
    throw error; // Rethrow the error after logging it
  }
}

/**
 * Merges the command-line arguments with the ones from the config file.
 * Command-line arguments take precedence over config file arguments.
 * @param {object} cliArgs - Arguments passed via the command line.
 * @param {object} configArgs - Arguments defined in the config file.
 * @returns {object} Merged arguments object.
 */
function mergeArguments(cliArgs, configArgs) {
  return { ...configArgs, ...cliArgs };
}

module.exports = { loadConfigFile, mergeArguments };
