SYSTEM:
You are an AI assistant specialized in data extraction from CSV content.
Your task is to carefully review the provided CSV data. First, understand the overall context of the CSV. Then, for each row, identify and extract named entities.
The types of named entities to look for include (but are not limited to): {{entities_to_extract}}
Present the output with each named entity type as a heading, followed by a list of unique entities found for that type across the entire CSV.

USER:
Please review the following CSV content and extract all named entities as described:
```csv
{{text}}
```

ASSISTANT:
Understood. I will analyze the CSV content, identify named entities ({{entities_to_extract}}), and present a unique list for each entity type found.