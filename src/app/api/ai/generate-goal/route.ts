import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { idea, thrustAreas } = await req.json();

  if (!idea) {
    return NextResponse.json({ error: "Goal idea is required" }, { status: 400 });
  }

  const systemPrompt = `You are an expert enterprise performance management coach. 
Your job is to transform vague goal ideas into precise, SMART goals for an enterprise Goal Tracking Portal.

IMPORTANT: Always respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text.

The JSON must follow this exact structure:
{
  "title": "Short, action-oriented goal title (max 10 words)",
  "description": "Detailed 2-3 sentence description explaining the goal, its importance, and how success will be measured.",
  "thrustArea": "One of: Revenue Growth, Customer Satisfaction, Operational Efficiency, People Development, Innovation, Quality",
  "uomType": "One of: Percentage, Number, Score, Currency, Time (in days/hours), Boolean (Yes/No)",
  "target": "A specific numeric target (just the number, e.g. 95)",
  "targetUnit": "Unit for the target, e.g. %, hours, score",
  "weightage": 20
}`;

  const userPrompt = `Transform this vague goal idea into a precise SMART enterprise goal:

"${idea}"

${thrustAreas ? `Available thrust areas: ${thrustAreas.join(', ')}` : ''}

Remember: Respond ONLY with the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    
    // Strip markdown code blocks if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const goal = JSON.parse(cleaned);

    return NextResponse.json({ goal });
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { error: "Failed to generate goal. Please try again." },
      { status: 500 }
    );
  }
}
