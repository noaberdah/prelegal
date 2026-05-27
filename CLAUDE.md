# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation is an AI-chat-driven Mutual NDA drafter (frontend chat + live preview, backend LLM endpoint, auth routes). The remaining document types and document/chat persistence are not yet implemented.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b:free` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-2)
- Common Paper legal templates added under `templates/`
- All 11 document types referenced in `catalog.json`

### Completed (PL-3)
- Next.js frontend prototype under `frontend/`
- Mutual NDA form page with field inputs, live preview, and PDF download

### Completed (PL-4)
- Multi-stage Dockerfile (Node builds the Next.js static export, Python serves it)
- FastAPI backend (uv project) with SQLite recreated on every container start
- `users` table; auth routes (signup, signin, signout, me) using bcrypt + JWT in an HttpOnly cookie
- Next.js static export served by FastAPI at `http://localhost:8000`
- Start/stop scripts for Mac, Linux, Windows under `scripts/`
- 15 backend tests covering health, auth flows, and the static mount

### Completed (PL-5)
- AI chat replaces the static NDA form. Chat panel + live preview side-by-side.
- `POST /api/chat` (FastAPI router) calls LiteLLM via OpenRouter to the Cerebras-routed `gpt-oss-120b:free` model with a Pydantic structured-output schema (`ChatTurn` with `assistant_message`, `extracted_fields`, `document_ready`).
- `OPENROUTER_API_KEY` is loaded from the project-root `.env` (via `python-dotenv`); start scripts pass `--env-file` to Docker.
- 5 new backend tests for chat (stubbing `litellm.completion`) — 20 backend tests total.
- v1 chat is in-memory only; no auth gate; document persistence is still PL-7 territory.
- Verified end-to-end against live OpenRouter: the AI extracts multiple fields from a batched user reply and asks coherent follow-ups.
- Gotcha: OpenRouter rejects `reasoning_effort` by default — `litellm.completion` must be called with `allowed_openai_params=["reasoning_effort"]` to forward it through to Cerebras.

### Not Yet Implemented
- Support for the non-NDA document types (PL-6)
- Frontend auth UI and document persistence (PL-7)
- `/api/documents/*` endpoints

## Current API Endpoints
- `GET  /api/health` — Health check
- `POST /api/auth/signup` — Create user; sets `prelegal_auth` cookie
- `POST /api/auth/signin` — Sign in; sets `prelegal_auth` cookie
- `POST /api/auth/signout` — Clear auth cookie
- `GET  /api/auth/me` — Get current user (requires cookie)
- `POST /api/chat` — Send chat history + current fields, returns `{assistant_message, extracted_fields, document_ready}`. 503 if `OPENROUTER_API_KEY` is unset.

## Current State (as of PL-5 merge)
- Run: `scripts/start-{mac,linux,windows}.{sh,ps1}` — stop with the matching `stop-` script
- Container `prelegal-app` listens on port 8000
- SQLite lives at `/tmp/prelegal.db` inside the container; wiped on each start
- Backend tests: `cd backend && uv run pytest` (or `.\.venv\Scripts\pytest.exe` on Windows)
- The frontend served at `/` is the Mutual NDA chat from PL-5; non-NDA documents and auth UI land in PL-6/7