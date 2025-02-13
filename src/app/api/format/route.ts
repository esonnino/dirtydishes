import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const formatPrompt = `
Format the text into a well-structured document with the following EXACT structure and markers:

<SUMMARY>
Write an extremely concise 1-2 line summary (max 25 words) that captures the key point.
</SUMMARY>

<TOC>
Create a hierarchical table of contents using proper markdown list syntax:
- Use "##" for main sections
- Use "###" for subsections
- Include page numbers [p.1] etc.
Example:
## 1. Introduction [p.1]
### 1.1 Background [p.1]
### 1.2 Objectives [p.2]
</TOC>

<CONTENT>
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

Example structure:
# Main Section
## Subsection
Content with **bold** and *emphasis*

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

### Nested Subsection
- List item 1
- List item 2
</CONTENT>

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
          content: "You are a document formatting expert. Always use the exact XML-style markers (<SUMMARY>, <TOC>, <CONTENT>) to separate sections. Keep summaries extremely concise. Use proper markdown syntax for all formatting."
        },
        {
          role: "user",
          content: formatPrompt + text
        }
      ],
      temperature: 0.1, // Very low temperature for consistent formatting
    });

    const formattedText = completion.choices[0]?.message?.content || '';
    
    // Extract sections using regex to match XML-style markers
    const summaryMatch = formattedText.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/);
    const tocMatch = formattedText.match(/<TOC>([\s\S]*?)<\/TOC>/);
    const contentMatch = formattedText.match(/<CONTENT>([\s\S]*?)<\/CONTENT>/);
    
    return NextResponse.json({
      summary: summaryMatch?.[1].trim() || '',
      tableOfContents: tocMatch?.[1].trim() || '',
      content: contentMatch?.[1].trim() || formattedText,
    });
  } catch (error) {
    console.error('Error formatting text:', error);
    return NextResponse.json(
      { error: 'Failed to format text' },
      { status: 500 }
    );
  }
} 