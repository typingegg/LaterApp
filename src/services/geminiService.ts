import { GoogleGenAI } from "@google/genai";
import { UserState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getVibeCheck(state: UserState) {
  const totalMonthlyContributions = state.investments.reduce((acc, i) => acc + i.monthlyContribution, 0);
  const totalMonthlyIncome = state.income.reduce((acc, inc) => acc + inc.amount, 0);
  const totalMonthlyImpacts = state.events.reduce((acc, e) => acc + e.monthlyImpact, 0);
  const totalMortgagePayments = state.mortgages.reduce((acc, m) => acc - m.monthlyPayment, 0);
  const totalMonthlyCashFlow = totalMonthlyIncome - totalMonthlyContributions + totalMonthlyImpacts + totalMortgagePayments;
  const cur = state.currency || 'units';

  const prompt = `
    You are an advanced AI financial analyst with a sleek, minimalist, and slightly witty Gen Z persona.
    Analyze this financial state (all values in ${cur}):
    Monthly Take Home Pay (Total from all income streams): ${cur}${totalMonthlyIncome}/mo
    Net Monthly Remainder (after all investments, events, and mortgages): ${cur}${totalMonthlyCashFlow}/mo
    
    Income Streams: ${state.income.map(inc => `${inc.name} (${cur}${inc.amount}/mo starting ${inc.startDate}${inc.endDate ? ` until ${inc.endDate}` : ''})`).join(', ')}
    Investments: ${state.investments.map(i => `${i.name} (${cur}${i.initialAmount} + ${cur}${i.monthlyContribution}/mo @ ${i.expectedReturn}%)`).join(', ')}
    Planned Events: ${state.events.map(e => `${e.title} (${e.occurrence}) starting ${e.startDate}${e.endDate ? ` until ${e.endDate}` : ''} (${e.occurrence === 'one-time' ? `Cost: ${cur}${e.cost}` : `Monthly: ${cur}${Math.abs(e.monthlyImpact)}`})`).join(', ')}
    Mortgages: ${state.mortgages.map(m => `${m.name} starting ${m.startDate}${m.endDate ? ` until ${m.endDate}` : ''} (Value: ${cur}${m.propertyValue}, Balance: ${cur}${m.balance}, Payment: ${cur}${m.monthlyPayment}/mo @ ${m.interestRate}%)`).join(', ')}

    Provide:
    1. A "Vibe Score" (0-100) representing their trajectory.
    2. A short, sharp analysis of their future (2 sentences max). Include an analysis of what leftovers or negatives can be done to optimize investments based on their take home pay and monthly delta.
    3. One piece of highly actionable, slightly blunt financial advice.
    
    Return as JSON:
    {
      "score": number,
      "analysis": "string",
      "advice": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      score: 50,
      analysis: "System offline. Unable to compute trajectory.",
      advice: "Maintain current holding patterns until connection is restored."
    };
  }
}
