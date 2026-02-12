import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroqClient(): Groq {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: GROQ_API_KEY is missing from environment variables!");
            throw new Error("GROQ_API_KEY is not configured. Please check your .env file.");
        }
        groq = new Groq({ apiKey });
    }
    return groq;
}

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
        const client = getGroqClient();

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: `USER'S FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}

USER'S QUESTION: ${question}

Provide a helpful, fact-based response using ONLY the data above.`,
                },
            ],
            model: "qwen/qwen3-32b",
            temperature: 0.1,
            max_tokens: 1024,
            top_p: 0.8,
            stream: false,
        });

        const rawContent = completion.choices[0]?.message?.content || "I couldn't generate a response.";

        // Strip <think>...</think> tags and their content
        const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        return cleanContent;
    } catch (error: any) {
        console.error("Groq API error details:", {
            message: error.message,
            name: error.name,
            status: error.status,
            code: error.code
        });
        throw new Error(`Failed to generate AI response: ${error.message}`);
    }
}

export default { getAIResponse };
