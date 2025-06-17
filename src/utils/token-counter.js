/**
 * Token Counter module - Estimates token counts for LLM input
 * 
 * Note: This is a rough estimation since exact tokenization varies by model.
 * Most LLMs use tokenizers based on byte-pair encoding or similar algorithms.
 * This provides a simple approximation.
 */

/**
 * Estimates the number of tokens in a text string
 * This is a rough approximation based on common tokenization patterns
 * 
 * @param {string} text - The text to estimate tokens for
 * @return {number} Estimated token count
 */
export function estimateTokenCount(text) {
    if (!text) return 0;
    
    // Simple approximation: average English words are ~1.3 tokens
    // Numbers, punctuation, and special characters affect this ratio
    
    // Count words (sequences of alphanumeric chars)
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count punctuation and special characters (they often become separate tokens)
    const punctuationCount = (text.match(/[^\w\s]/g) || []).length;
    
    // Count numbers (digits often tokenize differently than letters)
    const numberCount = (text.match(/\d+/g) || []).length;
    
    // Apply the approximation formula
    const estimatedTokens = Math.ceil(wordCount * 1.3) + punctuationCount * 0.5 + numberCount * 0.5;
    
    return Math.max(1, Math.round(estimatedTokens));
  }
  
  /**
   * Analyzes token distribution in text to help with truncation decisions
   * @param {string} text - Text to analyze
   * @return {Object} Analysis results with token density per region
   */
  export function analyzeTokenDistribution(text) {
    if (!text) {
      return {
        total: 0,
        sections: []
      };
    }
    
    // Divide text into sections
    const lines = text.split('\n');
    const totalLines = lines.length;
    const sectionSize = Math.max(1, Math.ceil(totalLines / 5)); // Up to 5 sections
    
    const sections = [];
    let currentSection = '';
    let sectionNumber = 0;
    
    // Group lines into sections
    for (let i = 0; i < lines.length; i++) {
      currentSection += lines[i] + '\n';
      
      // When we reach section boundary, analyze it
      if ((i + 1) % sectionSize === 0 || i === lines.length - 1) {
        const tokens = estimateTokenCount(currentSection);
        sections.push({
          section: sectionNumber++,
          lines: currentSection.split('\n').length,
          chars: currentSection.length,
          tokens: tokens,
          density: tokens / currentSection.length
        });
        
        currentSection = '';
      }
    }
    
    // Calculate total token count
    const totalTokens = sections.reduce((sum, section) => sum + section.tokens, 0);
    
    return {
      total: totalTokens,
      sections: sections
    };
  }