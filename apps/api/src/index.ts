import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

// TODO: Importer les routes au fur et à mesure
// import { authRouter } from "./routes/auth";
// import { usersRouter } from "./routes/users";
// import { matchesRouter } from "./routes/matches";
// import { clubsRouter } from "./routes/clubs";
// import { bookingsRouter } from "./routes/bookings";
// import { notificationsRouter } from "./routes/notifications";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*" }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "smashi-api", timestamp: new Date().toISOString() });
});

// Routes API
// app.use("/api/auth", authRouter);
// app.use("/api/users", usersRouter);
// app.use("/api/matches", matchesRouter);
// app.use("/api/clubs", clubsRouter);
// app.use("/api/bookings", bookingsRouter);
// app.use("/api/notifications", notificationsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

app.listen(PORT, () => {
  console.log(`🚀 SMASHI API démarrée sur http://localhost:${PORT}`);
});

export default app;
