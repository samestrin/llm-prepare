/**
// utils/stringUtils.js

/**
 * Escapes special characters in a string to safely use it as a regular expression.
 *
 * @param {string} string - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(string) {
  return string.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts wildcard characters in a string to a regex-compatible format.
 *
 * @param {string} pattern - The string pattern containing wildcards.
 * @returns {string} The string with wildcards converted to regular expression wildcards.
 */
function convertWildcard(pattern) {
  return pattern.replace(/\*/g, ".*");
}

module.exports = { escapeRegExp, convertWildcard };
