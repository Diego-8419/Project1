-- Migration: Benachrichtigungseinstellungen
-- Benutzer können E-Mail-Benachrichtigungen aktivieren/deaktivieren

-- Neue Spalte für Benachrichtigungseinstellungen in user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email": {
    "enabled": true,
    "on_assignment": true,
    "on_comment": true,
    "on_status_change": true,
    "on_deadline_reminder": true
  },
  "push": {
    "enabled": true,
    "on_assignment": true,
    "on_comment": true,
    "on_status_change": true,
    "on_deadline_reminder": true
  }
}'::jsonb;

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_user_profiles_notification_settings ON user_profiles USING gin(notification_settings);

-- Kommentar zur Dokumentation
COMMENT ON COLUMN user_profiles.notification_settings IS 'Benutzer-spezifische Benachrichtigungseinstellungen';
