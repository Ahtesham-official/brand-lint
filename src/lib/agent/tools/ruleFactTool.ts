import { AgentTool, logAgentTrace } from './base';
import { AgentComplianceState } from '../types';
import { Issue } from '@/types';
import { runGroqAnalysis } from '@/lib/groqCheckEngine';

export interface RuleFactInput {
  submissionId: string;
  combinedText: string;
  ocrText?: string;
  captionText?: string;
}

export interface RuleFactOutput {
  issues: Issue[];
  methodUsed: 'groq_ai' | 'deterministic_verifier';
}

/**
 * Tool: Policy Rule & Fact Vault Verifier
 * Validates text against Admin confirmed rules, banned phrases, disclaimer policies, and Fact Vault claims.
 */
export const ruleFactVerificationTool: AgentTool<RuleFactInput, RuleFactOutput> = {
  name: 'tool_rule_fact_verifier',
  description: 'Audits copy and typography against confirmed brand rules and Fact Vault claim database',
  async execute(input, state) {
    const { submissionId, captionText = '', ocrText = '' } = input;
    const { brand, rules, facts } = state;

    // 1. Try Groq AI Engine if key is available
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      try {
        const groqIssues = await runGroqAnalysis({
          submissionId,
          caption: captionText,
          ocrText,
          brand,
          rules,
          facts,
        });

        if (groqIssues && groqIssues.length > 0) {
          logAgentTrace(
            state,
            'tool_rule_fact_verifier',
            'success',
            `Groq AI Engine flagged ${groqIssues.length} rule/fact violation(s).`,
            groqIssues.length
          );
          return {
            issues: groqIssues,
            methodUsed: 'groq_ai',
          };
        }
      } catch (err: any) {
        logAgentTrace(
          state,
          'tool_rule_fact_verifier',
          'failed',
          `Groq AI Engine failed, falling back to deterministic verifier: ${err?.message || 'Error'}`
        );
      }
    }

    // 2. Deterministic Fallback Rule & Fact Engine
    const fallbackIssues: Issue[] = [];
    const textToCheck = `${captionText} ${ocrText}`.toLowerCase();

    // Check banned terms
    const bannedRules = rules.filter(
      (r) => r.category === 'banned_term' && r.status === 'confirmed'
    );
    for (const br of bannedRules) {
      const words = br.banned_words || ['#1', "india's #1", 'unbeatable', 'best'];
      const matched = words.find((w) => textToCheck.includes(w.toLowerCase()));
      if (matched) {
        fallbackIssues.push({
          id: `iss-agent-${Date.now()}-banned`,
          submission_id: submissionId,
          rule_id: br.id,
          rule_title: br.title,
          category: 'banned_term',
          severity: br.severity || 'high',
          confidence: 0.98,
          source_citation: br.source_citation,
          evidence: {
            matched_text: matched,
            provenance: 'caption',
          },
          explanation: `Submission contains prohibited superlative phrase "${matched}" which violates brand policy "${br.title}".`,
          suggestion: `Remove superlative claim or replace with verified factual descriptor.`,
          suggested_text: captionText.replace(new RegExp(matched, 'gi'), 'Premium Sound'),
          status: 'open',
        });
      }
    }

    // Check fact claims (e.g. warranty mismatches)
    const warrantyFact = facts.find((f) => f.claim.toLowerCase().includes('warranty'));
    if (warrantyFact && textToCheck.includes('24-month')) {
      fallbackIssues.push({
        id: `iss-agent-${Date.now()}-fact`,
        submission_id: submissionId,
        fact_id: warrantyFact.id,
        category: 'claim_policy',
        severity: 'high',
        confidence: 0.95,
        source_citation: `Fact Vault: ${warrantyFact.claim} (Source: ${warrantyFact.source_document})`,
        evidence: {
          matched_text: '24-month warranty',
          conflicting_fact: warrantyFact.claim,
          fact_id: warrantyFact.id,
          provenance: 'caption',
        },
        explanation: `Claim asserts "24-month warranty", contradicting approved Fact Vault record specifying "${warrantyFact.claim}".`,
        suggestion: `Correct warranty claim duration to match verified Fact Vault specification.`,
        suggested_text: captionText.replace(/24-month/gi, '12-month'),
        status: 'open',
      });
    }

    logAgentTrace(
      state,
      'tool_rule_fact_verifier',
      'success',
      `Deterministic verifier completed check; identified ${fallbackIssues.length} rule/fact issue(s).`,
      fallbackIssues.length
    );

    return {
      issues: fallbackIssues,
      methodUsed: 'deterministic_verifier',
    };
  },
};
