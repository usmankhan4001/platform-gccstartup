// Automation engine stub — will be replaced with real Drizzle implementation

export async function evaluateTriggersForEvent(event: string, payload: any): Promise<any> {
  return { executions: [] }
}

export async function advanceExecutions(): Promise<any> {
  return { advanced: 0 }
}

export async function runWorkflowNow(workflow: any, leadId: string): Promise<any> {
  return { status: 'skipped' }
}