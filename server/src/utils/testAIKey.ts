// Test script to verify AI API key
import * as dotenv from 'dotenv';

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY || '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';

// Test different API endpoints
const endpoints = [
  { name: 'Skylight AI', url: 'https://api.skylightai.io/v1/chat/completions' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
  { name: 'OpenRouter (OpenAI compatible)', url: 'https://openrouter.ai/api/v1/chat/completions' },
];

async function testAPI(endpoint: { name: string; url: string }) {
  try {
    console.log(`\n🧪 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.url}`);
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Try common model names
        messages: [
          {
            role: 'user',
            content: 'Say "Hello" if you can read this.',
          },
        ],
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS! API is working.`);
      console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}`);
      return true;
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔑 Testing AI API Key...');
  console.log(`   Key: ${AI_API_KEY.substring(0, 20)}...`);
  
  let workingEndpoint = null;
  
  for (const endpoint of endpoints) {
    const works = await testAPI(endpoint);
    if (works) {
      workingEndpoint = endpoint;
      break;
    }
  }
  
  if (workingEndpoint) {
    console.log(`\n✅ Found working API: ${workingEndpoint.name}`);
    console.log(`   Update your code to use: ${workingEndpoint.url}`);
  } else {
    console.log(`\n❌ No working API endpoint found.`);
    console.log(`\n💡 Options:`);
    console.log(`   1. Get an OpenAI API key from: https://platform.openai.com/api-keys`);
    console.log(`   2. Or use another OpenAI-compatible API provider`);
    console.log(`   3. Set it in your .env file: AI_API_KEY=your-key-here`);
  }
}

main().catch(console.error);

