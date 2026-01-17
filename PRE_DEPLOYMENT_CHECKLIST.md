# Pre-Deployment Checklist - ToDo App

## ✅ Bereits erledigt

### 1. Core Features
- [x] Multi-Mandanten-Architektur (mehrere Firmen)
- [x] Rollenbasierte Berechtigungen (Admin, GL, User, Superuser)
- [x] ToDo-Management mit Status, Priorität, Deadlines
- [x] Subtasks mit individueller Zuweisung
- [x] Kommentare und Kommunikation
- [x] Dokumente-Verwaltung
- [x] Activity Timeline
- [x] Benachrichtigungen (In-App)
- [x] Kanban-Board mit Drag & Drop
- [x] Dark Mode Support
- [x] DSGVO-konforme Datenschutzerklärung
- [x] Cookie-Banner und Consent-Management
- [x] Impressum
- [x] PWA Icons generiert (72x72 bis 512x512)
- [x] TypeScript Build erfolgreich
- [x] Namenskürzel-Anzeige bei zugewiesenen Benutzern (überall)

### 2. Sicherheit
- [x] Supabase RLS (Row Level Security) Policies
- [x] Rollenbasierte Zugriffskontrolle
- [x] Auth-Middleware für geschützte Routen
- [x] CAPTCHA nach fehlgeschlagenen Login-Versuchen
- [x] Consent-Management (DSGVO)

### 3. UI/UX
- [x] Responsive Design (Mobile, Tablet, Desktop)
- [x] Dark Mode mit Theme Context
- [x] Loading States
- [x] Error Handling
- [x] Toast Notifications
- [x] Accessibility (ARIA Labels)

---

## 🔧 Noch zu erledigen vor Deployment

### 1. **Supabase Production Setup** (KRITISCH)

