import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const suggestionsPrompt = `
Analyze the following selected text and provide EXACTLY 3 most relevant suggestions.
Consider these factors when generating suggestions:
1. Text length and complexity
2. Content type (code, prose, list, etc.)
3. Most valuable improvements for the user

For each suggestion:
- Title should be a clear action (max 30 chars)
- Description should explain the benefit (max 50 chars)
- Type should be one of: improve, analyze, transform

Return EXACTLY these 3 suggestions based on the text type:

For prose/documentation:
1. "Improve clarity" - For making text more concise and clear
2. "Fix tone & grammar" - For improving writing style and correctness
3. "Generate summary" - For understanding key points

For code/technical content:
1. "Add documentation" - For improving code clarity
2. "Optimize code" - For improving performance/structure
3. "Find issues" - For identifying potential problems

For lists/structured content:
1. "Convert to table" - For better data organization
2. "Add categories" - For improved structure
3. "Expand details" - For more comprehensive content

Return your response in this exact JSON format:
{
  "suggestions": [
    {
      "title": "Action-oriented title",
      "description": "Clear benefit to the user",
      "type": "one of the specified types"
    }
  ]
}

Selected text:`;

export async function POST(request: Request) {
  // Add CORS headers
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing text' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing text and providing consistent, valuable suggestions for improvements. Always return exactly 3 suggestions that would be most helpful for the given text type."
        },
        {
          role: "user",
          content: suggestionsPrompt + "\n\n" + text
        }
      ],
      temperature: 0.1, // Very low temperature for consistent results
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // Ensure exactly 3 suggestions
      if (!parsedResponse.suggestions || 
          !Array.isArray(parsedResponse.suggestions) || 
          parsedResponse.suggestions.length !== 3) {
        return NextResponse.json({
          suggestions: [
            {
              title: "Improve clarity",
              description: "Make the text more clear and concise",
              type: "improve"
            },
            {
              title: "Fix tone & grammar",
              description: "Enhance writing style and correctness",
              type: "improve"
            },
            {
              title: "Generate summary",
              description: "Create a concise summary of key points",
              type: "analyze"
            }
          ]
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      return NextResponse.json(parsedResponse, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return NextResponse.json({
        suggestions: [
          {
            title: "Improve clarity",
            description: "Make the text more clear and concise",
            type: "improve"
          },
          {
            title: "Fix tone & grammar",
            description: "Enhance writing style and correctness",
            type: "improve"
          },
          {
            title: "Generate summary",
            description: "Create a concise summary of key points",
            type: "analyze"
          }
        ]
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
} 