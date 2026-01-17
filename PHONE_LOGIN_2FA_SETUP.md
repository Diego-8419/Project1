# Telefon-Login & 2FA Implementierung

## Übersicht

Diese Anleitung beschreibt die Implementierung von:
1. **Login per Telefonnummer** (SMS-basiert)
2. **2-Faktor-Authentifizierung (2FA)**:
   - Authenticator-App (TOTP)
   - Email-Verifizierung
   - SMS-Verifizierung

---

## Voraussetzungen

### 1. Supabase-Konfiguration

#### Telefon-Auth aktivieren
1. **Supabase Dashboard** öffnen: https://app.supabase.com
2. **Authentication → Providers**
3. **Phone** aktivieren
4. SMS-Provider konfigurieren:
   - **Twilio** (empfohlen)
   - **MessageBird**
   - **Textlocal**
   - **Vonage**

#### Twilio Setup (Beispiel)
1. Twilio-Account erstellen: https://www.twilio.com
2. **Account SID** und **Auth Token** kopieren
3. **Telefonnummer** kaufen
4. In Supabase eintragen:
   - Account SID
   - Auth Token
   - Messaging Service SID (oder Telefonnummer)

#### 2FA aktivieren
1. **Supabase Dashboard → Authentication → Settings**
2. **Multi-Factor Authentication** aktivieren
3. TOTP (Time-based One-Time Password) aktivieren

---

## Implementation

### 1. Telefon-Login

