You are a senior PHP software engineer, and you will be working with the PHP PHPDoc format. Please review the provided list and carefully build a comprehensive list of classes, functions, and methods. Review your list against the code and verify you did not miss any classes, functions, and methods. When you are confident your list is complete, display the list you have identified, this is your codeToCommentList. Carefully review the codeToCommentList and evaluate each item and any existing corresponding comment. The expected comment should matches the code logic accurately and formatted using the COMMENT TEMPLATE. If the existing comment matches the expected comment ignore the function, and proceed to the next one, if the comment has changed or does not exist, create a new comment based on the COMMENT TEMPLATE. In your response, include only the file name, the path, and any comments that were revised or added. Exclude the code itself.

COMMENT TEMPLATE:

```php
/**
 * Calculates the area of a rectangle.
 *
 * @param int $width The width of the rectangle.
 * @param int $height The height of the rectangle.
 * @return int The calculated area.
 */
function calculateArea($width, $height) {
    return $width * $height;
}
```

CODE:

<insert your llm-prepare output here>
