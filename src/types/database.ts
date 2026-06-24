export type LeadType = "zgloszenie_firmy" | "kontakt" | "prosba_o_kontakt" | "spam" | "zamowienie" | "pytanie_o_cene" | "inna";

export interface Lead {
  id: string;
  company_name: string;
  phone: string;
  nip: string;
  industry: string;
  knowledge_base_raw: string;
  status: "new" | "processed" | "active" | "trashed";
  contact_email: string;
  business_id: string | null;
  created_at: string;
  type: LeadType;
  message: string;
}

export interface Business {
  id: string;
  owner_uid: string;
  name: string;
  twilio_number: string;
  current_plan: "start_100" | "pro_500" | "enterprise" | "enterprise_2000" | "elastic_0" | "start" | "pro" | "growth" | "lux" | "self_service";
  minutes_used_this_week: number;
  system_prompt: string;
  menu_catalog: Record<string, unknown>;
  calendar_settings: CalendarSettings;
  services: Service[];
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  trial_ends_at: string;
  reseller_id: string | null;
  reseller_markup: number;
  suspended: boolean;
  created_at: string;
  industry?: string;
  website_url?: string;
  phone?: string;
  balance: number;
  total_spent: number;
  voice_id: string | null;
  dtmf_code: string | null;
  extension: string | null;
  sms_limit?: number;
  sms_used?: number;
  sms_extra_purchased?: number;
  two_factor_secret?: string | null;
  two_factor_enabled?: boolean;
  subscription_current_period_end?: string | null;
  tokens_used_this_month?: number;
  slack_webhook_url?: string | null;
  prepaid_minutes?: number;
  lifetime_purchased_minutes?: number;
  verification_status?: "pending" | "verified" | "rejected";
  verified_at?: string | null;
  verified_by?: string | null;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
}

export interface BusinessConsultant {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  sort_order: number;
  created_at: string;
}

export interface PortRequest {
  id: string;
  business_id: string;
  phone_number: string;
  account_name: string;
  nip: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  admin_note: string;
  created_at: string;
  updated_at: string;
  businesses?: { name: string; twilio_number: string; owner_uid: string };
}

export interface CalendarDay {
  enabled: boolean;
  start: string;
  end: string;
}

export interface CalendarSettings {
  monday: CalendarDay;
  tuesday: CalendarDay;
  wednesday: CalendarDay;
  thursday: CalendarDay;
  friday: CalendarDay;
  saturday: CalendarDay;
  sunday: CalendarDay;
  buffer_minutes: number;
  slot_interval: number;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  description?: string;
}

export interface CallLog {
  id: string;
  business_id: string | null;
  business_name?: string;
  duration_seconds: number;
  cost_pln: number;
  caller_id: string;
  from_number: string;
  to_number: string;
  twilio_call_sid: string;
  routed_from_main: boolean;
  routed_to_extension: string | null;
  routed_business_name: string | null;
  transcript: string;
  classification: "spam" | "offer" | "order" | "question" | "booking" | "unknown";
  ai_summary: string;
  was_helpful: boolean | null;
  recording_url: string;
  has_human_handoff: boolean;
  handoff_status: string;
  handoff_reason: string;
  handoff_target_number: string;
  handoff_started_at: string | null;
  handoff_ended_at: string | null;
  handoff_duration_seconds: number;
  handoff_recording_sid: string;
  handoff_recording_url: string;
  post_handoff_transcript: string;
  post_handoff_summary: string;
  post_handoff_transcription_status: string;
  post_handoff_transcribed_at: string | null;
  post_handoff_error: string;
  started_at: string;
  ended_at: string | null;
  rodo_consent_played: boolean;
  rodo_consent_at: string | null;
  created_at: string;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
  quality_score?: number | null;
  quick_summary?: string;
}

export interface SmsLog {
  id: string;
  business_id: string | null;
  call_log_id: string | null;
  to_number: string;
  message_body: string;
  status: string;
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  business_id: string;
  call_log_id: string | null;
  caller_name: string;
  caller_phone: string;
  service_type: string;
  reserved_at: string;
  duration_minutes: number;
  notes: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  business_id: string;
  call_log_id: string | null;
  caller_phone: string;
  rating: number;
  comment: string;
  category: "general" | "service" | "booking" | "support" | "complaint";
  created_at: string;
}

