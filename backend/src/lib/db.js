import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const dbPath = process.env.DB_PATH || "./data/helpdesk.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema mirrors src/lib/types.ts on the frontend exactly, so the API
// can be dropped in behind the existing UI with minimal changes.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Employee','Support Agent','Manager')),
  initials TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  assigneeId TEXT REFERENCES users(id),
  requestedById TEXT NOT NULL REFERENCES users(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  resolvedAt TEXT,
  slaDeadline TEXT NOT NULL,
  aiSuggestedPriority TEXT,
  aiSuggestedCategory TEXT,
  aiReason TEXT
);

CREATE TABLE IF NOT EXISTS ticket_events (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('system','note'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assigneeId);
CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requestedById);
CREATE INDEX IF NOT EXISTS idx_events_ticket ON ticket_events(ticketId);
`);
