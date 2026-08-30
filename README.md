# Battle Born Promotions — Vanilla JavaScript

Battle Born Promotions is a lightweight promotions management application built for businesses that want a simple way to capture customer signups, verify promotional eligibility, and redeem offers.

This version is built with **vanilla HTML, CSS, and JavaScript** on the frontend, with **Azure Functions** providing the backend API and **Azure Table Storage** providing persistent data storage.

The project intentionally avoids a frontend framework and build process, keeping the client lightweight, portable, and easy to deploy.

---

## Overview

Battle Born Promotions provides two primary workflows:

### Customer Signup

Customers can register for a promotion using:

- Email address
- Phone number

Signup information is sent to the backend API and stored in Azure Table Storage.

### Staff Promotion Management

Authorized staff can:

- Sign in through a custom staff login
- Search for customers by email or phone number
- View promotion eligibility
- Redeem a customer's promotion
- Prevent duplicate redemption
- Log out and revoke the active server-side session

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- Azure Functions
- Node.js
- `@azure/functions`
- `@azure/data-tables`

### Data

- Azure Table Storage

### Hosting & Deployment

- Azure Static Web Apps
- GitHub Actions

---

## Architecture

```text
Customer / Staff Browser
          │
          ▼
 Azure Static Web App
          │
          ├── HTML
          ├── CSS
          └── Vanilla JavaScript
          │
          ▼
     /api/*
          │
          ▼
   Azure Functions
          │
          ▼
 Azure Table Storage
```

The frontend and backend are separated through API boundaries. The browser never receives storage credentials, password hashes, or other backend secrets.

---

## Authentication

The staff interface uses custom server-side authentication.

Staff credentials are configured through Azure application settings rather than being stored in frontend JavaScript.

Passwords are verified on the server using Node.js `scrypt`.

After successful authentication:

1. The server generates a cryptographically random session ID.
2. The session is stored in Azure Table Storage.
3. The browser receives the random session ID in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
4. Protected API endpoints validate the server-side session before performing operations.

The browser does not receive the stored password hash or authentication configuration.

Sessions currently expire after **8 hours**.

Logging out deletes the server-side session and clears the browser session cookie.

---

## Protected Operations

Authentication is enforced by the backend rather than relying only on frontend routing.

Protected functionality includes:

- Customer lookup
- Promotion redemption
- Session validation

This means directly calling a protected API without a valid staff session returns an unauthorized response even if the frontend is bypassed.

---

## Promotion Redemption

Promotion redemption is persisted in Azure Table Storage.

When a promotion is redeemed, the customer record is updated with:

```text
promotionUsed: true
promotionUsedAt: <timestamp>
```

Subsequent redemption attempts are rejected to prevent the same promotion from being used multiple times.

---

## Azure Storage Tables

### `newsletter`

Stores customer signup and promotion information.

Example fields:

```text
partitionKey
rowKey
type
value
createdAt
promotionUsed
promotionUsedAt
```

### `staffSessions`

Stores active authenticated staff sessions.

Example fields:

```text
partitionKey
rowKey
username
createdAt
expiresAt
```

Session IDs are generated using cryptographically secure random values.

---

## API

The application currently includes the following Azure Functions:

```text
POST /api/saveEmail
GET  /api/findCustomer
POST /api/redeemPromotion

POST /api/login
GET  /api/checkSession
POST /api/logout
```

### Public API

`POST /api/saveEmail`

Registers a customer for a promotion.

### Protected APIs

`GET /api/findCustomer`

Looks up a customer by email address or phone number.

`POST /api/redeemPromotion`

Marks an eligible promotion as redeemed.

`GET /api/checkSession`

Validates the current staff session.

### Authentication

`POST /api/login`

Validates staff credentials and creates a server-side session.

`POST /api/logout`

Revokes the active server-side session and clears the authentication cookie.

---

## Project Structure

```text
/
├── index.html
├── login.html
├── dashboard.html
│
├── css/
│   ├── style.css
│   ├── login.css
│   └── dashboard.css
│
├── js/
│   ├── script.js
│   ├── login.js
│   └── dashboard.js
│
├── images/
│   └── logo.jpeg
│
└── api/
    ├── host.json
    ├── package.json
    │
    └── src/
        ├── validateSession.js
        │
        └── functions/
            ├── saveEmail.js
            ├── findCustomer.js
            ├── redeemPromotion.js
            ├── login.js
            ├── checkSession.js
            └── logout.js
```

---

## Environment Configuration

The backend expects the following Azure application settings:

```text
AZURE_STORAGE_CONNECTION_STRING
STAFF_USERNAME
STAFF_PASSWORD_HASH
```

Secrets and credentials should **never be committed to the repository**.

---

## Design Goals

The vanilla implementation focuses on:

- Minimal frontend dependencies
- No frontend framework
- No frontend build process
- Responsive/mobile-friendly operation
- Simple deployment
- Clear separation between frontend and backend
- Server-side authorization for protected operations
- Portable, readable frontend code

---

## Security Notes

For the demo I kept the infrastructure lightweight. In production, I would put Azure Front Door/WAF in front of the public endpoints and configure rate limiting for authentication and signup traffic. 

The application currently implements:

- Server-side password verification
- `scrypt` password hashing
- Timing-safe password hash comparison
- Cryptographically random session identifiers
- Server-side session storage
- `HttpOnly` session cookies
- `Secure` cookies
- `SameSite=Strict`
- Session expiration
- Server-side session revocation on logout
- Backend authorization for protected APIs
- Generic authentication error responses

Additional production hardening such as login throttling/rate limiting may be added as the project evolves.

---

## Development Direction

The vanilla JavaScript implementation is maintained as an independent version of Battle Born Promotions.

A React implementation is also planned to explore a component-based frontend architecture while retaining the same general application workflows and backend API design.

Maintaining both implementations provides an opportunity to compare the tradeoffs between a lightweight framework-free frontend and a modern component-based application architecture.

---

## Status

**Vanilla JavaScript V1 — Working**

Current functionality includes:

- Customer signup
- Email and phone registration
- Azure-backed persistence
- Staff authentication
- Server-side sessions
- Customer lookup
- Promotion status verification
- Promotion redemption
- Duplicate-redemption prevention
- Logout and session revocation
- Responsive staff interface
