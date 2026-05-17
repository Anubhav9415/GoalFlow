import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { goals, role, userName } = await req.json();

  const systemPrompt = `You are a helpful and encouraging performance coach inside an enterprise HR portal. 
Your tone is professional, concise, and motivating.
Generate a 2-3 sentence AI insight based on the user's goal data.
Be specific. Mention actual goals and numbers. End with one actionable recommendation.
Do NOT use markdown. Write plain text only.`;

  const userPrompt = `Generate a performance insight for ${userName || "the user"} (Role: ${role || "Employee"}).

Their current goals and status:
${JSON.stringify(goals, null, 2)}

Provide a brief, actionable, motivating insight in 2-3 sentences.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 200,
    });

    const insight = completion.choices[0]?.message?.content || "Keep up the great work!";
    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Groq insights error:", error);
    return NextResponse.json(
      { insight: "You are making great progress! Keep focusing on your top-priority goals this quarter." },
      { status: 200 }
    );
  }
}
