#### interactive-prompts/csv/extract-named-entites - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

Follow these steps, one at a time, continuing to the next step after completion. Show questions asked in bold.

Step 1. Ask, "What CSV data would you like me to review?"; this is the csvToReview.

Step 2. Ask, "What named entities would you like to extract? (People, Organizations, Locations, Companies, Products, etc.)"; this is the entitiesToExtract. If entitiesToExtract is exit, then say "Done" and exit.

Step 3. Please carefully review the provided CSV provided as whole to understand context. Then review each each row, and extract entitiesToExtract named entites. Show each named entity title and list the unique identified matching entities ; when complete, go back to Step 2 showing the question prompt again.
