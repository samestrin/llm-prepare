#### simple-prompts/coding/simple-add-comments/rust-rustdoc-comments - Copyright (c) 2024-PRESENT <https://github.com/samestrin/llm-prepare>

You are a senior Rust software engineer, and you will be working with the Rust Rustdoc format.

Please review the provided CODE and carefully build a comprehensive list of classes, functions, and methods. This is your comprehensiveCodeList. Carefully review the comprehensiveCodeList and evaluate each item and any existing corresponding comment. The expected comment should be formatted using the COMMENT TEMPLATE and it should match the code logic accurately. If the existing comment matches the expected comment do nothing, if the comment needs revision or does not exist, create a new comment carefully following the rules set in the COMMENT TEMPLATE, add this to your commentList. Do not display any work.

Compare your commentList against the comphensiveCodeList and evaluate each class, function, method, and any existing corresponding comment. The expected comment should be formatted using the COMMENT TEMPLATE and it should match the code logic accurately. If the existing comment matches the expected comment do nothing, if the comment needs revision or does not exist and it does not already exist in the commentList, add it to your commentList. Do not display any work.

Based on comprehensiveCodeList and commentList, show a bulleted list of all classes, functions and methods, indicating which ones had comments revised or added, title this "Comment Overview:", this is the commentOverview. Then using commentList, show all comments, prepend the file name with path, and the class, function, or method name, while excluding the code itself. You must show all comments listed in commentOverview, assume I lost my comments and need to reconstruct them from your output, title this "Comments:". There is no limit to your output, continue outputting comments until you have no comments left. When you think you are done, double check your commentOverview and if you have more comments to output display "Type 'continue' for more comments.". Only show comments, do not show any code, this is a restriction.

COMMENT TEMPLATE:

````rust
/// Briefly describes what the function does.
///
/// More detailed explanation of the function's behavior. Can include discussion
/// of the algorithms used, its computational complexity, etc.
///
/// # Arguments
///
/// * `param1` - Description of the first parameter.
/// * `param2` - Description of the second parameter, including any details
///              about its expected range or required format.
///
/// # Returns
///
/// Returns a description of the value returned by the function, including
/// the type of the value and conditions under which different values might
/// be returned.
///
/// # Panics
///
/// Details any conditions under which the function might panic.
///
/// # Errors
///
/// Explains the errors that this function might return and the conditions
/// that would cause those errors.
///
/// # Safety
///
/// If applicable, contains a discussion of any safety issues developers
/// need to be aware of when using the function. This is particularly important
/// for `unsafe` functions.
///
/// # Examples
///
/// Provides one or more examples of how to use the function. Code samples
/// are typically enclosed within triple backticks and can include annotations
/// for running them as tests.
///
/// ```
/// // Example usage of the function
/// let result = your_function("input");
/// assert_eq!(result, expected_value);
/// ```
fn your_function(param1: Type1, param2: Type2) -> ReturnType {
    // Function implementation
}
````

CODE:

<insert your llm-prepare output here>
