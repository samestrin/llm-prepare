import { jest } from '@jest/globals';
import { truncateText } from '../../src/processors/truncate.js';
import { estimateTokenCount } from '../../src/utils/token-counter.js';

// Mock the token counter module to have predictable behavior during tests
jest.mock('../../src/utils/token-counter.js', () => ({
  estimateTokenCount: jest.fn(text => {
    // Simple mock implementation that returns roughly 1 token per word
    // This helps make tests deterministic
    if (!text) return 0;
    return text.split(/\s+/).length;
  })
}));

describe('Truncation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to generate test text with a specific token count
  const generateTestText = (tokenCount) => {
    return Array(tokenCount).fill('word').join(' ');
  };

  describe('Basic truncation functionality', () => {
    test('should return unchanged text if already under token limit', () => {
      const text = 'This is a short text.';
      estimateTokenCount.mockReturnValueOnce(5);
      
      const result = truncateText(text, 10);
      
      expect(result).toBe(text);
      expect(estimateTokenCount).toHaveBeenCalledWith(text);
    });

    test('should return empty string if input is empty', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    test('should return null if input is null', () => {
      const result = truncateText(null, 10);
      expect(result).toBe(null);
    });

    test('should return undefined if input is undefined', () => {
      const result = truncateText(undefined, 10);
      expect(result).toBe(undefined);
    });

    test('should throw error for invalid truncation strategy', () => {
      const text = 'Some test text';
      expect(() => truncateText(text, 5, 'invalid-strategy')).toThrow(
        'Invalid truncation strategy: invalid-strategy. Must be \'start\', \'end\', or \'middle\''
      );
    });
  });

  // Scenario: `-m <number>` with `-t end`: Truncate text to max tokens from the end
  describe('End truncation strategy', () => {
    test('should truncate text from the end', () => {
      const text = 'First part of text.\nSecond part of text.\nThird part of text.';
      estimateTokenCount.mockReturnValueOnce(12); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(4);  // First line tokens
      estimateTokenCount.mockReturnValueOnce(4);  // Second line tokens
      
      const result = truncateText(text, 10, 'end');
      
      expect(result).toContain('First part of text.');
      expect(result).toContain('Second part of text.');
      expect(result).not.toContain('Third part of text.');
      expect(result).toContain('[...Content truncated from end...]');
    });

    test('should include truncation indicator in token count calculation', () => {
      const longText = generateTestText(20);
      estimateTokenCount.mockReturnValueOnce(20); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      
      // Simulate each word being 1 token in the mock
      const wordMock = jest.fn().mockImplementation((text) => 1);
      for (let i = 0; i < 20; i++) {
        estimateTokenCount.mockReturnValueOnce(wordMock());
      }
      
      const result = truncateText(longText, 10, 'end');
      
      // Should have truncation indicator
      expect(result).toContain('[...Content truncated from end...]');
      
      // Should preserve approximately 7 tokens worth of content (10 - 3 for indicator)
      const contentTokenCount = estimateTokenCount(result) - 3; // Subtract indicator tokens
      expect(contentTokenCount).toBeLessThanOrEqual(7);
    });

    test('should use end truncation as default strategy', () => {
      const text = 'First part.\nSecond part.\nThird part.';
      estimateTokenCount.mockReturnValueOnce(6); // Total token count
      estimateTokenCount.mockReturnValueOnce(3); // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(2); // First line tokens
      
      const result = truncateText(text, 5); // No strategy specified, should default to 'end'
      
      expect(result).toContain('First part.');
      expect(result).not.toContain('Third part.');
      expect(result).toContain('[...Content truncated from end...]');
    });
  });

  // Scenario: `-m <number>` with `-t start`: Truncate text to max tokens from the start
  describe('Start truncation strategy', () => {
    test('should truncate text from the start', () => {
      const text = 'First part of text.\nSecond part of text.\nThird part of text.';
      estimateTokenCount.mockReturnValueOnce(12); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(4);  // Third line tokens
      estimateTokenCount.mockReturnValueOnce(4);  // Second line tokens
      
      const result = truncateText(text, 10, 'start');
      
      expect(result).not.toContain('First part of text.');
      expect(result).toContain('Second part of text.');
      expect(result).toContain('Third part of text.');
      expect(result).toContain('[...Content truncated from beginning...]');
    });

    test('should include truncation indicator in token count calculation', () => {
      const longText = generateTestText(20);
      estimateTokenCount.mockReturnValueOnce(20); // Total token count
      estimateTokenCount.mockReturnValueOnce(4);  // Truncation indicator tokens
      
      // Simulate each word being 1 token in the mock
      const wordMock = jest.fn().mockImplementation((text) => 1);
      for (let i = 0; i < 20; i++) {
        estimateTokenCount.mockReturnValueOnce(wordMock());
      }
      
      const result = truncateText(longText, 10, 'start');
      
      // Should have truncation indicator
      expect(result).toContain('[...Content truncated from beginning...]');
      
      // Should preserve approximately 6 tokens worth of content (10 - 4 for indicator)
      const contentTokenCount = estimateTokenCount(result) - 4; // Subtract indicator tokens
      expect(contentTokenCount).toBeLessThanOrEqual(6);
    });
  });

  // Scenario: `-m <number>` with `-t middle`: Truncate text to max tokens from the middle
  describe('Middle truncation strategy', () => {
    test('should truncate text from the middle', () => {
      const text = 'First part of text.\nMiddle part of text.\nLast part of text.';
      estimateTokenCount.mockReturnValueOnce(12); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Half of target tokens (10-3)/2
      estimateTokenCount.mockReturnValueOnce(5);  // Remaining target tokens
      estimateTokenCount.mockReturnValueOnce(4);  // First line tokens
      estimateTokenCount.mockReturnValueOnce(4);  // Last line tokens
      
      const result = truncateText(text, 10, 'middle');
      
      expect(result).toContain('First part of text.');
      expect(result).not.toContain('Middle part of text.');
      expect(result).toContain('Last part of text.');
      expect(result).toContain('[...Content truncated from middle...]');
    });

    test('should handle cases where maxTokens is too small for indicator', () => {
      const text = 'Some text that needs truncation';
      estimateTokenCount.mockReturnValueOnce(6); // Total token count
      estimateTokenCount.mockReturnValueOnce(5); // Truncation indicator tokens (more than maxTokens)
      estimateTokenCount.mockReturnValueOnce(3); // End truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(1); // First word token
      
      const result = truncateText(text, 3, 'middle');
      
      // Should fallback to end truncation
      expect(result).toContain('[...Content truncated from end...]');
    });

    test('should distribute tokens between start and end portions', () => {
      const text = 'Part 1.\nPart 2.\nPart 3.\nPart 4.\nPart 5.\nPart 6.';
      estimateTokenCount.mockReturnValueOnce(12); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(4);  // Half of target tokens for start (9/2)
      estimateTokenCount.mockReturnValueOnce(5);  // Remaining target tokens for end
      estimateTokenCount.mockReturnValueOnce(2);  // Part 1 tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Part 2 tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Part 6 tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Part 5 tokens
      
      const result = truncateText(text, 12, 'middle');
      
      expect(result).toContain('Part 1.');
      expect(result).toContain('Part 2.');
      expect(result).not.toContain('Part 3.');
      expect(result).not.toContain('Part 4.');
      expect(result).toContain('Part 5.');
      expect(result).toContain('Part 6.');
      expect(result).toContain('[...Content truncated from middle...]');
    });
  });

  // Token limit handling and edge cases
  describe('Token limit handling', () => {
    test('should handle exactly matching token count (no truncation needed)', () => {
      const text = 'Exactly ten tokens in this text right here.';
      estimateTokenCount.mockReturnValueOnce(10); // Exactly matches the limit
      
      const result = truncateText(text, 10);
      
      expect(result).toBe(text);
      expect(result).not.toContain('[...Content truncated');
    });

    test('should handle very small token limits', () => {
      const text = 'Some text that needs truncation';
      estimateTokenCount.mockReturnValueOnce(6); // Total token count
      estimateTokenCount.mockReturnValueOnce(3); // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(1); // First word token
      
      const result = truncateText(text, 4, 'end');
      
      // Should include truncation indicator and minimal content
      expect(result).toContain('[...Content truncated from end...]');
      expect(result.length).toBeLessThan(text.length);
    });

    test('should handle token limit smaller than indicator (extreme case)', () => {
      const text = 'Text to truncate';
      estimateTokenCount.mockReturnValueOnce(3); // Total token count
      estimateTokenCount.mockReturnValueOnce(3); // Truncation indicator tokens
      
      // This is an extreme case where we can't even fit the indicator
      // Implementation should handle this gracefully
      const result = truncateText(text, 2, 'end');
      
      // Result should be truncated to fit within limit
      expect(estimateTokenCount(result)).toBeLessThanOrEqual(2);
    });
  });

  // Edge cases for invalid inputs
  describe('Invalid inputs', () => {
    test('should handle negative maxTokens', () => {
      const text = 'Some text';
      
      // Implementation should handle this - either throw or handle gracefully
      expect(() => truncateText(text, -5, 'end')).toThrow();
    });

    test('should handle zero maxTokens', () => {
      const text = 'Some text';
      
      // Implementation should handle this - either throw or handle gracefully
      expect(() => truncateText(text, 0, 'end')).toThrow();
    });

    test('should handle non-numeric maxTokens', () => {
      const text = 'Some text';
      
      // Implementation should handle this - either throw or handle gracefully
      expect(() => truncateText(text, 'not-a-number', 'end')).toThrow();
    });
  });

  // Multi-line text handling
  describe('Multi-line text handling', () => {
    test('should handle text with multiple lines and paragraphs', () => {
      const multilineText = 'Line 1\nLine 2\n\nParagraph 2\nLine 3\nLine 4';
      estimateTokenCount.mockReturnValueOnce(12); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Line 1 tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Line 2 tokens
      
      const result = truncateText(multilineText, 7, 'end');
      
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).not.toContain('Paragraph 2');
      expect(result).toContain('[...Content truncated from end...]');
    });

    test('should preserve important formatting when possible', () => {
      const formattedText = '# Heading\n\n* Item 1\n* Item 2\n\nRegular paragraph.';
      estimateTokenCount.mockReturnValueOnce(10); // Total token count
      estimateTokenCount.mockReturnValueOnce(3);  // Truncation indicator tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Heading tokens
      estimateTokenCount.mockReturnValueOnce(2);  // Item 1 tokens
      
      const result = truncateText(formattedText, 7, 'end');
      
      expect(result).toContain('# Heading');
      expect(result).toContain('* Item 1');
      expect(result).not.toContain('* Item 2');
      expect(result).not.toContain('Regular paragraph');
    });
  });
});