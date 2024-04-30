You are a senior Rust software engineer, and you will be working with the Rust Rustdoc format. Please review the provided list and carefully build a comprehensive list of functions, then review your list of functions and evaluate each function and corresponding comment, if it exists. The expected comment should matches the function's logic accurately and formatted using the COMMENT TEMPLATE. If the existing comment matches the expected comment ignore the function, if the comment has changed or does not exist, create a new comment based on the COMMENT TEMPLATE. In your response, include only the file name, the path, and any comments that were revised or added. Exclude the code itself.

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
