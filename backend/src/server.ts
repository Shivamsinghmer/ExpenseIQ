import "dotenv/config";
import express from "express";
import cors from "cors";
import transactionRoutes from "./routes/transactions";
import tagRoutes from "./routes/tags";
import aiRoutes from "./routes/ai";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));

// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 ExpenseIQ API server running on port ${PORT} (accessible at http://10.118.246.39:${PORT})`);
});

// Keep the process alive
setInterval(() => { }, 1000 * 60 * 60);

export default app;
