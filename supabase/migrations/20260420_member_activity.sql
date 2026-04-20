-- Audit log : toutes les actions effectuées sur un membre
CREATE TABLE IF NOT EXISTS member_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  actor_id    uuid DEFAULT NULL,            -- auth user qui a effectué l'action (null = système/webhook)
  actor_role  text DEFAULT NULL,            -- 'admin' | 'coach' | 'adherent' | 'system' | 'stripe'
  action      text NOT NULL,                -- ex: 'credit_add', 'credit_deduct', 'subscription_change', 'booking_attended', 'payment', etc.
  details     jsonb DEFAULT '{}'::jsonb,    -- payload libre (delta, source, notes...)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_activity_member ON member_activity(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_studio ON member_activity(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_action ON member_activity(action);

ALTER TABLE member_activity ENABLE ROW LEVEL SECURITY;

-- Admin/coach du studio peut lire les activités de ses membres
CREATE POLICY "activity_studio_read" ON member_activity FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin/coach/adherent authentifié peut écrire dans le log de son studio
-- (permet aux clients de logger des actions sans passer par une API serveur)
CREATE POLICY "activity_studio_insert" ON member_activity FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE member_activity IS 'Audit log des actions sur les membres (crédits, abonnements, réservations, paiements...)';
