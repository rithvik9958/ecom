import { revalidatePath } from "next/cache";
import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/config';
import GlobalSetting from '@/app/models/GlobalSetting';

// ─── System Instructions ──────────────────────────────────────────────────────

function getSystemInstruction(taskType, extraContext) {
  switch (taskType) {
    case 'generate_content':
    case 'product_description':
      return "You are an expert ecommerce copywriter. Generate engaging, persuasive, high-converting copy for an online store. Use clean formatting with key bullet points, product benefits, and specifications where appropriate. Return clear text without filler intro words.";
    case 'seo_optimize':
      return "You are an expert Ecommerce SEO specialist. Analyze the provided topic or product and generate an optimized 'SEO Title' (max 60 chars), a 'Meta Description' (max 155 chars), and a comma-separated list of 'Target Keywords'. Format each on a separate line.";
    case 'schema_json':
      return "You are a structured data specialist. Generate ONLY valid, clean JSON-LD schema without backticks, without markdown formatting, and without any explanatory text.";
    case 'summarize':
      return "You are an expert copy editor. Summarize the provided text into a concise, attractive summary with key takeaway bullet points.";
    case 'translate':
      return `You are a professional multilingual translator. Translate the provided text into ${extraContext || 'English'}, preserving the natural tone and commercial appeal.`;
    case 'grammar_tone':
      return `You are a professional editor. Fix any grammar, spelling, or phrasing in the provided text and polish it in a ${extraContext || 'commercial and professional'} tone. Return only the rewritten text.`;
    default:
      return "You are a helpful AI assistant for an online ecommerce store dashboard. Provide concise, accurate, professional responses.";
  }
}

// ─── Provider: OpenRouter ─────────────────────────────────────────────────────

async function callOpenRouter(apiKey, systemInstruction, prompt) {
  // Free models that perform genuine text generation, not moderation
  const candidateModels = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'openrouter/auto'
  ];

  let lastErr = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'Storefront Admin'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) {
        const text = data.choices[0].message.content.trim();
        // Discard safety-only responses like "User Safety: safe"
        if (text && !text.toLowerCase().startsWith('user safety:')) {
          return text;
        }
      }
      if (data.error?.message) lastErr = new Error(data.error.message);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('OpenRouter did not return valid content from free models');
}

// ─── Provider: Groq ───────────────────────────────────────────────────────────

async function callGroq(apiKey, systemInstruction, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Groq error: ${data.error?.message || response.statusText}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return text;
}

// ─── Provider: Cerebras ───────────────────────────────────────────────────────

async function callCerebras(apiKey, systemInstruction, prompt) {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Cerebras error: ${data.error?.message || response.statusText}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Cerebras returned empty response');
  return text;
}

async function callGemini(apiKey, systemInstruction, prompt) {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
  let lastErr = null;

  for (const m of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `INSTRUCTIONS:\n${systemInstruction}\n\nUSER PROMPT:\n${prompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      if (data.error?.message) lastErr = new Error(data.error.message);
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Gemini API request failed across models');
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, taskType, extraContext } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    await connectDB();
    const settings = await GlobalSetting.findOne();

    // Collect keys: DB settings override ENV vars
    const keys = {
      openRouter: settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY || '',
      groq:       settings?.groqApiKey       || process.env.GROQ_API_KEY       || '',
      cerebras:   settings?.cerebrasApiKey   || process.env.CEREBRAS_API_KEY   || '',
      gemini:     settings?.geminiApiKey     || process.env.GEMINI_API_KEY     || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    };

    // Build ordered provider list based on custom sequence
    const systemInstruction = getSystemInstruction(taskType, extraContext);
    const defaultSequence = ['groq', 'gemini', 'openrouter', 'cerebras'];
    let providerOrder = defaultSequence;
    
    if (settings?.aiProviderSequence) {
      providerOrder = settings.aiProviderSequence.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    
    if (providerOrder.length === 0) providerOrder = defaultSequence;

    // Filter to only providers that have a key configured
    const availableProviders = providerOrder.filter(p => {
      const pNorm = p.toLowerCase();
      if (pNorm === 'openrouter') return !!keys.openRouter;
      if (pNorm === 'groq') return !!keys.groq;
      if (pNorm === 'cerebras') return !!keys.cerebras;
      if (pNorm === 'gemini') return !!keys.gemini;
      return false;
    });

    if (availableProviders.length === 0) {
      return NextResponse.json({
        error: '⚠️ No AI provider keys found in .env or Dashboard API Keys. Please add a free key (e.g. Groq from console.groq.com or OpenRouter/Gemini).'
      }, { status: 403 });
    }

    // Try each provider in order
    let lastError = null;
    let usedProvider = null;

    for (const provider of availableProviders) {
      try {
        let text = '';
        const pNorm = provider.toLowerCase();

        if (pNorm === 'groq') {
          text = await callGroq(keys.groq, systemInstruction, prompt);
          usedProvider = 'Groq (Llama 3.3 70B)';
        } else if (pNorm === 'openrouter') {
          text = await callOpenRouter(keys.openRouter, systemInstruction, prompt);
          usedProvider = 'OpenRouter';
        } else if (pNorm === 'cerebras') {
          text = await callCerebras(keys.cerebras, systemInstruction, prompt);
          usedProvider = 'Cerebras (Llama 3.3 70B)';
        } else if (pNorm === 'gemini') {
          text = await callGemini(keys.gemini, systemInstruction, prompt);
          usedProvider = 'Google Gemini';
        }

        if (text) {
          revalidatePath('/', 'layout');
          return NextResponse.json({ success: true, text, provider: usedProvider });
        }
      } catch (err) {
        console.warn(`[ai] Provider ${provider} failed:`, err.message);
        lastError = err;
      }
    }

    return NextResponse.json({
      error: `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}. Please check your API keys or try again.`
    }, { status: 500 });

  } catch (error) {
    console.error('[ai] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
}