export type PlanKey = "start_100" | "pro_500" | "enterprise_2000" | "elastic_0" | "pro_249" | "lux_599";

export interface Voice {
  id: string;
  display_name: string;
  gender: "male" | "female";
  elevenlabs_voice_id: string;
  is_default: boolean;
  min_plan: PlanKey;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_percent: number | null;
  discount_amount: number | null;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[];
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  business_id: string;
  applied_at: string;
  original_price: number;
  final_price: number;
}

export interface DiscountRule {
  id: string;
  name: string;
  description: string;
  discount_percent: number | null;
  discount_amount: number | null;
  target_plans: string[];
  start_at: string;
  end_at: string;
  max_uses_total: number;
  used_count: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export interface Conversation {
  id: string;
  business_id: string;
  channel: "web" | "voice" | "sms" | "widget";
  caller_id: string | null;
  caller_name: string | null;
  status: "active" | "ended" | "archived";
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | null;
  tags: string[];
  duration_seconds: number;
  message_count: number;
  started_at: string;
  ended_at: string | null;
  deleted_at: string | null;
  created_at: string;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Transcription {
  id: string;
  conversation_id: string | null;
  business_id: string;
  call_log_id: string | null;
  audio_url: string | null;
  transcript: string;
  language: string;
  duration_seconds: number | null;
  speaker: "caller" | "assistant" | "unknown";
  confidence: number | null;
  summary: string;
  key_phrases: string[];
  created_at: string;
}

export interface BusinessKnowledge {
  id: string;
  business_id: string;
  category: "general" | "services" | "pricing" | "hours" | "location" | "faq" | "products" | "policies" | "team" | "promotions" | "custom";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardConfig {
  id: string;
  business_id: string;
  layout: {
    widgets: DashboardWidget[];
  };
  theme: "light" | "dark" | "auto";
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  type: "stats" | "chats" | "calls" | "reservations" | "knowledge" | "transcriptions";
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>;
}

// ============================================
// CHAT API TYPES
// ============================================

// ============================================
// GOOGLE CALENDAR TOKENS
// ============================================

export interface CalendarToken {
  business_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  conversationId?: string;
  businessId?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  systemPrompt?: string;
  businessName?: string;
}

export interface ChatResponse {
  reply: string;
  source: string;
  conversationId?: string;
  messageId?: string;
}

export type StaffRole = "admin" | "manager" | "receptionist" | "viewer";

export interface BusinessStaff {
  id: string;
  business_id: string;
  user_id: string;
  role: StaffRole;
  permissions: string[];
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  business_id: string | null;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export type CreatedByType = "ai_agent" | "admin" | "staff" | "client";

export type Permission =
  | "calls.read" | "calls.export"
  | "reservations.read" | "reservations.create" | "reservations.update" | "reservations.delete"
  | "settings.read" | "settings.update"
  | "billing.read" | "billing.buy"
  | "staff.read" | "staff.invite" | "staff.remove"
  | "analytics.read"
  | "prompts.read" | "prompts.update"
  | "widget.read" | "widget.update";

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  admin: [
    "calls.read", "calls.export",
    "reservations.read", "reservations.create", "reservations.update", "reservations.delete",
    "settings.read", "settings.update",
    "billing.read", "billing.buy",
    "staff.read", "staff.invite", "staff.remove",
    "analytics.read",
    "prompts.read", "prompts.update",
    "widget.read", "widget.update",
  ],
  manager: [
    "calls.read", "calls.export",
    "reservations.read", "reservations.create", "reservations.update", "reservations.delete",
    "settings.read",
    "billing.read", "billing.buy",
    "staff.read",
    "analytics.read",
    "prompts.read",
    "widget.read", "widget.update",
  ],
  receptionist: [
    "calls.read",
    "reservations.read", "reservations.create", "reservations.update",
    "billing.read",
    "analytics.read",
  ],
  viewer: [
    "calls.read",
    "reservations.read",
    "analytics.read",
  ],
};

