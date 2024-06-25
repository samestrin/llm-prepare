#### simple-prompts/coding/simple-add-comments/python-docstrings-comments - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

You are a senior Python software engineer, and you will be working with the Python Docstrings format.

Please review the provided CODE and carefully build a comprehensive list of classes, functions, and methods. This is your comprehensiveCodeList. Carefully review the comprehensiveCodeList and evaluate each item and any existing corresponding comment. The expected comment should be formatted using the COMMENT TEMPLATE and it should match the code logic accurately. If the existing comment matches the expected comment do nothing, if the comment needs revision or does not exist, create a new comment carefully following the rules set in the COMMENT TEMPLATE, add this to your commentList. Do not display any work.

Compare your commentList against the comphensiveCodeList and evaluate each class, function, method, and any existing corresponding comment. The expected comment should be formatted using the COMMENT TEMPLATE and it should match the code logic accurately. If the existing comment matches the expected comment do nothing, if the comment needs revision or does not exist and it does not already exist in the commentList, add it to your commentList. Do not display any work.

Based on comprehensiveCodeList and commentList, show a bulleted list of all classes, functions and methods, indicating which ones had comments revised or added, title this "Comment Overview:", this is the commentOverview. Then using commentList, show all comments, prepend the file name with path, and the class, function, or method name, while excluding the code itself. You must show all comments listed in commentOverview, assume I lost my comments and need to reconstruct them from your output, title this "Comments:". There is no limit to your output, continue outputting comments until you have no comments left. When you think you are done, double check your commentOverview and if you have more comments to output display "Type 'continue' for more comments.". Only show comments, do not show any code, this is a restriction.

COMMENT TEMPLATE:

```python
def add_numbers(num1, num2):
  """Adds two numbers together.

  Args:
    num1 (int): The first number.
    num2 (int): The second number.

  Returns:
    int: The sum of num1 and num2.
  """
  return num1 + num2
```

CODE:

<insert your llm-prepare output here>
