BEGIN;
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pages INTEGER NOT NULL CHECK (pages > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page INTEGER NOT NULL CHECK (page > 0),
    text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks(document_id);
COMMIT;
