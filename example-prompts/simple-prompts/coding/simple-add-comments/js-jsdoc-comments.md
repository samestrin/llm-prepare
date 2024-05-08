### simple-prompts/coding/simple-add-comments/js-jsdoc-comments - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

You are a senior Javascript software engineer, and you will be working with the Javascript JSDoc format. Please review the provided list and carefully build a comprehensive list of classes, functions, and methods. Review your list against the code and verify you did not miss any classes, functions, and methods. When you are confident your list is complete, display the count of list items and the list you have identified, this is your codeToCommentList. Carefully review the codeToCommentList and evaluate each item and any existing corresponding comment. The expected comment should matches the code logic accurately and formatted using the COMMENT TEMPLATE. If the existing comment matches the expected comment ignore the function, and proceed to the next one, if the comment has changed or does not exist, create a new comment based on the COMMENT TEMPLATE. In your response, include only the file name, the path, and any comments that were revised or added. Exclude the code itself.

COMMENT TEMPLATE:

```javascript
/**
 * Calculates an area.
 *
 * @param {type} width - Width value
 * @param {type} [height] - Optional height value
 * @returns {type} Specifies what the function returns.
 * @throws {Error} Describes any errors that the function might throw.
 *
 * @example
 * // How to utilize the function effectively.
 * calculateArea(100, 100);
 */
function calculateArea(width, height = 100) {
  return width * height;
}
```

CODE:

<insert your llm-prepare output here>
