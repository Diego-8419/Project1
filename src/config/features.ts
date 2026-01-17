/**
 * Feature Flags
 * Hier können Features ein-/ausgeschaltet werden
 */

export const FEATURES = {
  /**
   * Erlaubt öffentliche Registrierung
   *
   * false: Nur bestehende Admins können Benutzer einladen
   * true: Jeder kann sich registrieren und wird zu bestehenden Firmen eingeladen
   *
   * WICHTIG: Wenn auf true gesetzt, sollten zusätzliche Sicherheitsmaßnahmen
   * implementiert werden (E-Mail-Verifizierung, Captcha, etc.)
   */
  ALLOW_PUBLIC_REGISTRATION: false,

  /**
   * Erlaubt Benutzern eigene Firmen zu erstellen
   *
   * false: Nur bestehende Admins können Firmen erstellen
   * true: Jeder Benutzer kann seine eigene Firma erstellen
   */
  ALLOW_USER_CREATE_COMPANY: false,
} as const

export type FeatureFlags = typeof FEATURES
