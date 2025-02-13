import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const contentPrompt = `
Format the main content following these rules:
1. Use proper markdown heading hierarchy:
   # for main sections (H1)
   ## for subsections (H2)
   ### for nested subsections (H3)

2. Format data into tables using this structure:
   | Header 1 | Header 2 |
   |----------|----------|
   | Content  | Content  |

3. Use markdown syntax for:
   - Bold: **important text**
   - Emphasis: *emphasized text*
   - Lists: proper indentation with "-" or "1."
   - Blockquotes: > for important callouts
   - Links: [text](url)

4. Convert:
   - Names to @mentions
   - Dates to smart format (Q2 2024)
   - Long lists to tables
   - Bullet points to structured sections

5. Add clear section breaks with "---" between major sections

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
          content: "You are a document formatting expert. Format content with clear hierarchy and structure."
        },
        {
          role: "user",
          content: contentPrompt + text
        }
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error formatting content:', error);
    return NextResponse.json(
      { error: 'Failed to format content' },
      { status: 500 }
    );
  }
} 