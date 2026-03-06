import { GoogleGenAI } from "@google/genai";
import { TradeInputs, TradeResult } from "../types";

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Gemini client init error:", error);
    return null;
  }
};

export const analyzeTradeScenario = async (
  inputs: TradeInputs,
  results: TradeResult
): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) {
    return "Gemini API key is missing. Add GEMINI_API_KEY in .env.local then restart dev server.";
  }

  try {
    const prompt = `
      تصرف كمحلل خبير في تداول العملات الرقمية و P2P (نظير لنظير).
      قم بتحليل سيناريو التداول التالي على منصة Binance P2P:

      البيانات:
      - سعر الشراء: ${inputs.buyPrice} ${inputs.currencySymbol}
      - سعر البيع: ${inputs.sellPrice} ${inputs.currencySymbol}
      - الكمية: ${inputs.amount} (Crypto Assets)
      - صافي الربح المتوقع: ${results.netProfit.toFixed(2)} ${inputs.currencySymbol}
      - نسبة هامش الربح: ${results.marginPercentage.toFixed(2)}%

      المطلوب:
      1. هل يعتبر هذا الهامش جيدًا لتداول P2P؟
      2. ما هي المخاطر المحتملة لهذا الفارق السعري (Spread)؟
      3. نصيحة قصيرة لتحسين الربحية أو تقليل المخاطر.

      أجب باللغة العربية بأسلوب احترافي ومختصر.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return response.text || "لا يمكن الحصول على تحليل في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. تحقق من المفتاح وحاول مرة أخرى.";
  }
};
