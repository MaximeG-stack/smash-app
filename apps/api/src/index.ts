import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { matchesRouter } from "./routes/matches";
import { notificationsRouter } from "./routes/notifications";
import { conversationsRouter } from "./routes/conversations";
// Sprint 7+
// import { clubsRouter } from "./routes/clubs";
// import { bookingsRouter } from "./routes/bookings";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false, crossOriginOpenerPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "smashi-api", timestamp: new Date().toISOString() });
});

// Routes API
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/conversations", conversationsRouter);
// Sprint 7+
// app.use("/api/clubs", clubsRouter);
// app.use("/api/bookings", bookingsRouter);

// 404
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route introuvable" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 SMASHI API démarrée sur http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Le port ${PORT} est déjà utilisé. Lance : lsof -ti :${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw err;
});

export default app;
