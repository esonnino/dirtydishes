import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check if the API key is available
const apiKey = process.env.OPENAI_API_KEY;
const isDemo = !apiKey;
const isProjectKey = apiKey?.startsWith('sk-proj-');

// Log configuration state for debugging
console.log(`OpenAI API Configuration - Demo mode: ${isDemo}`);
if (apiKey) {
  console.log(`API Key format: ${apiKey.substring(0, 10)}... (key type: ${isProjectKey ? 'Project' : 'Standard'})`);
}

// Initialize OpenAI client with proper configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  
  // Project keys may require specific organization settings
  ...(isProjectKey && {
    organization: process.env.OPENAI_ORG_ID, // Add this to .env if needed
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', // May need custom URL for project keys
  })
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt } = body;

    // Validate input
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Received prompt:', prompt);

    // Handle demo mode with simulated response
    if (isDemo) {
      console.log('Running in demo mode - simulating OpenAI response');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Extract the actual prompt text from the full prompt
      const promptText = prompt.includes('Prompt:') 
        ? prompt.split('Prompt:')[1].split('\n')[0].trim() 
        : prompt;
      
      // Return simulated response
      return NextResponse.json({
        text: `
          <div>
            <p><strong>Demo Response</strong></p>
            <p>This is a simulated response. In production, this would be generated by OpenAI using your API key.</p>
            <p>Prompt received: "${promptText}"</p>
            <p>To use the real OpenAI API, please add your API key to the environment variables.</p>
            <hr/>
            <p>Here's what the full prompt included:</p>
            <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; max-height: 150px; overflow-y: auto; font-size: 12px;">${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        `,
      });
    }

    // Make actual OpenAI API call with improved error handling
    try {
      console.log('Attempting to call OpenAI API with provided key');
      
      // For project keys, we might need to use a different model naming convention
      const modelName = isProjectKey ? 
        (process.env.OPENAI_MODEL_NAME || 'gpt-4') : // Use environment variable if available
        'gpt-4';
        
      console.log(`Using model: ${modelName}`);
        
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping with text generation in an editor. Your response should be focused, well-formatted, and directly address the user\'s prompt. Format your response with HTML paragraphs using <p> tags for clarity.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message.content || 'No response generated';
      console.log('OpenAI response received successfully');

      // Return the response
      return NextResponse.json({
        text: `<div>${responseText}</div>`,
      });
    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError);
      console.error('Error details:', apiError.message);
      
      // Return a more specific error for API issues
      return NextResponse.json({
        text: `
          <div>
            <p><strong>Error connecting to OpenAI</strong></p>
            <p>There was an issue with the OpenAI API call. This may be due to:</p>
            <ul>
              <li>API key format or authentication issue</li>
              <li>Rate limiting or quota exceeded</li>
              <li>Network connectivity problems</li>
            </ul>
            <p>Error details: ${apiError.message}</p>
            <p>Note: Your API key starts with "sk-proj-", which might require additional configuration.</p>
          </div>
        `,
      });
    }
  } catch (error: any) {
    console.error('Error in AI prompt API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 