import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { extractGuidelineIntelligence } from '@/lib/guidelineExtractor';

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
      // 1. Single unified call extracts rules, AI comprehension, enhanced markdown, facts, and brand_profile
      // This eliminates concurrent Groq token spikes and 429 TPM limits
      const { rules, analysis, enhanced_version, extracted_facts, brand_profile, warnings } =
        await extractGuidelineIntelligence(guideline.raw_text, guideline.filename, guideline.id, orgId);

      // 2. Persist document-scoped rules & facts
      const savedRules = await serverDb.replaceRulesForGuideline(guideline.id, rules, orgId);
      const savedFacts = await serverDb.replaceFactsForGuideline(
        guideline.id,
        guideline.filename,
        extracted_facts,
        orgId
      );

      // 3. Dynamically update organisation brand profile from document
      let updatedBrand = undefined;
      const targetBrandId = orgId || guideline.brand_id;
      if (brand_profile?.name && brand_profile.name !== 'Not specified in document') {
        try {
          const currentBrand = await serverDb.getBrand(targetBrandId);
          updatedBrand = await serverDb.updateBrand({
            name: brand_profile.name,
            tagline: brand_profile.tagline && brand_profile.tagline !== 'Not specified in document'
              ? brand_profile.tagline
              : currentBrand.tagline,
            palette: {
              ...currentBrand.palette,
              ...(brand_profile.primary_color ? { primary: brand_profile.primary_color, primary_name: brand_profile.primary_color_name || 'Primary' } : {}),
              ...(brand_profile.secondary_color ? { secondary: brand_profile.secondary_color, secondary_name: brand_profile.secondary_color_name || 'Secondary' } : {}),
              ...(brand_profile.accent_color ? { accent: brand_profile.accent_color, accent_name: brand_profile.accent_color_name || 'Accent' } : {}),
              ...(brand_profile.forbidden_colors?.length ? { forbidden_colors: brand_profile.forbidden_colors } : {}),
              ...(brand_profile.wcag_min_contrast ? { wcag_min_contrast: brand_profile.wcag_min_contrast } : {}),
            },
          }, targetBrandId);
        } catch (brandErr) {
          console.warn('Failed to auto-update brand from guideline extraction:', brandErr);
        }
      }

      const extractionStatus: 'success' | 'partial' =
        (warnings && warnings.length > 0) || (savedRules.length === 0 && savedFacts.length === 0)
          ? 'partial'
          : 'success';

      // 4. Update guideline in database
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
        brand: updatedBrand,
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
