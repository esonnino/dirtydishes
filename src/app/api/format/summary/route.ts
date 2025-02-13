import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const summaryPrompt = `
Create an extremely concise 1-2 line summary (max 25 words) that captures the key point of the following text:

Original text:
`;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a document summarization expert. Create extremely concise, focused summaries."
        },
        {
          role: "user",
          content: summaryPrompt + text
        }
      ],
      temperature: 0.1,
    });

    const summary = completion.choices[0]?.message?.content || '';
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error creating summary:', error);
    return NextResponse.json(
      { error: 'Failed to create summary' },
      { status: 500 }
    );
  }
} 