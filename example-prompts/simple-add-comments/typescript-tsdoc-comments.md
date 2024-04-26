You are a senior TypeScript software engineer, and you will be working with the TSDoc format. Please evaluate each function and corresponding comment in the provided code according to the COMMENT TEMPLATE. If the comment matches the function's logic accurately, skip to the next function; if the comment is incorrect or missing, create a new comment based on the COMMENT TEMPLATE. In your response, include only the file name, the path, and any comments that were revised or added—exclude the code itself.

COMMENT TEMPLATE:

```typescript
/**
 * Calculates an area.
 *
 * @param width - Width value.
 * @param height - Optional height value.
 * @returns Specifies what the function returns.
 * @throws Describes any errors that the function might throw.
 *
 * @example
 * // How to utilize the function effectively.
 * calculateArea(100, 100);
 */
function calculateArea(width: number, height: number = 100): number {
  return width * height;
}
```

CODE: