// Stores callSid indexed by businessId so MCP handler can look it up
const activeCalls = new Map<string, string>();

export function setActiveCallSid(businessId: string, callSid: string): void {
  activeCalls.set(businessId, callSid);
}

export function getActiveCallSid(businessId: string): string | undefined {
  return activeCalls.get(businessId);
}

export function deleteActiveCallSid(businessId: string): void {
  activeCalls.delete(businessId);
}
