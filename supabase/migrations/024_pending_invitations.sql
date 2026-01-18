-- Migration: Pending Invitations Table
-- Ermöglicht das Einladen von Benutzern die noch nicht registriert sind

-- Tabelle für ausstehende Einladungen
CREATE TABLE IF NOT EXISTS pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gl', 'superuser', 'user')),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Nur eine aktive Einladung pro E-Mail pro Firma
  UNIQUE(company_id, email)
);

-- Index für schnelle Token-Lookups
CREATE INDEX IF NOT EXISTS idx_pending_invitations_token ON pending_invitations(token);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON pending_invitations(email);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_company ON pending_invitations(company_id);

-- RLS aktivieren
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Policies: Admins und GL können Einladungen ihrer Firma verwalten
CREATE POLICY "Company admins can manage invitations"
  ON pending_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = pending_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('admin', 'gl')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = pending_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('admin', 'gl')
    )
  );

-- Jeder kann seine eigene Einladung per Token lesen (für Accept-Flow)
CREATE POLICY "Anyone can read invitation by token"
  ON pending_invitations
  FOR SELECT
  TO authenticated
  USING (true);

-- Automatisches Löschen abgelaufener Einladungen (optional - per Cron Job)
-- DELETE FROM pending_invitations WHERE expires_at < NOW();
