# Tickets

A self-hosted, lightweight, Evernote-style task-note app for a Tech Lead to
track team task notes and details.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL
- **Editor:** TipTap rich-text editor with paste / drag-and-drop image uploads
- **Auth:** Single-user login against `APP_USERNAME` / `APP_PASSWORD`, cookie session, route-protecting middleware
- **Runs on port `30002`**
- **Current version:** `v0.2.0`

## Layout

Two-column split (Evernote style):

- **Left sidebar** — notes sorted by `updatedAt` desc, with title, assignee, status badge, and per-note delete. Includes a `+ New Note` button.
- **Main area** — the selected note, fully editable:
  - Title (inline), Assignee, Status (`OPEN` / `IN_PROGRESS` / `DONE`), Start date, Due date
  - Rich-text content editor (bold, italic, headings, lists, quotes, code, links, images)
  - Auto-save on change/blur (debounced) plus an explicit **Save** button

## Database schema (Prisma)

```
enum TaskStatus { OPEN, IN_PROGRESS, DONE }

model Note { id, title, assignee, status, startDate, dueDate, content, images[], createdAt, updatedAt }
model NoteImage { id, noteId->Note(onDelete: Cascade), mimeType, data(Bytes), createdAt }
```

Deleting a Note cascades to its `NoteImage` rows.

## API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/login` | Single-user login, sets session cookie |
| `POST` | `/api/logout` | Destroy session |
| `GET`  | `/api/notes` | List all notes (sidebar) |
| `POST` | `/api/notes` | Create a new empty note |
| `GET`  | `/api/notes/[id]` | Fetch a note (with image refs) |
| `PATCH`| `/api/notes/[id]` | Update fields / content |
| `DELETE` | `/api/notes/[id]` | Delete a note (cascade) |
| `POST` | `/api/images?noteId=` | Upload image (raw body) → `{ id, url }` |
| `GET`  | `/api/images/[id]` | Stream an image |

All routes except `/api/login` are protected by `middleware.ts`.

## Local development

```bash
cp .env.example .env       # fill in DATABASE_URL, APP_USERNAME, APP_PASSWORD, SESSION_SECRET
npm install
npx prisma migrate deploy  # apply schema
npm run dev                # http://localhost:30002
```

## Docker

```bash
docker build -t ghcr.io/rifi331/tickets:v0.2.0 .
docker run -p 30002:30002 \
  -e DATABASE_URL="postgresql://..." \
  -e APP_USERNAME=admin \
  -e APP_PASSWORD=secret \
  -e SESSION_SECRET="long-random-32+chars" \
  ghcr.io/rifi331/tickets:v0.2.0
```

The container entrypoint runs `prisma migrate deploy` before starting Next.js.

## CI

`.github/workflows/deploy-ghcr.yml` builds the image on every push to `main`
and publishes to `ghcr.io/rifi331/tickets:v0.2.0` (and `:latest`).

## Versioning

- `0.1.x` — bug fixes
- `0.2.x` — new features
