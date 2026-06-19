// Stores all active callSids per businessId (multi-call support)
const activeCalls = new Map<string, string[]>();

export function setActiveCallSid(businessId: string, callSid: string): void {
  const existing = activeCalls.get(businessId) || [];
  if (!existing.includes(callSid)) {
    existing.push(callSid);
    activeCalls.set(businessId, existing);
  }
}

export function getActiveCallSids(businessId: string): string[] {
  return activeCalls.get(businessId) || [];
}

export function removeActiveCallSid(callSid: string): void {
  for (const [businessId, sids] of activeCalls) {
    const idx = sids.indexOf(callSid);
    if (idx !== -1) {
      sids.splice(idx, 1);
      if (sids.length === 0) activeCalls.delete(businessId);
      else activeCalls.set(businessId, sids);
      return;
    }
  }
}
