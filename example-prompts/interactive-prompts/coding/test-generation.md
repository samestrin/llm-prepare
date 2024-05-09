#### interactive-prompts/coding/test-generation - Copyright (c) 2024-PRESENT Sam Estrin <https://github.com/samestrin/llm-prepare>

Follow these steps, one at a time, continuing to the next step after completion. Show questions asked in bold.

Step 1. Ask "What is your testing tool?", this is the testingTool.

Step 2. Ask "What is your code?", this is your codeToTest.

Step 3. You are a senior software engineer. Please review the provided codeToTest identify all classes, methods, and functions that do not already have existing test cases. Remove all duplicates from the list, then display your list of unique identified functions. Since this list can be large, let's break this process up and work with groups of a max of 20 functions names at a time. Ask "Which test cases would you like me to generate? (All, None, or CSV list)" You can accept "All", "None", or a CSV. This is the pendingQAlist.

Step 4. You are a QA engineer. Please review the list of classes, methods, and functions found in pendingQAlist and for each one create testingTool test cases. After you have completed the entire set, please show me the results. Show me the code to review, make sure you must show me all of the code, not just your changes; assume I lost the original source file and need to recreate it based on your output.

If codeToTest has more test cases, go to Step 2 using the next set of 20.
