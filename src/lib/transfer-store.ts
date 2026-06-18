export interface PendingTransfer {
  businessId: string;
  targetNumber: string;
  callerId: string;
  businessName: string;
  fromNumber: string;
  toNumber: string;
  createdAt: number;
}

const store = new Map<string, PendingTransfer>();

export function setPendingTransfer(callSid: string, data: PendingTransfer): void {
  store.set(callSid, data);
}

export function getPendingTransfer(callSid: string): PendingTransfer | undefined {
  return store.get(callSid);
}

export function deletePendingTransfer(callSid: string): void {
  store.delete(callSid);
}

export function findPendingTransferByBusinessId(businessId: string): { callSid: string; data: PendingTransfer } | undefined {
  for (const [callSid, data] of store) {
    if (data.businessId === businessId) return { callSid, data };
  }
  return undefined;
}