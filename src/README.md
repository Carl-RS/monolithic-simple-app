# TaskFlow (Node) — Sample App for UI Automation Testing

Same app as the static HTML/CSS/JS version, but now backed by a real
**Node.js + Express** server: session-based auth and a REST API for tasks,
instead of `localStorage`. Runnable directly with `node server.js`.

## Setup & run

```bash
npm install
npm start
# or: node server.js
```

Then open `http://localhost:3000`.

## Demo credentials

```
username: admin
password: password123
```

## What changed vs. the static version

| | Static version | This version |
|---|---|---|
| Run with | a static file server | `node server.js` |
| Auth | `localStorage` flag | server-side session (cookie) |
| Task storage | `localStorage` | in-memory array on the server |
| Data access | direct JS object mutation | `fetch()` calls to a REST API |

The HTML structure and every `data-testid` are unchanged, so any Playwright
tests you wrote against the static version should work here with just a
`baseURL` change.

## API reference

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/login` | no | `{ username, password }` → sets session cookie |
| POST | `/api/logout` | no | Clears session |
| GET | `/api/me` | yes | Current logged-in user |
| GET | `/api/tasks` | yes | List all tasks |
| POST | `/api/tasks` | yes | `{ title, priority }` → create task |
| PUT | `/api/tasks/:id` | yes | Partial update (e.g. `{ completed: true }`) |
| DELETE | `/api/tasks/:id` | yes | Delete task |
| POST | `/api/test/reset` | no | Resets task list to seed data — handy for test cleanup |

## Resetting state between test runs

Since tasks live in memory (not a real database), restarting the server
resets everything. For faster resets during a test run without restarting
the server, call the reset endpoint:

```typescript
await request.post('http://localhost:3000/api/test/reset');
```

## Example Playwright setup

```typescript
// playwright.config.ts
webServer: {
  command: 'npm start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
},
```

```typescript
await page.getByTestId("username-input").fill("admin");
await page.getByTestId("password-input").fill("password123");
await page.getByTestId("login-submit-btn").click();
await expect(page.getByTestId("welcome-message")).toContainText("admin");
```
