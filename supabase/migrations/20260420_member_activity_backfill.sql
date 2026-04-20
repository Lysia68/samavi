-- Backfill rétroactif de member_activity à partir des données existantes
-- À exécuter une seule fois, après la création de la table member_activity

-- 1) Paiements existants → action "payment"
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  mp.studio_id,
  mp.member_id,
  CASE WHEN mp.source ILIKE 'card_%' THEN 'stripe' ELSE 'admin' END,
  'payment',
  jsonb_build_object(
    'amount', mp.amount,
    'type', mp.payment_type,
    'source', mp.source,
    'notes', mp.notes,
    'status', mp.status,
    'backfilled', true
  ),
  COALESCE(mp.created_at, (mp.payment_date::timestamptz))
FROM member_payments mp
WHERE mp.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_activity ma
    WHERE ma.member_id = mp.member_id
      AND ma.action = 'payment'
      AND ma.details->>'backfilled' = 'true'
      AND (ma.details->>'notes') IS NOT DISTINCT FROM mp.notes
      AND ABS(EXTRACT(EPOCH FROM (ma.created_at - COALESCE(mp.created_at, mp.payment_date::timestamptz)))) < 60
  );

-- 2) Bookings existants → booking_created + attended/absent/cancelled
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  s.studio_id,
  b.member_id,
  CASE WHEN b.cancelled_by = 'membre' THEN 'adherent' ELSE 'admin' END,
  'booking_created',
  jsonb_build_object(
    'booking_id', b.id,
    'session_id', b.session_id,
    'session_date', s.session_date,
    'session_time', s.session_time,
    'status', b.status,
    'backfilled', true
  ),
  b.created_at
FROM bookings b
JOIN sessions s ON s.id = b.session_id
WHERE b.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_activity ma
    WHERE ma.action = 'booking_created'
      AND ma.details->>'booking_id' = b.id::text
  );

-- 3) Présences validées (attended = true)
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  s.studio_id,
  b.member_id,
  'admin',
  'booking_attended',
  jsonb_build_object(
    'booking_id', b.id,
    'session_id', b.session_id,
    'session_date', s.session_date,
    'session_time', s.session_time,
    'backfilled', true
  ),
  -- On utilise la date de la séance comme timestamp (approximation)
  (s.session_date || ' ' || COALESCE(s.session_time::text, '12:00'))::timestamptz
FROM bookings b
JOIN sessions s ON s.id = b.session_id
WHERE b.attended = true AND b.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_activity ma
    WHERE ma.action = 'booking_attended'
      AND ma.details->>'booking_id' = b.id::text
  );

-- 4) Absences (attended = false)
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  s.studio_id,
  b.member_id,
  'admin',
  'booking_absent',
  jsonb_build_object(
    'booking_id', b.id,
    'session_id', b.session_id,
    'session_date', s.session_date,
    'backfilled', true
  ),
  (s.session_date || ' ' || COALESCE(s.session_time::text, '12:00'))::timestamptz
FROM bookings b
JOIN sessions s ON s.id = b.session_id
WHERE b.attended = false AND b.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_activity ma
    WHERE ma.action = 'booking_absent'
      AND ma.details->>'booking_id' = b.id::text
  );

-- 5) Annulations
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  s.studio_id,
  b.member_id,
  CASE WHEN b.cancelled_by = 'membre' THEN 'adherent' ELSE 'admin' END,
  'booking_cancelled',
  jsonb_build_object(
    'booking_id', b.id,
    'session_id', b.session_id,
    'session_date', s.session_date,
    'by', b.cancelled_by,
    'backfilled', true
  ),
  b.created_at
FROM bookings b
JOIN sessions s ON s.id = b.session_id
WHERE b.status = 'cancelled' AND b.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_activity ma
    WHERE ma.action = 'booking_cancelled'
      AND ma.details->>'booking_id' = b.id::text
  );

-- 6) Création de membre (estimation à partir de joined_at)
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT
  m.studio_id,
  m.id,
  'admin',
  'member_created',
  jsonb_build_object(
    'email', m.email,
    'name', TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')),
    'backfilled', true
  ),
  COALESCE(m.joined_at::timestamptz, m.created_at, now())
FROM members m
WHERE NOT EXISTS (
  SELECT 1 FROM member_activity ma
  WHERE ma.action = 'member_created' AND ma.member_id = m.id
);
