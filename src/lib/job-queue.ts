import { supabaseAdmin } from "./supabase-admin";

export type JobType =
  | "call_completed"
  | "call_completed_main"
  | "call_completed_client"
  | "transcribe_handoff"
  | "send_sms"
  | "send_email"
  | "send_webhook";

export interface JobPayload {
  [key: string]: unknown;
}

export async function enqueueJob(
  type: JobType,
  payload: JobPayload,
  options?: { priority?: number; maxAttempts?: number; scheduledAt?: Date }
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("job_queue")
    .insert({
      type,
      payload,
      priority: options?.priority ?? 0,
      max_attempts: options?.maxAttempts ?? 3,
      scheduled_at: (options?.scheduledAt ?? new Date()).toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[job-queue] enqueue ${type} failed:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function claimNextJob(
  types?: JobType[]
): Promise<{ id: string; type: string; payload: JobPayload; attempt_count: number } | null> {
  let query = supabaseAdmin
    .from("job_queue")
    .select("id, type, payload, attempt_count")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .lt("attempt_count", supabaseAdmin.rpc("get_column", { table: "job_queue", column: "max_attempts" }) as any)
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(1);

  if (types && types.length > 0) {
    query = query.in("type", types);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;

  const { error: updateError } = await supabaseAdmin
    .from("job_queue")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      attempt_count: (data as any).attempt_count + 1,
    })
    .eq("id", data.id)
    .eq("status", "pending");

  if (updateError) return null;

  return data as { id: string; type: string; payload: JobPayload; attempt_count: number };
}

export async function completeJob(id: string): Promise<void> {
  await supabaseAdmin
    .from("job_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function failJob(id: string, error: string): Promise<void> {
  const { data: job } = await supabaseAdmin
    .from("job_queue")
    .select("attempt_count, max_attempts")
    .eq("id", id)
    .single();

  const attemptCount = (job as any)?.attempt_count ?? 1;
  const maxAttempts = (job as any)?.max_attempts ?? 3;

  if (attemptCount >= maxAttempts) {
    await supabaseAdmin
      .from("job_queue")
      .update({
        status: "failed",
        last_error: error,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
  } else {
    await supabaseAdmin
      .from("job_queue")
      .update({
        status: "pending",
        last_error: error,
        started_at: null,
      })
      .eq("id", id);
  }
}

export async function processJobQueue(
  handler: (type: string, payload: JobPayload) => Promise<void>,
  types?: JobType[]
): Promise<number> {
  let processed = 0;
  let job = await claimNextJob(types);

  while (job) {
    try {
      await handler(job.type, job.payload);
      await completeJob(job.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[job-queue] job ${job.id} (${job.type}) failed:`, msg);
      await failJob(job.id, msg);
    }
    job = await claimNextJob(types);
  }

  return processed;
}

export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}> {
  const { data } = await supabaseAdmin
    .from("job_queue")
    .select("status, count")
    .then((res) => res);

  const stats = { pending: 0, processing: 0, failed: 0, completed: 0 };
  if (data) {
    for (const row of data as any[]) {
      const key = row.status as keyof typeof stats;
      if (key in stats) stats[key] = parseInt(row.count, 10);
    }
  }
  return stats;
}
