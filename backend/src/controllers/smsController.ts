import { Request, Response } from "express";
import { parseSMSService } from "../services/smsService";

export const parseSMS = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "No text provided for parsing" });
        }

        const parsedData = parseSMSService(text);

        res.json(parsedData);
    } catch (error: any) {
        console.error("SMS Parsing Error:", error);
        res.status(500).json({ error: "Failed to parse SMS" });
    }
};
