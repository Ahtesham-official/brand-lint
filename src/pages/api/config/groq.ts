import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const key = process.env.GROQ_API_KEY;
    const isConfigured = Boolean(key && key.trim().length > 5);
    return res.status(200).json({
      configured: isConfigured,
      model: 'openai/gpt-oss-120b',
      engine: isConfigured ? 'Groq GPT-OSS 120B' : 'Deterministic Rule Engine',
    });
  }

  if (req.method === 'POST') {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'Valid apiKey string is required' });
    }

    const trimmed = apiKey.trim();
    process.env.GROQ_API_KEY = trimmed;

    // Update .env.local file
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let currentContent = '';
      if (fs.existsSync(envPath)) {
        currentContent = fs.readFileSync(envPath, 'utf-8');
      }

      if (currentContent.includes('GROQ_API_KEY=')) {
        currentContent = currentContent.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${trimmed}`);
      } else {
        currentContent += `\nGROQ_API_KEY=${trimmed}\n`;
      }

      fs.writeFileSync(envPath, currentContent, 'utf-8');
    } catch (e) {
      console.warn('Could not persist to .env.local:', e);
    }

    return res.status(200).json({
      success: true,
      configured: true,
      message: 'Groq API Key activated in runtime and saved to .env.local',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