#### A. Supabase Projekt erstellen
- [ ] Account erstellen bei [supabase.com](https://supabase.com)
- [ ] Neues Projekt anlegen (Production)
- [ ] Region wählen (z.B. Frankfurt für Deutschland)
- [ ] Projekt-Passwort sicher speichern

#### B. Datenbank-Migration ausführen
```bash
# Alle SQL-Dateien in dieser Reihenfolge in Supabase SQL Editor ausführen:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql
3. supabase/migrations/003_storage_setup.sql
4. (Optional) supabase/seed.sql für Test-Daten
```

#### C. Storage Buckets einrichten
Im Supabase Dashboard → Storage:
- [ ] Bucket `attachments` erstellen (Public: false)
- [ ] Bucket `documents` erstellen (Public: false)
- [ ] Bucket `avatars` erstellen (Public: true)
- [ ] Storage Policies prüfen (siehe `003_storage_setup.sql`)

#### D. Environment Variables
Aus Supabase Dashboard → Settings → API:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` kopieren
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` kopieren
- [ ] `SUPABASE_SERVICE_ROLE_KEY` kopieren (GEHEIM!)

---

### 2. **Vercel Deployment** (KRITISCH)

#### A. Vercel Account & Projekt
- [ ] Account erstellen bei [vercel.com](https://vercel.com)
- [ ] GitHub Repository verbinden
- [ ] Neues Projekt aus Repository importieren

#### B. Environment Variables in Vercel setzen
Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
**WICHTIG**: Für alle Environments (Production, Preview, Development) setzen

#### C. Build Settings
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: **18.x** oder höher

#### D. Deployment
- [ ] Branch `main` deployen
- [ ] Deployment-URL erhalten (z.B. `your-app.vercel.app`)
- [ ] Erste Deployment-Tests durchführen

---

### 3. **Domain & DNS** (Optional, aber empfohlen)

#### A. Custom Domain
- [ ] Domain registrieren (z.B. bei Namecheap, GoDaddy, etc.)
- [ ] Domain in Vercel hinzufügen (Settings → Domains)
- [ ] DNS-Einträge konfigurieren:
  - A Record: `76.76.21.21` (Vercel IP)
  - CNAME: `cname.vercel-dns.com`
- [ ] SSL-Zertifikat automatisch von Vercel erstellen lassen

#### B. Supabase URL Whitelist
In Supabase Dashboard → Authentication → URL Configuration:
- [ ] Production URL hinzufügen: `https://your-domain.com`
- [ ] Vercel URL hinzufügen: `https://your-app.vercel.app`
- [ ] Redirect URLs aktualisieren

---

### 4. **PWA Setup vervollständigen**

#### A. Service Worker
- [ ] `next.config.ts` PWA Config aktivieren:
```typescript
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

export default config
```
- [ ] Dependency installieren: `npm install next-pwa`

#### B. Manifest testen
- [ ] `public/manifest.json` verifizieren
- [ ] Icons sind vorhanden (✅ bereits erledigt)
- [ ] Start-URL korrekt setzen

#### C. PWA Features
- [ ] Offline-Fallback-Seite erstellen
- [ ] Cache-Strategie definieren
- [ ] Install-Prompt implementieren (optional)

---

### 5. **Testing vor Go-Live**

#### A. Funktionale Tests
- [ ] Registrierung eines neuen Users
- [ ] Login mit verschiedenen Rollen (Admin, GL, User)
- [ ] Firma erstellen
- [ ] Mitglieder hinzufügen und Rollen vergeben
- [ ] ToDo erstellen, bearbeiten, löschen
- [ ] Subtasks hinzufügen
- [ ] Kommentare schreiben
- [ ] Dokumente hochladen (max 10MB Test)
- [ ] Status-Änderungen mit Notizen
- [ ] Kanban-Board Drag & Drop
- [ ] Benachrichtigungen empfangen

#### B. Berechtigungs-Tests
- [ ] Admin kann alles sehen/bearbeiten
- [ ] GL kann alle Firmen-ToDos sehen
- [ ] User sieht nur eigene/zugewiesene ToDos
- [ ] Superuser-Berechtigungen funktionieren
- [ ] RLS verhindert Cross-Company-Zugriff

#### C. Performance Tests
- [ ] Lighthouse Score (>90 Ziel)
- [ ] Ladezeiten unter 2 Sekunden
- [ ] Mobile Performance testen
- [ ] 10+ ToDos gleichzeitig laden

#### D. Browser-Kompatibilität
- [ ] Chrome/Edge (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & iOS)
- [ ] PWA-Installation auf iOS
- [ ] PWA-Installation auf Android

#### E. DSGVO-Compliance
- [ ] Cookie-Banner erscheint beim ersten Besuch
- [ ] Consent wird gespeichert
- [ ] Datenschutzerklärung vollständig
- [ ] Impressum vollständig
- [ ] User kann Daten einsehen/löschen

---

### 6. **Monitoring & Analytics** (Optional)

#### A. Error Tracking
- [ ] Sentry einrichten (optional):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### B. Analytics
- [ ] Google Analytics oder Plausible (DSGVO-konform) einrichten
- [ ] Cookie-Consent für Analytics beachten

#### C. Uptime Monitoring
- [ ] UptimeRobot oder Vercel Analytics aktivieren
- [ ] Health-Check Endpoint erstellen (optional)

---

### 7. **Backup & Recovery**

#### A. Datenbank Backups
- [ ] Supabase Auto-Backup aktiviert (in Pro Plan)
- [ ] Manuelle Backup-Strategie definieren
- [ ] Recovery-Prozess dokumentieren

#### B. Code Backups
- [ ] GitHub Repository als Haupt-Backup
- [ ] Branches: `main` (production), `dev` (development)
- [ ] Tags für Releases setzen

---

### 8. **Dokumentation**

#### A. Admin-Dokumentation
- [ ] Wie füge ich neue Mitglieder hinzu?
- [ ] Wie ändere ich Rollen?
- [ ] Wie erstelle ich neue Firmen?
- [ ] Wie lösche ich einen Account?

#### B. User-Dokumentation
- [ ] Schnellstart-Guide
- [ ] FAQ-Seite
- [ ] Video-Tutorial (optional)

#### C. Developer-Dokumentation
- [ ] README.md aktualisieren
- [ ] API-Dokumentation
- [ ] Deployment-Prozess dokumentieren

---

### 9. **Legal & Compliance**

#### A. Rechtliches
- [ ] **Datenschutzerklärung** mit echten Kontaktdaten aktualisieren
- [ ] **Impressum** mit echten Firmendaten aktualisieren
- [ ] **AGB** erstellen (wenn kommerziell)
- [ ] **Cookie-Richtlinie** aktualisieren

#### B. DSGVO-Anforderungen
- [ ] Datenschutzbeauftragter benennen (wenn nötig)
- [ ] Auftragsverarbeitungsvertrag mit Supabase (AVV)
- [ ] User-Daten-Export Funktion
- [ ] User-Daten-Löschung Funktion
- [ ] Consent-Management vollständig

---

### 10. **Performance-Optimierungen** (Nice-to-have)

#### A. Code Optimierungen
- [ ] Lazy Loading für große Komponenten
- [ ] Image Optimization (Next.js Image)
- [ ] Bundle Size Analysis (`npm run analyze`)
- [ ] Remove unused dependencies

#### B. Caching
- [ ] Supabase Query Caching
- [ ] Redis für Session-Management (optional)
- [ ] CDN für Static Assets (Vercel macht das automatisch)

#### C. Database Optimierungen
- [ ] Indexes für häufige Queries
- [ ] Query Performance analysieren
- [ ] Connection Pooling (Supabase macht das automatisch)

---

## 📋 Launch Checklist (Final)

**Einen Tag vor Go-Live:**
- [ ] Alle Tests durchgeführt
- [ ] Backups erstellt
- [ ] Monitoring aktiv
- [ ] Team informiert
- [ ] Support-E-Mail eingerichtet

**Am Launch-Tag:**
- [ ] DNS propagiert (24-48h vorher setzen)
- [ ] SSL-Zertifikat aktiv
- [ ] Erste User-Registrierungen testen
- [ ] Error-Logs überwachen
- [ ] Performance-Metriken checken

**Nach Go-Live:**
- [ ] User-Feedback sammeln
- [ ] Bug-Reports bearbeiten
- [ ] Feature-Requests dokumentieren
- [ ] Regelmäßige Backups prüfen

---

## 🚨 Kritische Sicherheitshinweise

1. **NIEMALS** die `SUPABASE_SERVICE_ROLE_KEY` im Frontend verwenden!
2. **NIEMALS** Passwörter, API-Keys oder Secrets in Git committen
3. **IMMER** Environment Variables für sensitive Daten verwenden
4. **IMMER** RLS Policies aktiv lassen
5. **REGELMÄSSIG** Dependencies updaten (`npm audit`)

---

## 📞 Support & Hilfe

### Supabase
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Status: https://status.supabase.com

### Vercel
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://www.vercel-status.com

### Next.js
- Docs: https://nextjs.org/docs
- GitHub: https://github.com/vercel/next.js

---

## 🎯 Empfohlene Reihenfolge

1. **Supabase Production Setup** (1-2h)
2. **Vercel Deployment** (30min)
3. **Testing durchführen** (2-3h)
4. **PWA Setup** (1h)
5. **Legal Updates** (1h)
6. **Domain Setup** (1-2h, inkl. DNS-Propagation)
7. **Monitoring einrichten** (1h)
8. **Finale Tests** (2h)
9. **Go-Live!** 🚀

**Gesamtaufwand**: ~10-15 Stunden für vollständiges Production-Ready Deployment

---

## 📊 Kosten-Übersicht (monatlich)

### Free Tier (Entwicklung/Testing)
- Supabase: 0€ (500MB DB, 1GB Storage, 2GB Bandwidth)
- Vercel: 0€ (100GB Bandwidth, Unlimited Deployments)
- **Total: 0€/Monat**

### Empfohlen für Production
- Supabase Pro: ~25€/Monat (8GB DB, 100GB Storage, 250GB Bandwidth)
- Vercel Pro: ~20€/Monat (1TB Bandwidth, Analytics, Previews)
- Domain: ~10-15€/Jahr
- **Total: ~45-50€/Monat + ~1€/Monat Domain**

### Bei wachsenden Nutzerzahlen
- Supabase Team: Ab ~599€/Monat (mehr Performance, Support)
- Vercel Enterprise: Custom Pricing
- Monitoring (Sentry): Ab ~26€/Monat

---

**Status**: 🟢 Build erfolgreich | 🟡 Deployment ausstehend | 🔴 Production Setup erforderlich
