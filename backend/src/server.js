import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { ticketsRouter } from "./routes/tickets.js";
import "./lib/db.js"; // ensures tables exist on boot

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "Healthy" }));
app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketsRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// Centralized error handler so unexpected failures never leak stack traces.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`HelpDesk Lite API listening on http://localhost:${port}`));