#### Login-Seite erweitern

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Email-Login (bereits vorhanden)
  const handleEmailLogin = async (e: React.FormEvent) => {
    // ... existing code
  }

  // Telefon-Login: OTP senden
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })

      if (error) throw error

      setOtpSent(true)
      alert('SMS mit Code wurde gesendet!')
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    }
  }

  // OTP verifizieren
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms',
      })

      if (error) throw error

      if (data.session) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    }
  }

  return (
    <div>
      {/* Method Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setLoginMethod('email')}
          className={loginMethod === 'email' ? 'active' : ''}
        >
          E-Mail
        </button>
        <button
          onClick={() => setLoginMethod('phone')}
          className={loginMethod === 'phone' ? 'active' : ''}
        >
          Telefon
        </button>
      </div>

      {loginMethod === 'email' ? (
        // Existing email login form
        <form onSubmit={handleEmailLogin}>
          {/* ... */}
        </form>
      ) : (
        // Phone login form
        <form onSubmit={otpSent ? handleVerifyOTP : handlePhoneLogin}>
          {!otpSent ? (
            <div>
              <label>Telefonnummer</label>
              <input
                type="tel"
                placeholder="+49 123 456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <button type="submit">Code senden</button>
            </div>
          ) : (
            <div>
              <label>SMS-Code</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit">Anmelden</button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
```

#### Telefonnummer-Format

Wichtig: Telefonnummern müssen im **E.164-Format** sein:
- `+49` für Deutschland
- `+43` für Österreich
- `+41` für Schweiz

Beispiel: `+4915112345678`

---

### 2. Two-Factor Authentication (2FA)

#### 2.1 TOTP (Authenticator-App)

##### 2FA Enrollment Page

```typescript
// src/app/(dashboard)/[companySlug]/settings/security/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'

export default function SecuritySettingsPage() {
  const supabase = createClient()
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [verifyCode, setVerifyCode] = useState('')
  const [factorsEnabled, setFactorsEnabled] = useState<any[]>([])

  // 2FA einrichten
  const handleEnroll2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) throw error

      // QR-Code generieren
      const qrCodeUrl = data.totp.qr_code
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl)
      setQrCode(qrCodeImage)
      setSecret(data.totp.secret)
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    }
  }

  // 2FA verifizieren und aktivieren
  const handleVerify2FA = async () => {
    try {
      const { data: { factors } } = await supabase.auth.mfa.listFactors()
      const factorId = factors?.[factors.length - 1]?.id

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId!,
        code: verifyCode,
      })

      if (error) throw error

      alert('2FA erfolgreich aktiviert!')
      loadFactors()
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    }
  }

  // Aktive Faktoren laden
  const loadFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error) {
      setFactorsEnabled(data.totp || [])
    }
  }

  useEffect(() => {
    loadFactors()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sicherheit</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Zwei-Faktor-Authentifizierung
        </h2>

        {factorsEnabled.length === 0 ? (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitsfaktor.
            </p>

            <button
              onClick={handleEnroll2FA}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              2FA einrichten
            </button>

            {qrCode && (
              <div className="mt-6">
                <p className="mb-2">
                  Scannen Sie den QR-Code mit Ihrer Authenticator-App:
                </p>
                <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Oder geben Sie diesen Code manuell ein: <code>{secret}</code>
                </p>

                <input
                  type="text"
                  placeholder="6-stelliger Code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />

                <button
                  onClick={handleVerify2FA}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Code verifizieren
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-green-600 dark:text-green-400 mb-2">
              ✓ 2FA ist aktiviert
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aktive Faktoren: {factorsEnabled.length}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 2.2 Login mit 2FA

```typescript
// src/app/(auth)/login/page.tsx - Nach erfolgreichem Login
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Prüfen ob 2FA erforderlich
    const { data: { factors } } = await supabase.auth.mfa.listFactors()

    if (factors && factors.length > 0) {
      // 2FA erforderlich
      setNeedsMFA(true)
      setFactorId(factors[0].id)
    } else {
      // Kein 2FA - direkt einloggen
      router.push('/dashboard')
    }
  } catch (err: any) {
    setError(err.message)
  }
}

// 2FA-Code verifizieren
const handleVerifyMFA = async () => {
  try {
    const { error } = await supabase.auth.mfa.challenge({
      factorId: factorId!,
    })

    if (error) throw error

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factorId!,
      challengeId: challengeId!,
      code: mfaCode,
    })

    if (verifyError) throw verifyError

    router.push('/dashboard')
  } catch (err: any) {
    setError(err.message)
  }
}
```

---

## Empfohlene Authenticator-Apps

Für TOTP (2FA):
- **Google Authenticator** (iOS, Android)
- **Microsoft Authenticator** (iOS, Android)
- **Authy** (iOS, Android, Desktop)
- **1Password** (mit 2FA-Support)
- **Bitwarden** (mit 2FA-Support)

---

## Kosten und Limits

### Twilio SMS-Kosten (Beispiel)
- Deutschland: ~0.08€ pro SMS
- Free Trial: 15$ Guthaben

### Supabase Limits
- Free Tier: 50.000 Monthly Active Users
- Pro: Unlimited MAU

### Empfehlung für Test
- Twilio Free Trial nutzen
- Test-Telefonnummern verwenden
- In Production: Budget für SMS-Kosten einplanen

---

## Dependencies installieren

```bash
npm install qrcode
npm install -D @types/qrcode
```

---

## Sicherheitshinweise

1. **Telefonnummern validieren** - E.164-Format erzwingen
2. **Rate Limiting** - SMS-Versand limitieren (max. 3-5 pro Stunde)
3. **OTP-Codes** - 6-stellig, Ablauf nach 5 Minuten
4. **Backup-Codes** - Bei 2FA-Aktivierung Backup-Codes generieren
5. **Recovery-Optionen** - Email-Backup für 2FA-Wiederherstellung

---

## Testing

### Lokales Testing ohne SMS
Supabase bietet Test-Modi:
- Test-Telefonnummern (keine echten SMS)
- OTP-Bypass für Development

### Production Testing
1. Eigene Telefonnummer verwenden
2. SMS-Empfang prüfen
3. Code-Eingabe testen
4. 2FA-Flow vollständig durchlaufen

---

## Nächste Schritte

1. ✅ Twilio-Account erstellen und konfigurieren
2. ✅ Supabase Phone Provider aktivieren
3. ✅ Login-Seite um Telefon-Option erweitern
4. ✅ Security-Settings-Seite für 2FA erstellen
5. ✅ QR-Code-Generation implementieren
6. ✅ 2FA-Verifizierung in Login-Flow integrieren
7. ✅ Backup-Codes implementieren
8. ✅ Recovery-Flow für verlorene 2FA einrichten

---

## Weitere Ressourcen

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [Twilio Documentation](https://www.twilio.com/docs)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
