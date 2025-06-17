import { jest } from '@jest/globals';
import { convertFormat } from '../../src/formatters/format-converter.js';
import { detectFormat } from '../../src/utils/format-detector.js';
import fs from 'fs/promises';
import path from 'path';

describe('Format Module', () => {
  const tempDir = path.join(process.cwd(), 'temp_format_tests');
  let htmlContent, markdownContent, textContent;

  // Setup test environment
  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    
    // Sample content for format conversion tests
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Document</title>
</head>
<body>
  <h1>Test Heading</h1>
  <p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <a href="https://example.com">Link</a>
</body>
</html>`;

    markdownContent = `# Test Heading

This is a **paragraph** with *formatting*.

- Item 1
- Item 2
- Item 3

[Link](https://example.com)`;

    textContent = `Test Heading

This is a paragraph with formatting.

Item 1
Item 2
Item 3

Link`;

    // Write sample files for testing
    await fs.writeFile(path.join(tempDir, 'sample.html'), htmlContent);
    await fs.writeFile(path.join(tempDir, 'sample.md'), markdownContent);
    await fs.writeFile(path.join(tempDir, 'sample.txt'), textContent);
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Format detection tests
  describe('detectFormat', () => {
    test('should detect HTML format correctly', () => {
      expect(detectFormat(htmlContent)).toBe('html');
    });

    test('should detect Markdown format correctly', () => {
      expect(detectFormat(markdownContent)).toBe('markdown');
    });

    test('should default to text format for plain text', () => {
      expect(detectFormat(textContent)).toBe('text');
    });

    test('should detect HTML with just a simple tag', () => {
      const simpleHtml = '<div>Simple HTML</div>';
      expect(detectFormat(simpleHtml)).toBe('html');
    });

    test('should detect HTML with doctype declaration', () => {
      const doctypeHtml = '<!DOCTYPE html><html><body>Test</body></html>';
      expect(detectFormat(doctypeHtml)).toBe('html');
    });

    test('should detect Markdown with different features', () => {
      const headerMd = '## Header\nContent';
      const listMd = '- Item 1\n- Item 2';
      const linkMd = '[Link](https://example.com)';
      
      expect(detectFormat(headerMd)).toBe('markdown');
      expect(detectFormat(listMd)).toBe('markdown');
      expect(detectFormat(linkMd)).toBe('markdown');
    });

    test('should handle empty or whitespace input', () => {
      expect(detectFormat('')).toBe('text');
      expect(detectFormat('   ')).toBe('text');
    });
  });

  // Format conversion tests
  describe('convertFormat', () => {
    // Scenario: `-f markdown`: Convert input to markdown
    describe('to markdown conversion', () => {
      test('should convert HTML to Markdown', async () => {
        const result = await convertFormat(htmlContent, 'markdown');
        expect(result).toContain('# Test Heading');
        expect(result).toContain('**paragraph**');
        expect(result).toContain('*formatting*');
        expect(result).toContain('- Item 1');
        expect(result).toContain('[Link](https://example.com)');
      });

      test('should maintain text as escaped Markdown when converting from text', async () => {
        const textWithSpecialChars = '# Not a heading\n* Not a list item';
        const result = await convertFormat(textWithSpecialChars, 'markdown');
        expect(result).toContain('\\# Not a heading');
        expect(result).toContain('\\* Not a list item');
      });

      test('should return original content if already in Markdown format', async () => {
        const result = await convertFormat(markdownContent, 'markdown');
        expect(result).toBe(markdownContent);
      });
    });

    // Scenario: `-f html`: Convert input to html
    describe('to html conversion', () => {
      test('should convert Markdown to HTML', async () => {
        const result = await convertFormat(markdownContent, 'html');
        expect(result).toContain('<h1>Test Heading</h1>');
        expect(result).toContain('<strong>paragraph</strong>');
        expect(result).toContain('<em>formatting</em>');
        expect(result).toContain('<li>Item 1</li>');
        expect(result).toContain('<a href="https://example.com">Link</a>');
      });

      test('should wrap plain text in a pre tag when converting from text', async () => {
        const result = await convertFormat(textContent, 'html');
        expect(result).toMatch(/<pre>.*<\/pre>/s);
        expect(result).toContain('Test Heading');
        expect(result).toContain('This is a paragraph with formatting.');
      });

      test('should return original content if already in HTML format', async () => {
        const result = await convertFormat(htmlContent, 'html');
        expect(result).toBe(htmlContent);
      });

      test('should properly escape HTML special characters when converting from text', async () => {
        const textWithHtml = 'Text with <b>tags</b> & special characters';
        const result = await convertFormat(textWithHtml, 'html');
        expect(result).toContain('&lt;b&gt;tags&lt;/b&gt;');
        expect(result).toContain('&amp;');
      });
    });

    // Scenario: `-f text`: Convert input to plain text
    describe('to text conversion', () => {
      test('should convert HTML to plain text', async () => {
        const result = await convertFormat(htmlContent, 'text');
        expect(result).toContain('Test Heading');
        expect(result).toContain('This is a paragraph with formatting.');
        expect(result).toContain('Item 1');
        expect(result).toContain('Link');
        // HTML tags should be removed
        expect(result).not.toContain('<h1>');
        expect(result).not.toContain('<strong>');
      });

      test('should convert Markdown to plain text', async () => {
        const result = await convertFormat(markdownContent, 'text');
        expect(result).toContain('Test Heading');
        expect(result).toContain('This is a paragraph with formatting.');
        expect(result).toContain('Item 1');
        expect(result).toContain('Link');
        // Markdown formatting should be removed
        expect(result).not.toContain('**');
        expect(result).not.toContain('*');
        expect(result).not.toContain('#');
      });

      test('should return original content if already in text format', async () => {
        const result = await convertFormat(textContent, 'text');
        expect(result).toBe(textContent);
      });
    });

    // Edge cases
    describe('edge cases', () => {
      test('should handle empty input gracefully', async () => {
        expect(await convertFormat('', 'html')).toBe('');
        expect(await convertFormat('', 'markdown')).toBe('');
        expect(await convertFormat('', 'text')).toBe('');
      });

      test('should throw error for invalid target format', async () => {
        await expect(convertFormat(textContent, 'invalid-format')).rejects.toThrow(/Unsupported conversion/);
      });

      test('should handle content with mixed formats correctly', async () => {
        const mixedContent = `# Markdown Heading

<div>Some HTML content</div>

Plain text paragraph`;

        // The detectFormat function should make a best guess based on the content
        // and then the conversion should proceed based on that detection
        const format = detectFormat(mixedContent);
        const result = await convertFormat(mixedContent, 'text');

        // Regardless of the detected format, the result should contain the text content
        expect(result).toContain('Markdown Heading');
        expect(result).toContain('Some HTML content');
        expect(result).toContain('Plain text paragraph');
      });

      test('should handle malformed HTML gracefully', async () => {
        const malformedHtml = '<div>Unclosed div tag<span>Nested</div>';
        const result = await convertFormat(malformedHtml, 'markdown');
        // Should still produce some kind of markdown result without throwing
        expect(result).toContain('Unclosed div tag');
        expect(result).toContain('Nested');
      });

      test('should handle complex formatting conversions', async () => {
        const complexMarkdown = `
# Main Heading

## Subheading

\`\`\`javascript
function test() {
  return "Hello World";
}
\`\`\`

> Blockquote text
> Multiple lines

1. Numbered item 1
2. Numbered item 2

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;
        
        // Convert to HTML then back to markdown to test roundtrip conversion
        const htmlResult = await convertFormat(complexMarkdown, 'html');
        const markdownResult = await convertFormat(htmlResult, 'markdown');
        
        // Test that essential formatting elements are preserved in the HTML conversion
        expect(htmlResult).toContain('<h1>');
        expect(htmlResult).toContain('<h2>');
        expect(htmlResult).toContain('<pre>');
        expect(htmlResult).toContain('<blockquote>');
        expect(htmlResult).toContain('<ol>');
        expect(htmlResult).toContain('<table>');
        
        // Test that essential content is preserved in the roundtrip conversion
        expect(markdownResult).toContain('# Main Heading');
        expect(markdownResult).toContain('## Subheading');
        expect(markdownResult).toContain('function test()');
        expect(markdownResult).toContain('Blockquote text');
        expect(markdownResult).toMatch(/\d\.\s+Numbered item \d/);
        // Table format might vary between markdown processors, but should contain the data
        expect(markdownResult).toContain('Column 1');
        expect(markdownResult).toContain('Cell 4');
      });

      test('should handle debug option for additional information', async () => {
        // Mock console.error to capture debug output
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        await convertFormat(textContent, 'markdown', { debug: true });
        
        // Verify debug output was logged
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Debug:'));
        
        // Clean up
        mockConsoleError.mockRestore();
      });
    });
  });
});