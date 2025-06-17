/**
 * URL Fetcher module - Handles fetching content from URLs
 */

import axios from 'axios';

/**
 * Fetches content from a URL using axios
 * @param {string} url - The URL to fetch
 * @param {Object} options - Options for the request
 * @return {Promise<string>} The content from the URL
 */
export async function fetchUrl(url, options = {}) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LLMPrepare/1.0)',
        ...options.headers,
      },
      timeout: options.timeout || 10000, // 10 seconds timeout by default
      maxContentLength: options.maxContentLength || 10485760, // 10MB by default
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`HTTP error ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network error: no response received`);
    } else {
      throw new Error(`Error fetching URL: ${error.message}`);
    }
  }
}