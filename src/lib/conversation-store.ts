const store = new Map<string, {
  conversationId: string;
  businessId: string;
  callSid: string;
  createdAt: number;
}>();

export function setConversationForCall(callSid: string, conversationId: string, businessId: string): void {
  store.set(callSid, { conversationId, businessId, callSid, createdAt: Date.now() });
}

export function getConversationByCallSid(callSid: string): { conversationId: string; businessId: string } | null {
  const entry = store.get(callSid);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > 3_600_000) {
    store.delete(callSid);
    return null;
  }
  return { conversationId: entry.conversationId, businessId: entry.businessId };
}

export function getConversationsByBusinessId(businessId: string): { conversationId: string; callSid: string }[] {
  const results: { conversationId: string; callSid: string }[] = [];
  for (const [, entry] of store) {
    if (entry.businessId === businessId && Date.now() - entry.createdAt < 3_600_000) {
      results.push({ conversationId: entry.conversationId, callSid: entry.callSid });
    }
  }
  return results;
}

export function removeConversation(callSid: string): void {
  store.delete(callSid);
}

export function cleanupExpiredConversations(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.createdAt > 3_600_000) store.delete(key);
  }
}

setInterval(cleanupExpiredConversations, 300_000);
