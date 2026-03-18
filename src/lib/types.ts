export type Role = "superadmin" | "admin" | "coach" | "adherent"

export type Studio = {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  plan: "starter" | "pro" | "business"
  status: "actif" | "suspendu"
  suspended_at: string | null
  created_at: string
}

export type Profile = {
  id: string
  studio_id: string | null
  first_name: string | null
  last_name: string | null
  role: Role
  created_at: string
}

export type Invitation = {
  id: string
  studio_id: string
  email: string
  role: "coach"
  token: string
  used: boolean
  created_at: string
  expires_at: string
}

export type Discipline = {
  id: string
  studio_id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export type Subscription = {
  id: string
  studio_id: string
  name: string
  price: number
  period: "mois" | "séance" | "carnet" | "trimestre" | "année"
  description: string | null
  popular: boolean
  color: string
  active: boolean
  created_at: string
}

export type Member = {
  id: string
  studio_id: string
  subscription_id: string | null
  auth_user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  status: "actif" | "suspendu" | "nouveau"
  credits: number
  credits_total: number
  joined_at: string
  next_payment: string | null
  notes: string | null
  created_at: string
  subscription?: Subscription
}

export type Session = {
  id: string
  studio_id: string
  discipline_id: string | null
  teacher: string
  room: string | null
  level: string
  session_date: string
  session_time: string
  duration_min: number
  spots: number
  status: "scheduled" | "cancelled" | "completed"
  created_at: string
  discipline?: Discipline
  booked?: number
  waitlist?: number
}

export type Booking = {
  id: string
  session_id: string
  member_id: string
  status: "confirmed" | "waitlist" | "cancelled"
  created_at: string
  member?: Member
}

export type Payment = {
  id: string
  studio_id: string
  member_id: string
  subscription_id: string | null
  amount: number
  payment_date: string
  payment_type: "Prélèvement" | "Carte" | "Espèces" | "Virement"
  status: "payé" | "impayé" | "remboursé"
  notes: string | null
  created_at: string
  member?: Member
  subscription?: Subscription
}

export type StudioKpis = {
  studio_id: string
  studio_name: string
  active_members: number
  sessions_this_month: number
  revenue_this_month: number
  unpaid_amount: number
}
