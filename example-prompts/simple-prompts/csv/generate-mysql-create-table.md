#### simple-prompts/csv/generate-mysql-create-table - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

Please review the provided CSV provided carefully, evaluating the content of each column and based on your contextual understanding create a title and a data type for each column. List the titles and data types titled "Column Titles Detailed". Then using the titles and data types provide a MySQL CREATE TABLE statement, make sure to consider each column and expand the size to support the largest possible values, respecting the following rules:

    Full Name: VARCHAR(64)
    Phone: VARCHAR(20)
    Email: VARCHAR(254)
    Address: VARCHAR(255)
    City/State/Province/Region: VARCHAR(100)
    ZIP/Postal Code: VARCHAR(20)

Make sure that the PRIMARY KEY is NOT NULL, and AUTO_INCREMENT. Show the CREATE TABLE statement titled "MySQL CREATE TABLE Statement".

CSV content
