import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 1024,
    },
});

const SYSTEM_PROMPT = `You are a precise financial assistant for ExpenseIQ. Your ONLY job is to analyze the user's financial data that is provided to you.

STRICT RULES:
1. NEVER invent, estimate, or assume financial values
2. ONLY use the data provided in the context
3. If the data is insufficient to answer, say so clearly
4. Refuse any non-financial questions politely
5. Keep answers concise, clear, and actionable
6. Use bullet points or simple formatting when listing data
7. Always mention the time period when discussing amounts
8. Show all currency amounts in Indian Rupees (₹) with 2 decimal places

When presenting data:
- Use bullet points for lists
- Bold key numbers
- Be specific about date ranges
- Compare values when relevant`;

export async function getAIResponse(
    question: string,
    financialData: Record<string, unknown>
): Promise<string> {
    try {
        const prompt = `${SYSTEM_PROMPT}

USER'S FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}

USER'S QUESTION: ${question}

Provide a helpful, fact-based response using ONLY the data above.`;

        const result = await model.generateContent(prompt);
        const response = result.response;

        // Safety check: check if the response was blocked
        if (response.candidates && response.candidates[0]?.finishReason === "SAFETY") {
            return "I'm sorry, I can't answer that because it was flagged by safety filters. Please try asking a different financial question.";
        }

        return response.text();
    } catch (error: any) {
        console.error("Gemini API error:", error);
        // Log more details if available
        if (error.response?.data) {
            console.error("Error details:", JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to generate AI response: ${error.message}`);
    }
}

export default { getAIResponse };
