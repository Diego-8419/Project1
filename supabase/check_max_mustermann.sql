-- Prüfe ob Max Mustermann existiert

-- 1. Als user_profile
SELECT * FROM user_profiles WHERE full_name = 'Max Mustermann';

-- 2. Als company_member
SELECT * FROM company_members WHERE user_id IN (
  SELECT user_id FROM user_profiles WHERE full_name = 'Max Mustermann'
);

-- Falls Max Mustermann noch nicht existiert, müssen wir ihn anlegen:
-- 1. Registriere dich im Browser mit einer neuen E-Mail (z.B. max@example.com)
-- 2. Oder erstelle einen Test-User direkt in Supabase Auth Dashboard
