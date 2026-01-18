-- Migration: Anpassbare Bezeichnungen für Firmen
-- Admins können die Bezeichnungen für "Firma" und Rollen anpassen

-- Neue Spalte für benutzerdefinierte Labels (JSONB)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_labels JSONB DEFAULT '{}'::jsonb;

-- Beispiel für custom_labels:
-- {
--   "company": "Unternehmen",
--   "roles": {
--     "admin": "Administrator",
--     "gl": "Geschäftsleitung",
--     "superuser": "Superuser",
--     "user": "Mitarbeiter"
--   }
-- }

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_companies_custom_labels ON companies USING gin(custom_labels);

-- Kommentar zur Dokumentation
COMMENT ON COLUMN companies.custom_labels IS 'Benutzerdefinierte Labels für Firmenbezeichnung und Rollen';
