import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const tocPrompt = `
Create a hierarchical table of contents for the following text using proper markdown list syntax:
- Use "##" for main sections
- Use "###" for subsections
- Include page numbers [p.1] etc.

Example:
## 1. Introduction [p.1]
### 1.1 Background [p.1]
### 1.2 Objectives [p.2]

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
          content: "You are a document structuring expert. Create clear, hierarchical tables of contents."
        },
        {
          role: "user",
          content: tocPrompt + text
        }
      ],
      temperature: 0.1,
    });

    const tableOfContents = completion.choices[0]?.message?.content || '';
    
    return NextResponse.json({ tableOfContents });
  } catch (error) {
    console.error('Error creating table of contents:', error);
    return NextResponse.json(
      { error: 'Failed to create table of contents' },
      { status: 500 }
    );
  }
} 