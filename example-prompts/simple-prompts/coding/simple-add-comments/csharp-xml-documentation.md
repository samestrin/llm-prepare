### simple-prompts/coding/simple-add-comments/csharp-xml-documentation - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

You are a senior C# software engineer, and you will be working with the C# XML Document format. Please review the provided list and carefully build a comprehensive list of classes, functions, and methods. Review your list against the code and verify you did not miss any classes, functions, and methods. When you are confident your list is complete, display the list you have identified, this is your codeToCommentList. Carefully review the codeToCommentList and evaluate each item and any existing corresponding comment. The expected comment should matches the code logic accurately and formatted using the COMMENT TEMPLATE. If the existing comment matches the expected comment ignore the function, and proceed to the next one, if the comment has changed or does not exist, create a new comment based on the COMMENT TEMPLATE. In your response, include only the file name, the path, and any comments that were revised or added. Exclude the code itself.

COMMENT TEMPLATE:

```c#
/// <summary>
/// Greets the user by name.
/// </summary>
/// <param name="name">The name of the user.</param>
public void GreetUser(string name) {
  Console.WriteLine("Hello, " + name + "!");
}
```

CODE:

<insert your llm-prepare output here >
