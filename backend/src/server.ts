import "dotenv/config";
import express from "express";
import cors from "cors";
import os from "os";
import transactionRoutes from "./routes/transactions";
import tagRoutes from "./routes/tags";
import aiRoutes from "./routes/ai";
import paymentRoutes from "./routes/payments";

console.log("--- Environment Verification ---");
console.log("Server restarting...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);

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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method === "POST") {
        console.log("Body keys:", Object.keys(req.body));
    }
    next();
});

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "v3" });
});

// API Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
};

app.listen(Number(PORT), "0.0.0.0", () => {
    const localIP = getLocalIP();
    console.log(`🚀 ExpenseIQ API server running on port ${PORT}`);
    console.log(`🔗 Local access: http://localhost:${PORT}`);
    console.log(`📱 Physical device access: http://${localIP}:${PORT}`);
});

// Keep the process alive
setInterval(() => { }, 1000 * 60 * 60);

export default app;