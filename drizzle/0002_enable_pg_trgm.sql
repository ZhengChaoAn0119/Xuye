-- Trigram matching for Chinese title/author search (the built-in full-text parser does not segment CJK).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
