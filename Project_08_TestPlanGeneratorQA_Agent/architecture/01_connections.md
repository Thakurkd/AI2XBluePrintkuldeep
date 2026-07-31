# SOP 01 — Connections

**Goal:** let a user add a Jira / ADO / X-Ray connection on the fly, prove it
works by naming the account behind it, and never expose a credential to the
browser.

**Owner:** `tools/connectors/*`, `POST /api/connections/test`
**Law:** `gemini.md` invariants 2, 4, 9.

---

## Inputs

`Connection` (`gemini.md` §2.1). The UI may send a partial object; anything absent
falls back to the server's `.env` for that request only. This is the mechanism
that makes "add a connection on the fly" safe: the browser can override the site
URL and project key without ever holding the token.

## The one interface

Every provider implements this. Provider-specific logic never leaks past its own
file.

```ts
interface WorkItemConnector {
  kind: ConnectionKind;
  verify(): Promise<Identity>;                       // must name a real account
  fetchById(id: string, opts: FetchOpts): Promise<WorkItem[]>;
  listProjects?(): Promise<{ key: string; name: string }[]>;
  comment?(key: string, markdown: string): Promise<ShareRecord>;
  attach?(key: string, filename: string, body: string): Promise<ShareRecord>;
}

interface Identity { ok: true; displayName: string; email?: string; baseUrl: string; accountId?: string }
interface FetchOpts { includeLinked: boolean; maxLinked: number }
```

## Auth per provider

| Provider | Mechanism | Verify call |
| --- | --- | --- |
| Jira Cloud | Basic `base64(email:apiToken)` | `GET /rest/api/3/myself` → `displayName` |
| Azure DevOps | Basic, empty username, PAT as password | `GET /_apis/connectionData?api-version=7.1` → authenticated user **⚠ verify** |
| X-Ray Cloud | `POST /api/v2/authenticate {client_id, client_secret}` → bearer JWT | a trivial GraphQL query **⚠ verify** |

## The Test Connection contract

`ok: true` is not a result. The endpoint returns the identity the credential
resolves to, and the UI prints it:

> Connected to `singhkd332.atlassian.net` as **Kd Singh** (singhkd332@gmail.com)

Rationale: a token can be valid and still point at the wrong site or the wrong
account, which produces a confusing empty result three screens later. Naming the
account catches that immediately.

On success the client stamps `verifiedAt` and `verifiedAs`. **Only a successful
verify may set them** — never a save, never an optimistic write.

## Error taxonomy

Translate, never forward raw. Each message names the field to fix.

| Status | Message |
| --- | --- |
| 401 | "Jira rejected the credentials. Check the email and API token." |
| 403 | "Jira accepted the credentials but denied access to this project. The account lacks permission." |
| 404 | "Jira returned 404. Check the site URL points at your site root, e.g. `https://acme.atlassian.net`." |
| `ENOTFOUND` / `ECONNREFUSED` | "Cannot reach `<host>`. Check the URL and your network." |
| timeout | "`<host>` did not respond in 30s." |

## Edge cases

- **Trailing slash** on `baseUrl` produces `//rest/api/...` and a 404. Strip
  trailing slashes on the way in.
- **Missing scheme** — `acme.atlassian.net` fails opaquely. Reject with a message
  naming the required `https://` rather than guessing a scheme.
- **`.env` present, UI blank** — the common case. Blank means "use the server
  value", never "clear the value".
- **Two connections of the same kind** (staging + prod Jira) must both be
  storable; `connectionId` on the `WorkItem` records which one an item came from,
  because the same key exists in both with different content.

## Learnings

*(Append as Phase 2 handshakes teach us things. Every entry here is an error that
must never repeat — `gemini.md` §Self-annealing.)*
