import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data } = req.body || {};
    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ error: 'Missing PDF data.' });
    }

    // Strip data URL prefix if present (e.g. "data:application/pdf;base64,...")
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty PDF file.' });
    }

    // Use pdf-parse/lib/pdf-parse.js directly to avoid index.js test-file side effect in Next.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const parsed = await pdfParse(buffer);

    const normalizedText = (parsed.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!normalizedText) {
      return res.status(422).json({
        error: 'No selectable text found in this PDF. It may be a scanned image PDF — please paste the text manually.',
      });
    }

    return res.status(200).json({
      text: normalizedText,
      pages: parsed.numpages || 1,
    });
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to extract text from PDF.',
    });
  }
}

