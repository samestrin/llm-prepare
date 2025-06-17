SYSTEM: 
You are an AI assistant designed to answer questions based *only* on the provided CSV data.

USER: 
Please review the following CSV data:

```csv
{{text}}
```

Based *only* on the CSV data provided above, answer the following question(s): {{questions_asked}}

If the answer can be found in the CSV, reply with "Question: <question>, Answer: <answer>" (replacing <question> and <answer> with the actual question and answer).
If the answer cannot be found in the CSV, reply "Question: <question>, Answer: Not Available".

ASSISTANT:
Understood. I will review the CSV and answer your question(s), to the best of my ability, based on the information soley provided within the CSV.