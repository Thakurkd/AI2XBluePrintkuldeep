# API Test Plan

## CreateToken

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_001 | Create Token - Valid Credentials | Verify that an auth token is generated successfully when valid credentials are provided. | API server is reachable. | HTTP 200; response body contains 'token' string. | High | Planned |
| API_TC_002 | Create Token - Missing Username | Verify API handles requests appropriately when mandatory 'username' is omitted. | API server is reachable. | Appropriate HTTP error code (e.g., 400); response body contains error message (undocumented specific error code in apidoc). | High | No |
| API_TC_003 | Create Token - Invalid Credentials | Verify API rejects token creation with incorrect password. | API server is reachable. | Appropriate error response (e.g., HTTP 401) or HTTP 200 with 'reason: Bad credentials' (undocumented behavior). | High | No |

---

## CreateBooking

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_004 | Create Booking - Valid Payload (JSON) | Verify that a booking is created successfully when a valid JSON request payload is submitted. | API server is reachable. | HTTP 200; response body contains bookingid (integer) and the submitted booking object. | High | Planned |
| API_TC_005 | Create Booking - Valid Payload (XML) | Verify booking creation using text/xml Content-Type and Accept headers. | API server is reachable. | HTTP 200; response body is XML format containing bookingid and booking data. | Medium | Planned |
| API_TC_006 | Create Booking - Missing Mandatory Field (totalprice) | Verify API behavior when a mandatory field (totalprice) is missing from the payload. | API server is reachable. | Appropriate error code (e.g., HTTP 400); response indicates missing field (undocumented in apidoc). | High | No |
| API_TC_007 | Create Booking - Invalid Date Format | Verify API validation for checkin/checkout date format (should be YYYY-MM-DD). | API server is reachable. | Appropriate error code; response indicates invalid date format. | Medium | No |

---

## DeleteBooking

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_008 | Delete Booking - Valid Token (Cookie) | Verify booking is deleted successfully using a valid Cookie token. | A booking exists with a known ID. A valid auth token is generated. | HTTP 201 Created (as per apidoc); response body contains 'OK'. | High | Planned |
| API_TC_009 | Delete Booking - Basic Auth | Verify booking is deleted successfully using Basic Auth header. | A booking exists with a known ID. | HTTP 201 Created; response body contains 'OK'. | High | Planned |
| API_TC_010 | Delete Booking - Missing Auth | Verify API rejects delete request without auth headers. | A booking exists. | Appropriate error code (e.g., HTTP 403 Forbidden). | High | No |
| API_TC_011 | Delete Booking - Invalid ID | Verify API behavior when deleting a non-existent booking ID. | Valid auth token is available. | Appropriate error code (e.g., HTTP 404 Not Found). | Medium | No |

---

## GetBooking

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_012 | Get Booking - Valid ID (JSON) | Verify retrieval of booking details by valid ID in JSON format. | A booking exists with a known ID. | HTTP 200 OK; response contains firstname, lastname, totalprice, depositpaid, bookingdates, additionalneeds. | High | Planned |
| API_TC_013 | Get Booking - Valid ID (XML) | Verify retrieval of booking details by valid ID in XML format. | A booking exists with a known ID. | HTTP 200 OK; response is an XML block containing booking details. | Medium | Planned |
| API_TC_014 | Get Booking - Non-existent ID | Verify response for a booking ID that does not exist. | API server reachable. | Appropriate error code (e.g., HTTP 404 Not Found). | High | No |

---

## GetBookingIds

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_015 | Get Booking Ids - No Filters | Verify retrieval of all booking IDs without any query parameters. | Bookings exist in the system. | HTTP 200 OK; response is an array of objects containing bookingid. | High | Planned |
| API_TC_016 | Get Booking Ids - Filter by Name | Verify retrieval of booking IDs filtered by firstname and lastname. | A booking exists with matching firstname/lastname. | HTTP 200 OK; response array contains only matching booking IDs. | High | Planned |
| API_TC_017 | Get Booking Ids - Filter by Date | Verify retrieval of booking IDs filtered by checkin and checkout dates. | Bookings exist within the date range. | HTTP 200 OK; response array contains booking IDs matching date criteria. | Medium | Planned |
| API_TC_018 | Get Booking Ids - Invalid Filter Parameter | Verify response when invalid query parameter is provided. | API server reachable. | HTTP 200 OK ignoring unknown parameter, or appropriate error code. | Low | No |

---

## PartialUpdateBooking

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_019 | Partial Update - Valid Payload | Verify partial update of a booking using a valid JSON payload. | A booking exists with a known ID. Valid auth token is available. | HTTP 200 OK; response body contains updated booking details. | High | Planned |
| API_TC_020 | Partial Update - Missing Auth | Verify partial update fails without valid authorization. | A booking exists. | Appropriate error code (e.g., HTTP 403 Forbidden). | High | No |
| API_TC_021 | Partial Update - Invalid Type | Verify response when partial update sends invalid data type for a field. | A booking exists. Valid auth token. | Appropriate error code (e.g., HTTP 400 Bad Request). | Medium | No |

---

## UpdateBooking

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_022 | Update Booking - Valid Payload | Verify full update of a booking using a valid JSON payload. | A booking exists with a known ID. Valid auth token is available. | HTTP 200 OK; response body contains fully updated booking details. | High | Planned |
| API_TC_023 | Update Booking - Missing Mandatory | Verify PUT request fails if mandatory fields are omitted. | A booking exists. Valid auth token. | Appropriate error code (e.g., HTTP 400 Bad Request). | High | No |
| API_TC_024 | Update Booking - Basic Auth | Verify full update succeeds with Basic auth. | A booking exists. | HTTP 200 OK; response body contains fully updated booking details. | Medium | Planned |

---

## Ping

| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |
|---|---|---|---|---|---|---|
| API_TC_025 | Health Check - Valid Request | Verify that the health check endpoint returns success. | API server is running. | HTTP 201 Created (as per apidoc). | High | Planned |

---

