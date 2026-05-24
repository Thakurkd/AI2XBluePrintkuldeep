# Invalid Login Test Cases

## 1. Invalid Email Format
- **Description:** Verify login fails when the email ID format is invalid.
- **Precondition:** Login page is open.
- **Steps:**
  1. Enter `userexample.com` in the email field.
  2. Enter a valid password.
  3. Click `Sign in`.
- **Expected Result:** The login attempt is rejected and a validation message appears indicating the email format is invalid.

## 2. Empty Email Field
- **Description:** Verify login fails when the email field is left blank.
- **Precondition:** Login page is open.
- **Steps:**
  1. Leave the email field empty.
  2. Enter a valid password.
  3. Click `Sign in`.
- **Expected Result:** The login attempt is rejected and an error message appears requesting the email ID.

## 3. Incorrect Password
- **Description:** Verify login fails when a valid email is entered with an incorrect password.
- **Precondition:** Login page is open.
- **Steps:**
  1. Enter a valid email address.
  2. Enter an incorrect password.
  3. Click `Sign in`.
- **Expected Result:** The login attempt is rejected and a message appears indicating either the email or password is incorrect.

## 4. Empty Password Field
- **Description:** Verify login fails when the password field is left blank.
- **Precondition:** Login page is open.
- **Steps:**
  1. Enter a valid email address.
  2. Leave the password field empty.
  3. Click `Sign in`.
- **Expected Result:** The login attempt is rejected and an error message appears requesting the password.

## 5. SQL Injection Attempt in Email Field
- **Description:** Verify login fails and input is sanitized when SQL injection-like content is entered in the email field.
- **Precondition:** Login page is open.
- **Steps:**
  1. Enter `" OR "1"="1` in the email field.
  2. Enter any password.
  3. Click `Sign in`.
- **Expected Result:** The login attempt is rejected and the system does not allow the injection string to bypass authentication. An invalid credentials message is displayed.
