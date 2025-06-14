import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { companyKnowledge } from '@/data/company-knowledge';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Format the user's question with company context and structured prompt
function createStructuredPrompt(userQuestion: string) {
  // Convert company knowledge to a string format
  const companyContext = `
Company Information:
${JSON.stringify(companyKnowledge.company, null, 2)}

Products/Services:
${JSON.stringify(companyKnowledge.products, null, 2)}

Frequently Asked Questions:
${JSON.stringify(companyKnowledge.faq, null, 2)}

Company Policies:
${JSON.stringify(companyKnowledge.policies, null, 2)}

Contact Information:
${JSON.stringify(companyKnowledge.contact, null, 2)}
`;

  return `You are the official AI assistant for ${companyKnowledge.company.name}. Use the following company information to provide accurate and helpful responses. If the information isn't available in the provided context, provide a general response and suggest contacting the company directly for more specific details.

Company Context:
${companyContext}

Guidelines for your response:
1. Always respond as an official representative of ${companyKnowledge.company.name}
2. Keep responses professional, clear, and concise (4-5 sentences unless more detail is needed)
3. Use information from the company context when available
4. For technical questions, provide step-by-step guidance
5. If information is not available in the context, be honest and provide contact information
6. Format any technical terms or important information clearly

User Question: ${userQuestion}

Response:`;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get the chat model with the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    try {
      // Create a structured prompt with company context
      const structuredPrompt = createStructuredPrompt(lastMessage.content);

      // Generate content with the structured prompt
      const result = await model.generateContent(structuredPrompt);
      const response = await result.response;
      const text = response.text();

      // Clean up the response
      const cleanedResponse = text
        .replace('Response:', '')
        .trim();

      return NextResponse.json({ response: cleanedResponse });
    } catch (modelError) {
      console.error('Model error:', modelError);
      return NextResponse.json(
        { error: 'Failed to generate response from AI' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}