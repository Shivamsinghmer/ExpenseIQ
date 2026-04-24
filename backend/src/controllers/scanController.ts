import { Request, Response } from "express";
import { scanReceiptService } from "../services/scanService";

export const scanReceipt = async (req: Request, res: Response) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: "No image provided for scanning" });
        }

        console.log("[Scan] Processing receipt image...");
        const parsedData = await scanReceiptService(image);
        console.log("[Scan] Extracted data:", parsedData);

        res.json(parsedData);
    } catch (error: any) {
        console.error("Receipt Scanning Error:", error);
        res.status(500).json({ error: error.message || "Failed to scan receipt" });
    }
};
