import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';
import { analyzeAndEnhanceGuideline } from '@/lib/guidelineEnhancer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const guideline = await serverDb.getGuidelineById(guidelineId as string);
    if (!guideline) {
      return res.status(404).json({ error: 'Guideline not found' });
    }

    const orgId = guideline.org_id || guideline.brand_id;

    try {
      // 1. Extract enforceable rules & generate AI comprehension/facts dynamically from document text
      // Run sequentially to stay well within Groq TPM limits and prevent 429 concurrency spikes
      const rules = await extractRulesFromGuidelineText(guideline.raw_text, guideline.id, orgId);
      const enhancement = await analyzeAndEnhanceGuideline(guideline.raw_text, guideline.filename);

      const { analysis, enhanced_version, extracted_facts, warnings } = enhancement;

      // 2. Persist document-scoped rules & facts
      const savedRules = await serverDb.replaceRulesForGuideline(guideline.id, rules, orgId);
      const savedFacts = await serverDb.replaceFactsForGuideline(
        guideline.id,
        guideline.filename,
        extracted_facts,
        orgId
      );

      const extractionStatus: 'success' | 'partial' =
        (warnings && warnings.length > 0) || (savedRules.length === 0 && savedFacts.length === 0)
          ? 'partial'
          : 'success';

      // 3. Update guideline in database
      const updated = await serverDb.updateGuideline(guideline.id, {
        ai_analysis: analysis,
        enhanced_version,
        selected_version: guideline.selected_version || 'original',
        status: 'extracted',
        rules_count: savedRules.length,
        extraction_status: extractionStatus,
        extraction_error: undefined,
      });

      return res.status(200).json({
        success: true,
        guidelineId: guideline.id,
        extractedCount: savedRules.length,
        factsCount: savedFacts.length,
        rules: savedRules,
        facts: savedFacts,
        analysis,
        enhanced_version,
        warnings: warnings || [],
        extraction_status: extractionStatus,
        guideline: updated,
      });
    } catch (err: any) {
      const message = err?.message || 'AI extraction failed';
      await serverDb.updateGuideline(guideline.id, {
        extraction_status: 'failed',
        extraction_error: message,
      });
      return res.status(500).json({
        error: 'Extraction failed. Please retry.',
        details: message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
