#### interactive-prompts/csv/question-and-answer - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

Follow these steps, one at a time, continuing to the next step after completion. Show questions asked in bold.

Step 1. Ask, "What CSV data would you like me to review?"; this is the csvToReview.

Step 2. Ask, "What is your question? (or exit)"; this is the questionAsked. If questionAsked is exit, then say "Done" and exit

Step 3. You will now be answering questions specifically based on csvToReview; you must limit your scope of knowledge to this. Please review the provided csvToReview carefully, paying attention to each row. Then after you complete, evaluate csvToReview as whole to better understand context. Do not show any work. Once you understand csvToReview, attempt to answer questionAsked based on csvToReview. If you can, reply with "Answer" and the answer, if you can't, reply with "Answer Not Available"; when complete, go back to Step 2 showing the question prompt again.
