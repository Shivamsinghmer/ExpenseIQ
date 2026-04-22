import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const scanReceiptService = async (base64Image: string) => {
    try {
        // Ensure the base64 has the correct data URI prefix if it doesn't already
        const imageDataUri = base64Image.startsWith("data:") 
            ? base64Image 
            : `data:image/jpeg;base64,${base64Image}`;

        const systemPrompt = `
            You are a professional financial document scanner. Analyze the provided image.
            
            CLASSIFICATION RULES:
            1. If the image is a SINGLE RECEIPT: Extract ONLY the final bill amount and merchant.
            2. If the image is a BANK STATEMENT: Extract ALL individual transactions listed.

            Extraction Details for each transaction:
            - amount: The numerical value (e.g., 150.00).
            - merchant: The name of the merchant or description (e.g., "Starbucks", "Amazon").
            - type: "EXPENSE" (for spending) or "INCOME" (for deposits/salary).
            - currency: The currency (e.g., "INR", "USD").
            - category: Suggest a simple category (Food, Shopping, Transport, Rent, Bills, Health, Travel, Fun, Education, Gifts, Invest, Salary, Other).

            Return ONLY a valid JSON object with the following structure:
            {
                "documentType": "RECEIPT" | "STATEMENT",
                "transactions": [
                    { "amount": 100.50, "merchant": "Merchant Name", "date": "2024-03-22", "type": "EXPENSE", "currency": "INR", "category": "Food" },
                    ...
                ]
            }
            Do not include any thinking tags, markdown, or extra text.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this document and return the transaction data as JSON." },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUri,
                            },
                        },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 1000,
        });

        const result = chatCompletion.choices[0]?.message?.content;
        console.log("[ScanService] Raw Groq Result:", result);
        
        if (!result) throw new Error("No response from Groq");

        // Clean potentially markdown-wrapped JSON
        const cleanResult = result.replace(/```json\n?|\n?```/g, "").trim();
        
        try {
            return JSON.parse(cleanResult);
        } catch (parseError) {
            console.error("[ScanService] JSON Parse Error:", parseError);
            console.log("[ScanService] Attempting to find JSON block...");
            
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Failed to parse transaction data from AI response");
        }
    } catch (error: any) {
        console.error("Groq Vision Error:", error);
        throw new Error(error.message || "Failed to communicate with Vision AI");
    }
};
