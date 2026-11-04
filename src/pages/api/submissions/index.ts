import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const submissions = store.getSubmissions();
    return res.status(200).json(submissions);
  }

  if (req.method === 'POST') {
    const { title, caption, image_url, ocr_text } = req.body;
    if (!caption || !image_url) {
      return res.status(400).json({ error: 'Caption and image_url are required' });
    }

    const submission = store.createSubmission({
      title: title || 'Campaign Submission',
      caption,
      image_url,
      ocr_text,
    });

    return res.status(201).json(submission);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

