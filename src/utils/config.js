import fs from 'fs/promises';

/**
 * Loads the configuration file and parses it as JSON.
 * @param {string} filepath - Path to the config file.
 * @returns {object} Parsed JSON content of the config file.
 * @throws {Error} If the file cannot be read or parsed.
 */
export async function loadConfigFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    const message = `Failed to load or parse config file: ${error.message}`;
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Merges the command-line arguments with the ones from the config file.
 * Command-line arguments take precedence over config file arguments.
 * @param {object} cliArgs - Arguments passed via the command line.
 * @param {object} configArgs - Arguments defined in the config file.
 * @returns {object} Merged arguments object.
 */
export function mergeArguments(cliArgs, configArgs) {
  // Start with an empty object
  const mergedArgs = {};
  
  // Process the args property from the config file if it exists
  if (configArgs && configArgs.args) {
    Object.assign(mergedArgs, configArgs.args);
  }
  
  // Preserve the include array from the config file if it exists
  if (configArgs && Array.isArray(configArgs.include)) {
    mergedArgs.include = [...configArgs.include];
  }
  
  // CLI arguments take precedence, only override non-undefined values
  for (const [key, value] of Object.entries(cliArgs)) {
    if (value !== undefined) {
      mergedArgs[key] = value;
    }
  }
  
  return mergedArgs;
}
