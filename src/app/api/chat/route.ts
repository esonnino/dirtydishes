import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const getSystemPrompt = (editorContent?: string, selectedText?: string) => {
  let prompt = `You are Rovo, a helpful AI assistant that helps users with their tasks.
You are direct, clear, and friendly in your responses.
Keep your responses concise and focused on the user's query.
If you're helping with code, provide specific, actionable suggestions.`;

  if (selectedText) {
    prompt += `\n\nThe user has referenced this specific text:
\`\`\`
${selectedText}
\`\`\`

Focus your response specifically on this referenced text. If the user asks for modifications (like translation, formatting, etc), only apply them to this specific text.`;
  } else if (editorContent) {
    prompt += `\n\nCurrent editor content for context:
\`\`\`
${editorContent}
\`\`\`

Use this context to provide more relevant and specific assistance. When suggesting changes, be specific about where and how to make them.`;
  }

  return prompt;
};

export async function POST(request: Request) {
  try {
    const { messages, editorContent, selectedText } = await request.json();
    
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const apiMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: getSystemPrompt(editorContent, selectedText)
      },
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: apiMessages,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 