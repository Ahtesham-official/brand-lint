import { AgentComplianceState, AgentTraceStep } from '../types';

export interface AgentTool<TInput, TOutput> {
  name: string;
  description: string;
  execute: (input: TInput, state: AgentComplianceState) => Promise<TOutput>;
}

export function logAgentTrace(
  state: AgentComplianceState,
  toolName: string,
  status: AgentTraceStep['status'],
  summary: string,
  findingsCount?: number
): void {
  state.trace.push({
    step: state.trace.length + 1,
    toolName,
    status,
    summary,
    timestamp: new Date().toISOString(),
    findingsCount,
  });
}

