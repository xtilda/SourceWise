# Sourcewise

A local document evidence assistant built with FastAPI. Upload text-based PDFs, ask questions, and inspect exact passages with document names and original PDF page numbers.

## Why this project?

Document assistants should make answers reviewable. Sourcewise preserves page metadata during chunking and verifies every model-selected quotation against retrieved text. It includes a usable browser interface, persistent document storage, API tests, a retrieval benchmark, and Docker packaging.

## Interface

A responsive research workspace with a document library, drag-and-drop PDF upload, selectable document scope, source cards, citation copying, live library statistics, server timing, keyboard submission, and a built-in guide. UI content is rendered through text nodes. Desktop and mobile browser checks cover layout and basic offline interactions; live provider integration requires credentials.

## Features

- PDF upload, library listing, document filtering, and deletion.
- Page-preserving chunks and BM25-style lexical retrieval.
- Exact quotations with document name and page number.
- No-match responses and visible model failures.
- Extractive mode without API keys; optional local Ollama evidence selection.
- SQLite for local use or PostgreSQL for hosted persistence, FastAPI OpenAPI docs, GitHub Actions, and 25 evaluation cases.

## Deploy on Vercel


## Quick start — Python 3.12

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1`.

Open http://localhost:8000. Upload a PDF containing selectable text and ask a question using words from the document. API documentation is at http://localhost:8000/docs.

## Optional local LLM

Install Ollama and download a model:

```bash
ollama pull qwen2.5:3b
ANSWER_MODE=ollama OLLAMA_MODEL=qwen2.5:3b uvicorn app.main:app --reload
```

Ollama must be running. `OLLAMA_URL` defaults to `http://localhost:11434`. The model selects exact evidence rather than writing unverified summaries. Invalid quotations are discarded. An unavailable model returns HTTP 502; it is not silently replaced with extractive output.

In PowerShell, set `$env:ANSWER_MODE="ollama"` and `$env:OLLAMA_MODEL="qwen2.5:3b"` before starting Uvicorn.

## Docker

```bash
docker compose up --build
```

The service binds to localhost:8000. SQLite data persists in the named volume. Default Docker mode is extractive. For Ollama mode, enable `ANSWER_MODE=ollama` and ensure the host Ollama server accepts connections from Docker; its default loopback binding may need adjustment. Restrict any expanded binding to trusted local networks.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/documents` | Upload PDF multipart field `file` |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/{id}` | Remove document and text chunks |
| POST | `/api/ask` | Retrieve evidence for `question` and optional `document_ids` |
| GET | `/health` | Liveness |

```bash
curl -F 'file=@document.pdf' http://localhost:8000/api/documents
curl -H 'Content-Type: application/json' -d '{"question":"What is the refund policy?"}' http://localhost:8000/api/ask
```

## Architecture

PDF → page text → overlapping character chunks → SQLite → lexical ranking → extractive or local model evidence selection → validated quotations with page citations.

`app/core.py` contains ingestion and retrieval. `app/main.py` exposes the API. `app/static/index.html` provides the Turkish browser interface. The interface uses text nodes to render uploaded content rather than injecting HTML.

## Validation

```bash
pip install -r requirements-dev.txt
python -m pytest -q
python -m evaluation.run
```

The benchmark has 20 single-fact English questions and 5 no-match queries. It checks the top retrieved page and verified quote, and reports median retrieval latency. These synthetic results are a regression baseline, not a real-world accuracy claim. Add independently written, multi-document paraphrase cases before reporting answer quality.

## Limits and next steps

- Lexical retrieval is not embedding-based semantic search. Turkish questions can be entered, but Turkish morphology and cross-language retrieval are not evaluated.
- `evidence_found` means relevant keyword passages were retrieved; it does not guarantee a complete answer. Exact source verification prevents invented quotations, not misleading selection or wrong interpretation.
- This version returns evidence passages, not free-form generated answers. Next: evaluated semantic retrieval, reranking, and claim-level cited synthesis.
- Text-only PDFs; no OCR. Limit: 10 MB locally, 4 MB on Vercel, and 200 pages per upload.
- The configured database stores extracted text and metadata, not original PDFs. Page numbers refer to physical PDF pages, not printed labels.
- Shared-password authentication is available and required on Vercel. No tenant isolation, login rate limiting, or per-user quotas. PDF parsing is in-process; a public service needs parser isolation, quotas, and resource limits.
- Ollama requests receive retrieved document text. Default extractive mode uses no external model service.
- Dependencies use bounded ranges, not a reproducible lockfile.

## References

- FastAPI uploads: https://fastapi.tiangolo.com/tutorial/request-files/
- FastAPI testing: https://fastapi.tiangolo.com/tutorial/testing/
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md

## PostgreSQL integration tests

Set `TEST_DATABASE_URL` to a disposable test database and run `python -m pytest -q`. The integration test applies the schema, uploads a generated PDF, checks persistence and page retrieval through separate connections, and deletes its test document. GitHub Actions provisions PostgreSQL for this test. CI has not been executed during artifact preparation.


## Hybrid retrieval upgrade

Sourcewise now supports BM25 keyword search, semantic cosine search, and reciprocal-rank fusion (RRF, k=60) of the top 20 rankings. OpenAI `text-embedding-3-small` embeddings use 512 dimensions and are persisted alongside chunks, tagged by model/dimension. Indexing is explicit: upload a document, then choose **Index for AI**. It sends extracted text to OpenAI. All selected documents must be indexed; missing indexes produce a visible error rather than silently downgrading retrieval.

The semantic search implementation scans vectors in Python, intended for small workspaces (2,000 selected chunks maximum). Each indexed document is limited to 100 chunks, one bounded provider request. A configurable cosine threshold (`SEMANTIC_MIN_SCORE`, default 0.3) filters candidates; this heuristic is not a guarantee of relevance. Model changes require reindexing. Deletion cascades to embeddings.

Set `ANSWER_MODE=openai` for a generated answer displayed beside original page excerpts. The model must return exact quotes and valid retrieved IDs; invalid quotations are rejected. Quote validation proves textual presence, **not** that every generated claim is entailed. Inspect the evidence before relying on the synthesis. Default extractive mode remains usable without an API key.

### Evaluation

```bash
python -m pytest -q
python -m evaluation.run
python -m evaluation.hybrid --method lexical
# Calls the paid embedding API when OPENAI_API_KEY is configured:
python -m evaluation.hybrid --method hybrid
```

`evaluation/hybrid.py` contains 10 author-labelled synthetic paraphrase queries and reports Recall@4 and MRR@4. `paraphrase-lexical.json` records the offline baseline. Live semantic/answer quality was not measured without credentials; synthetic vector tests validate ranking mechanics, not model quality. Provider payloads and output validation are tested with mock HTTP responses. PostgreSQL integration runs in CI and is skipped locally unless a disposable TEST_DATABASE_URL is configured.

Existing Neon installs must run `migrations/002_embeddings.sql` before indexing. See the new section in VERCEL_KURULUM.md.
