export const parseSMSService = (text: string) => {
    // 1. CLEANING
    let cleanText = text.replace(/[\n\r]/g, " ").replace(/\s\s+/g, " ");

    // 2. EXTRACTION PILLARS
    let amount: number | null = null;
    let merchant: string = "Unknown Merchant";
    let type: "DEBIT" | "CREDIT" = "DEBIT";
    let currency: string = "INR";

    // --- AMOUNT REGEX (Global Support) ---
    // Matches symbols like ₹, $, Rs., INR, USD, EUR, €, GBP, £, AED, JPY, etc.
    const amountRegex = /(?:Rs\.?|INR|₹|USD|\$|EUR|€|GBP|£|AED|SAR|SGD|JPY|¥|OMR|KWD)\s?(\d+(?:,\d+)*(?:\.\d+)?)/i;
    const amountMatch = cleanText.match(amountRegex);
    if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ""));
        
        // Identify currency from symbol
        const symbol = amountMatch[0].match(/(?:Rs\.?|INR|₹|USD|\$|EUR|€|GBP|£|AED|SAR|SGD|JPY|¥|OMR|KWD)/i)?.[0];
        if (symbol) {
            const sym = symbol.toUpperCase();
            if (sym === "$" || sym === "USD") currency = "USD";
            else if (sym === "€" || sym === "EUR") currency = "EUR";
            else if (sym === "£" || sym === "GBP") currency = "GBP";
            else if (sym === "₹" || sym === "INR" || sym === "RS" || sym === "RS.") currency = "INR";
            else currency = sym;
        }
    }

    // --- MERCHANT REGEX ---
    // Looks for common merchant indicators: "at", "to", "vpa", "merch:", etc.
    const merchantPatterns = [
        // Axis / UPI Deep Paths: upi/332156821364/PhonePe/Amazon@ybl/Amazon
        /upi\/[^/]+\/[^/]+\/[^/]+\/([^/\s]+)/i,
        /upi\/[^/]+\/[^/]+\/([^/\s]+)/i,
        /(?:at|to|merch:|vpa:|thru|purchased at|paid to|spent on|transferred to|sent to)\s*([A-Za-z0-9\s._-]+?)(?:\s*(?:on|using|via|for|ref|is|from|\d)|$|\.|\?)/i,
        /([A-Za-z0-9\s._-]+?)\s+(?:debit|spent|charged)/i,
        /Account\s+\w+\s+debited\s+for\s+([A-Za-z0-9\s._-]+?)\s+/i
    ];

    for (const pattern of merchantPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            const candidate = match[1].trim();
            // Filter out common noise words
            if (!["a", "an", "the", "rs", "inr", "is", "for"].includes(candidate.toLowerCase()) && candidate.length > 2) {
                merchant = candidate;
                break;
            }
        }
    }

    // --- TYPE REGEX (Debit vs Credit) ---
    const creditKeywords = ["credit", "received", "added", "deposited", "refund"];
    const isCredit = creditKeywords.some(keyword => cleanText.toLowerCase().includes(keyword));
    if (isCredit) {
        type = "CREDIT";
    }

    return {
        amount: amount || 0,
        title: merchant === "Unknown Merchant" ? "New Transaction" : merchant,
        type,
        currency,
        date: new Date().toISOString()
    };
};
