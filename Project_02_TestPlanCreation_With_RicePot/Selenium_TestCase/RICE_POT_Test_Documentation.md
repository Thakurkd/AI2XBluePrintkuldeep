# RICE POT Prompt Framework & Test Automation Documentation

This document explains the **RICE POT** framework that was used to define the requirements for generating the test suite and provides a detailed breakdown of the resulting test case hierarchy.

## 1. The RICE POT Prompt Structure

**RICE POT** is a powerful prompt engineering framework used to elicit specific, high-quality responses from an AI. Here is how your request mapped into this framework:

- **R - Role:** 
  - *Your prompt:* "You are a QA automation tester with 15 years of experience... enterprise-level framework."
  - *Effect:* Set the persona to an expert automation engineer, ensuring the code output adheres to enterprise standards (Page Object Model, robust exception handling, Maven build tool).

- **I - Instructions:** 
  - *Your prompt:* "Generate a Complete Selenium with Java automation script... Automate and verify the results of the login page... Apply TestNG annotations... Use POM with PageFactory... only the xpath... no Thread.sleep."
  - *Effect:* Dictated the strict functional requirements. This ensured best practices were applied (e.g., WebDriverWait over Thread.sleep(), explicit exceptions, accurate XPath locators).

- **C - Context:** 
  - *Your prompt:* "AB Testing website with valid and invalid login page where in the login page you have the email, password and submit button with remember me functionality."
  - *Effect:* Provided the operational scenario, giving meaning to the elements being interacted with (Salesforce login flow).

- **E - Example:** 
  - *Your prompt:* Provided an example snippet of `PageFactory` initialization and `@FindBy` usages.
  - *Effect:* Acted as a template, guaranteeing the generated `LoginPage` class perfectly matched your expected coding style and architecture.

- **P - Parameters:** 
  - *Your prompt:* "production level automation script expert with pin point accuracy and almost zero bad coding practice. External URLs, external staging URLs."
  - *Effect:* Set constraints and boundaries, ensuring that hardcoded static waits were eliminated and the framework was built scalable enough to handle external URLs.

- **O - Output:** 
  - *Your prompt:* "Provide only: 1 Page Object file, 2 TestNG test scripts, Maven project."
  - *Effect:* Defined the strict deliverables. Only the necessary runnable files were provided, avoiding unnecessary text or explanations in the direct code output.

- **T - Tone:** 
  - *Your prompt:* "Technical, precisely, enterprise-grade, code-one."
  - *Effect:* Ensured the code was written concisely without beginner-level comments.

---

## 2. Test Case Hierarchy and Information

The framework strictly follows the **Page Object Model (POM)** design pattern. It separates the page operations (locators and actions) from the test logic.

```text
Selenium_TestCase/
├── pom.xml                        <-- Maven Configuration (Dependencies: Selenium, TestNG, Allure)
├── RICE_POT_Test_Documentation.md <-- This Documentation
└── src/
    ├── main/java/com/salesforce/pages/
    │   └── LoginPage.java         <-- Page Object File
    │       - Locates elements via @FindBy (XPath only)
    │       - Handles interactions (enterUsername, enterPassword, clickLogin)
    │       - Contains WebDriverWait & Try/Catch for robust Exception Handling
    │
    └── test/java/com/salesforce/tests/
        ├── ValidLoginTest.java    <-- Positive Test Case
        │   - Setup: Initializes ChromeDriver & Navigates to Staging URL
        │   - Test: Inputs valid credentials and asserts the 'Home' page title
        │   - Teardown: Quits the browser
        │
        └── InvalidLoginTest.java  <-- Negative Test Case
            - Setup: Initializes ChromeDriver & Navigates to Staging URL
            - Test: Inputs invalid credentials and asserts the specific error message
            - Teardown: Quits the browser
```

### 3. Allure Reporting

Allure has been integrated into the `pom.xml` configuration to provide enterprise-grade test reporting. 

**How to generate and view the report:**
1. **Run the tests** (this generates the raw `allure-results` data in your `target/` directory):
   ```bash
   mvn clean test
   ```
2. **Generate and open the Allure Report** in your browser:
   ```bash
   mvn allure:serve
   ```
   *(Note: Since you don't have Maven installed globally, you can run this via your local Maven executable: `.\apache-maven-3.9.9\bin\mvn.cmd allure:serve`)*
