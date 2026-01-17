# PWA Testing - Android & iOS

## Voraussetzungen

### Android Testing
1. **Chrome Browser** auf Android-Gerät installiert
2. App muss über **HTTPS** erreichbar sein (oder localhost für Development)
3. Manifest und Service Worker müssen korrekt konfiguriert sein

### iOS Testing
1. **Safari** auf iOS 16.4+ (ältere Versionen haben eingeschränkte PWA-Unterstützung)
2. App muss über **HTTPS** erreichbar sein
3. Manifest muss korrekt konfiguriert sein

---

## Setup für lokales Testing

### 1. Development Server starten
```bash
npm run dev
```

### 2. Gerät mit lokalem Netzwerk verbinden
- Desktop und Mobilgerät müssen im **gleichen WLAN** sein
- IP-Adresse des Computers ermitteln:
  - Windows: `ipconfig`
  - Mac/Linux: `ifconfig`
- App aufrufen: `http://[IP-ADRESSE]:3000`

Beispiel: `http://192.168.1.100:3000`

---

## Installation auf Android

### Option 1: Chrome Installation
1. Chrome Browser öffnen und zur App navigieren
2. Auf **Menü** (3 Punkte) tippen
3. **"Zum Startbildschirm hinzufügen"** oder **"App installieren"** wählen
4. App-Name bestätigen
5. Icon erscheint auf dem Startbildschirm

### Option 2: Automatisches Install-Banner
- Chrome zeigt automatisch ein Banner an, wenn:
  - Manifest korrekt konfiguriert ist
  - Service Worker registriert ist
  - HTTPS verwendet wird
  - Benutzer die Seite mindestens 30 Sekunden besucht hat

### Überprüfung
1. Chrome → **Menü → Weitere Tools → Developer Tools**
2. **Application Tab** → Manifest
3. Prüfen ob alle Werte korrekt angezeigt werden

---

## Installation auf iOS

### Installation via Safari
1. **Safari** öffnen (NICHT Chrome!)
2. Zur App navigieren
3. Auf **Teilen-Button** tippen (Quadrat mit Pfeil)
4. Nach unten scrollen zu **"Zum Home-Bildschirm"**
5. App-Name bestätigen
6. Icon erscheint auf dem Startbildschirm

### Wichtige Hinweise für iOS
- **Nur Safari unterstützt** PWA-Installation (Chrome/Firefox auf iOS nicht)
- iOS zeigt **kein automatisches Install-Banner**
- Benutzer muss manuell über Teilen-Menü installieren
- Service Worker haben auf iOS eingeschränkte Funktionalität

### Überprüfung
1. Safari → **Entwickler-Menü** aktivieren (Einstellungen → Safari → Erweitert)
2. **Web-Inspektor** auf Mac verbinden
3. Application Storage prüfen

---

## Production Deployment Testing

### Für Vercel Deployment
1. **Projekt auf Vercel deployen**
   ```bash
   vercel
   ```

2. **HTTPS-URL** verwenden (automatisch bei Vercel)

3. **QR-Code generieren** für einfachen Zugriff
   - Nutze [qr-code-generator.com](https://www.qr-code-generator.com/)
   - URL eingeben
   - QR-Code mit Handy scannen

### Für andere Hosting-Anbieter
- **SSL-Zertifikat** muss konfiguriert sein
- Manifest unter `/.well-known/manifest.json` erreichbar
- Service Worker unter `/sw.js` oder `/service-worker.js`

---

## Testing Checkliste

### Manifest Testing
- [ ] Manifest ist unter `/manifest.json` erreichbar
- [ ] Alle Icons sind vorhanden (mindestens 192x192 und 512x512)
- [ ] `name`, `short_name`, `start_url` sind gesetzt
- [ ] `display: "standalone"` ist konfiguriert
- [ ] `theme_color` und `background_color` sind gesetzt

### Installation Testing

#### Android
- [ ] Install-Banner erscheint automatisch
- [ ] Manuelle Installation über Chrome-Menü funktioniert
- [ ] App erscheint im App-Drawer
- [ ] App startet im Standalone-Modus (ohne Browser-UI)
- [ ] App kann vom Startbildschirm gestartet werden

#### iOS
- [ ] "Zum Home-Bildschirm" Option ist verfügbar
- [ ] App erscheint auf dem Startbildschirm
- [ ] App startet im Standalone-Modus
- [ ] Statusbar wird korrekt angezeigt

### Funktionalität Testing
- [ ] Offline-Funktionalität (wenn Service Worker implementiert)
- [ ] Push-Notifications (wenn implementiert)
- [ ] Kamera-Zugriff funktioniert
- [ ] File-Upload funktioniert
- [ ] App verhält sich wie native App

---

## Häufige Probleme

### Problem: Install-Banner erscheint nicht (Android)
**Lösung:**
- Prüfen ob HTTPS verwendet wird
- Manifest auf Fehler prüfen
- Chrome DevTools → Application → Manifest
- Service Worker muss registriert sein
- Seite mindestens 30 Sekunden besuchen

### Problem: "Zum Home-Bildschirm" fehlt (iOS)
**Lösung:**
- **Nur Safari verwenden** (nicht Chrome/Firefox)
- Prüfen ob Manifest korrekt verlinkt ist
- iOS 16.4+ erforderlich für volle PWA-Unterstützung

### Problem: Icons werden nicht angezeigt
**Lösung:**
- Icons müssen im `/public/icons/` Verzeichnis liegen
- Alle Größen müssen vorhanden sein
- PNG-Format verwenden
- Cache leeren und neu installieren

### Problem: App startet im Browser (nicht Standalone)
**Lösung:**
- `"display": "standalone"` in manifest.json setzen
- App neu installieren (alte Installation löschen)
- Bei iOS: Safari-Cache leeren

---

## Icons generieren

Falls Icons fehlen, können sie mit Online-Tools generiert werden:

1. **Favicon Generator** besuchen: [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Logo hochladen (mindestens 512x512px)
3. PWA-Icons generieren lassen
4. Download und in `/public/icons/` entpacken

Oder manuell mit Tools wie:
- **ImageMagick**
- **GIMP**
- **Photoshop**

---

## Nächste Schritte

### Service Worker implementieren (für Offline-Funktionalität)
```bash
npm install next-pwa
```

Konfiguration in `next.config.ts`:
```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // Next.js config
})
```

### Push Notifications implementieren
- Web Push API integrieren
- VAPID-Keys generieren
- Backend für Push-Notifications einrichten

---

## Weitere Ressourcen

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/)
- [PWA Builder](https://www.pwabuilder.com/)
