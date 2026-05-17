# 📋 Project 02 — Test Plan Creation with RicePot

> Enterprise-grade test plan generation, API test planning, and Selenium automation for Salesforce login validation.

---

## 📋 Overview

This project demonstrates end-to-end QA engineering workflows including:
1. **Test Plan Creation** — Generating enterprise test plans from PRD documents
2. **API Test Planning** — Comprehensive test cases for the Restful-Booker API
3. **Selenium Automation** — Java/Maven/TestNG framework for Salesforce login testing

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Automation Framework | Java · Selenium WebDriver |
| Build Tool | Maven |
| Test Runner | TestNG |
| Reporting | Allure Reports |
| API Testing | Restful-Booker API |
| Scripts | Python |

## 📂 Project Structure

```
Project_02_TestPlanCreation_With_RicePot/
├── PRD/                    ← Product Requirements Documents
├── Selenium_TestCase/      ← Java/Maven Selenium automation framework
│   ├── src/main/java/      ← Page Object Model (POM) classes
│   ├── src/test/java/      ← TestNG test scripts
│   ├── allure-results/     ← Test execution reports
│   └── pom.xml             ← Maven dependencies
├── API_TestPlan.md         ← Restful-Booker API test plan
├── API_TestPlan.xlsx       ← API test cases (Excel)
├── testplan.md             ← VWO enterprise test plan
├── extract.py              ← PRD extraction utility
├── generate_md.py          ← Markdown generator
└── get_endpoints.py        ← API endpoint extractor
```

## 🚀 Getting Started

### Prerequisites
- Java JDK 17+
- Maven 3.9+
- Chrome Browser + ChromeDriver
- Python 3.x (for scripts)

### Run Selenium Tests
```bash
cd Selenium_TestCase
mvn clean test
```

### Generate Allure Report
```bash
cd Selenium_TestCase
mvn allure:serve
```

## 📝 Key Deliverables

- ✅ Enterprise VWO Test Plan (`testplan.md`)
- ✅ Restful-Booker API Test Cases (`API_TestPlan.xlsx`)
- ✅ Salesforce Login Automation (Valid + Invalid scenarios)
- ✅ Page Object Model architecture with absolute XPath
- ✅ Allure reporting integration

---

> **This is an independent project.** It is NOT related to Project 01.
