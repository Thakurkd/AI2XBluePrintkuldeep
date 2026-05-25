# STLC Automation Test Plan

## Project
- Feature: Add/Remove Elements page
- Target URL: https://the-internet.herokuapp.com/add_remove_elements/

## Objective
Build an end-to-end STLC automation pipeline to validate the Add/Remove Elements feature.

## In Scope
- Verify the Add Element button adds new Delete buttons
- Verify multiple Delete buttons can be added and removed
- Verify Delete buttons are not present on page load
- Verify removing elements updates the button count
- Validate the page contains the expected title and controls

## Out of Scope
- Browser compatibility across multiple browsers
- Responsive/mobile layout testing
- Application-level persistence or user sessions
- Accessibility testing beyond simple DOM checks
- Non-functional performance or load testing

## Test Scenarios
1. Add one element and verify exactly one Delete button appears.
2. Add three elements, remove one, and verify exactly two Delete buttons remain.
3. Add two elements, remove both, and verify no Delete buttons remain.
4. Verify the page opens with zero Delete buttons present.
5. Intentional failure: add one element and assert that two Delete buttons appear.

## Risk Assessment
- **Locator changes:** The page is simple, but CSS class or text changes could break selectors.
- **Timing issues:** DOM updates are immediate, but assertions should only run after expected button state.
- **False positives:** The intentional failure is designed to verify pipeline defect reporting.
- **Test report dependencies:** If Playwright report generation fails, the pipeline should still produce JSON output for Jira reporting.

## Notes
- The chosen page is a stable single-page interaction site.
- Intentional failure is included to exercise Jira ticket creation.
