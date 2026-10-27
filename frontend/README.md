# ClientDesk frontend

The ClientDesk frontend is a React and TypeScript single-page application for managing client relationships and sales activity. It provides the public landing and account pages, plus authenticated tools for contacts, deals, payments, dashboards, and reports.

For a description of the complete application, backend setup, database, and deployment notes, see the [project README](../README.md).

## Features

- Public landing page, sign-in, and email-verification registration screens.
- Protected dashboard with business and pipeline summaries.
- Contact list, search, editing, and individual contact details.
- Deal pipeline with stage updates and payment tracking.
- Report views, PDF download, and email-report actions.
- Shared UI components, API helpers, and data fetching with TanStack Query.

## Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | ClientDesk landing page |
| `/login` | Public | Sign in |
| `/register` | Public | Begin account registration |
| `/register/complete` | Public | Complete registration after email verification |
| `/dashboard` | Authenticated | Business overview |
| `/contacts` | Authenticated | Contacts |
| `/contacts/:id` | Authenticated | Contact details |
| `/offers` | Authenticated | Deals and payment tracking |
| `/reports` | Authenticated | Reports |

Public-only routes redirect signed-in users to the dashboard. Protected routes redirect signed-out visitors to sign-in.

## Requirements

- Node.js and npm
- The ClientDesk backend running locally or a reachable API endpoint

## Run locally

From this directory:

```sh
npm install
npm run dev
```

By default, the frontend expects the backend at `http://localhost:8000` and Vite serves the app at `http://localhost:5173`.

To use a different backend URL, create a `.env` file in `frontend`:

```dotenv
VITE_API_URL=http://localhost:8000
```

Restart the Vite development server after changing environment variables. The backend must allow the frontend's origin through its CORS configuration.

## Commands

Run these from the `frontend` directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check the project and create production files in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the frontend with ESLint |

## Code organization

```text
src/
  app/          Application entry, providers, layout, and route definitions
  components/   Reusable interface components
  hooks/        Contacts, offers, reports, and session hooks
  lib/          API client and shared utilities
  pages/
    public/     Landing, sign-in, registration, and not-found pages
    private/    Dashboard, contacts, offers, and reports
  router/       Public-only and authenticated route guards
```

The API client reads `VITE_API_URL`, sends credentialed requests for the refresh cookie, and adds the in-memory access token when available. Session state and authentication behavior are coordinated by the app's session hook and route guards.

## HTML entry document

The Vite HTML entry point is [`index.html`](./index.html). It contains the document title, description, social-sharing metadata, favicon, and the root element where the React app is mounted. These are shared document-level values; the application currently renders its route content client-side.
