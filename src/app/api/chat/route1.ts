import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

// Force the route to be dynamic and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable');
}

// Function to read and process text files
async function getTrainingData() {
  try {
    console.log('Starting to read training data...');
    const dataDir = join(process.cwd(), 'src', 'data');
    console.log('Data directory path:', dataDir);
    
    const files = await readdir(dataDir);
    console.log('Found files:', files);
    
    let content = '';

    for (const file of files) {
      if (file.toLowerCase().endsWith('.txt')) {
        console.log('Processing file:', file);
        const filePath = join(dataDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        content += `\nContent from ${file}:\n${fileContent}\n`;
      }
    }

    if (!content) {
      throw new Error('No training data found in the data directory');
    }

    return content;
  } catch (error) {
    console.error('Error reading training data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Get training data content
    const trainingContent = await getTrainingData();
    
    // Create the prompt with training data
    const prompt = `You are a helpful and friendly assistant. Your goal is to provide natural, conversational responses based on the training data provided. 

IMPORTANT RULES:
1. Use ONLY the information from the training data below to answer questions
2. If the answer is not in the training data, respond naturally with "I don't have that information in my training data"
3. Keep your responses natural and conversational
4. Use a friendly and helpful tone
5. If asked about topics not in the training data, politely redirect to topics you do know about

Training Data:
${trainingContent}

User Question: ${lastUserMessage}

Provide a natural, conversational response based on the training data above:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to get response from Gemini');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from Gemini');
    }

    return NextResponse.json({ response: generatedText });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'I apologize, but I encountered an error. Please try again.' },
      { status: 500 }
    );
  }
} 