/**
 * Fydelys — helpers CRUD Supabase centralisés
 * Utilisés depuis FydelysV4.jsx (import dynamique)
 */
import { createClient } from "@/lib/supabase";

// Récupérer le studio_id de l'utilisateur courant
export async function getMyStudioId(): Promise<string | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("studio_id").eq("id", user.id).single();
  return data?.studio_id ?? null;
}

export function sb() { return createClient(); }

// ── SESSIONS ──────────────────────────────────────────────────────────────────
export async function loadSessions(studioId: string) {
  const { data } = await sb().from("sessions")
    .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
    .eq("studio_id", studioId)
    .order("session_date").order("session_time");
  return (data || []).map((s: any) => ({
    id: s.id, disciplineId: s.discipline_id,
    teacher: s.teacher, room: s.room || "Studio A", level: s.level || "Tous niveaux",
    date: s.session_date, time: s.session_time?.slice(0,5) || "09:00",
    duration: s.duration_min || 60, spots: s.spots || 12,
    status: s.status || "scheduled", booked: 0, waitlist: 0,
  }));
}

export async function insertSession(studioId: string, s: any) {
  const { data } = await sb().from("sessions").insert({
    studio_id: studioId, discipline_id: s.disciplineId || null,
    teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
    session_date: s.date, session_time: s.time,
    duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
    status: "scheduled",
  }).select("id").single();
  return data?.id ?? null;
}

export async function insertSessionsBulk(studioId: string, sessions: any[]) {
  const rows = sessions.map(s => ({
    studio_id: studioId, discipline_id: s.disciplineId || null,
    teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
    session_date: s.date, session_time: s.time,
    duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
    status: "scheduled",
  }));
  const { error } = await sb().from("sessions").insert(rows);
  return !error;
}

export async function deleteSession(id: string) {
  await sb().from("sessions").delete().eq("id", id);
}

export async function updateSessionStatus(id: string, status: string) {
  await sb().from("sessions").update({ status }).eq("id", id);
}

// ── MEMBERS ───────────────────────────────────────────────────────────────────
export async function loadMembers(studioId: string) {
  const { data } = await sb().from("members")
    .select("id, first_name, last_name, email, phone, status, credits, joined_at, next_payment, notes, subscription_id, subscriptions(name)")
    .eq("studio_id", studioId)
    .order("last_name");
  return (data || []).map((m: any) => ({
    id: m.id, firstName: m.first_name, lastName: m.last_name,
    email: m.email, phone: m.phone || "",
    status: m.status || "actif", credits: m.credits || 0,
    joined: m.joined_at, nextPayment: m.next_payment, notes: m.notes || "",
    subscription: m.subscriptions?.name || "—",
    avatar: (m.first_name?.[0] || "") + (m.last_name?.[0] || ""),
  }));
}

export async function insertMember(studioId: string, m: any) {
  const { data } = await sb().from("members").insert({
    studio_id: studioId, first_name: m.firstName, last_name: m.lastName,
    email: m.email, phone: m.phone || "", status: "nouveau", credits: 0,
    joined_at: new Date().toISOString().split("T")[0],
  }).select("id").single();
  return data?.id ?? null;
}

export async function updateMember(id: string, updates: any) {
  const map: any = {};
  if (updates.firstName !== undefined) map.first_name = updates.firstName;
  if (updates.lastName  !== undefined) map.last_name  = updates.lastName;
  if (updates.email     !== undefined) map.email      = updates.email;
  if (updates.phone     !== undefined) map.phone      = updates.phone;
  if (updates.status    !== undefined) map.status     = updates.status;
  if (updates.credits   !== undefined) map.credits    = updates.credits;
  if (updates.notes     !== undefined) map.notes      = updates.notes;
  if (updates.nextPayment !== undefined) map.next_payment = updates.nextPayment;
  await sb().from("members").update(map).eq("id", id);
}

export async function deleteMember(id: string) {
  await sb().from("members").delete().eq("id", id);
}

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
export async function loadSubscriptions(studioId: string) {
  const { data } = await sb().from("subscriptions")
    .select("id, name, price, period, description, popular, color, active")
    .eq("studio_id", studioId).eq("active", true).order("price");
  return (data || []).map((s: any) => ({
    id: s.id, name: s.name, price: s.price, period: s.period,
    description: s.description || "", popular: s.popular || false, color: s.color || "#B8936A",
  }));
}

export async function insertSubscription(studioId: string, s: any) {
  const { data } = await sb().from("subscriptions").insert({
    studio_id: studioId, name: s.name, price: parseFloat(s.price) || 0,
    period: s.period, description: s.description || "", popular: false, color: "#B8936A",
  }).select("id").single();
  return data?.id ?? null;
}

export async function updateSubscription(id: string, s: any) {
  await sb().from("subscriptions").update({
    name: s.name, price: parseFloat(s.price) || 0, period: s.period,
    description: s.description || "", popular: s.popular || false,
  }).eq("id", id);
}

export async function deleteSubscription(id: string) {
  await sb().from("subscriptions").update({ active: false }).eq("id", id);
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
export async function loadPayments(studioId: string) {
  const { data } = await sb().from("member_payments")
    .select("id, member_id, amount, status, payment_date, payment_type, notes, members(first_name, last_name), subscriptions(name)")
    .eq("studio_id", studioId).order("date", { ascending: false });
  return (data || []).map((p: any) => ({
    id: p.id, memberId: p.member_id,
    member: p.members ? `${p.members.first_name} ${p.members.last_name}` : "—",
    amount: p.amount, status: p.status, date: p.payment_date,
    subscription: p.subscriptions?.name || "—", notes: p.notes || "",
    relance: false,
  }));
}

export async function insertPayment(studioId: string, p: any) {
  const { data } = await sb().from("member_payments").insert({
    studio_id: studioId, member_id: p.memberId || null,
    amount: parseFloat(p.amount) || 0, status: p.status || "payé",
    date: p.payment_date || new Date().toISOString().split("T")[0],
    notes: p.notes || "",
  }).select("id").single();
  return data?.id ?? null;
}

export async function updatePaymentStatus(id: string, status: string) {
  await sb().from("member_payments").update({ status }).eq("id", id);
}

// ── STUDIO SETTINGS ───────────────────────────────────────────────────────────
export async function loadStudioSettings(studioId: string) {
  const { data } = await sb().from("studios")
    .select("name, slug, city, zip, address, email, type, phone, description, logo_url, plan_slug, billing_status, trial_ends_at")
    .eq("id", studioId).single();
  return data;
}

export async function updateStudioSettings(studioId: string, updates: any) {
  await sb().from("studios").update(updates).eq("id", studioId);
}

// ── COACHES ───────────────────────────────────────────────────────────────────
export async function loadCoaches(studioId: string) {
  const { data } = await sb().from("profiles")
    .select("id, first_name, last_name, email, role, is_coach")
    .eq("studio_id", studioId)
    .in("role", ["coach", "admin"]);
  return (data || []).map((c: any) => ({
    id: c.id, name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    email: c.email || "", role: c.role, isCoach: c.is_coach,
  }));
}

export async function updateCoachRole(id: string, role: string) {
  await sb().from("profiles").update({ role }).eq("id", id);
}

export async function deactivateCoach(id: string) {
  await sb().from("profiles").update({ role: "adherent" }).eq("id", id);
}
