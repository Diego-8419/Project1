/**
 * Feature Flags & Limits
 * Hier können Features ein-/ausgeschaltet und Limits konfiguriert werden
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
  ALLOW_USER_CREATE_COMPANY: true,
} as const

/**
 * System-Limits
 */
export const LIMITS = {
  /**
   * Maximale Anzahl an Benutzern pro Admin-Account (über alle Firmen hinweg)
   * Includes: Admin selbst + alle eingeladenen Mitglieder in allen Firmen
   */
  MAX_USERS_PER_ADMIN: 20,

  /**
   * Maximale Dateigröße für Uploads (in Bytes)
   * 10 MB = 10 * 1024 * 1024
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /**
   * Maximale Anzahl an Firmen pro Admin
   */
  MAX_COMPANIES_PER_ADMIN: 10,
} as const

export type FeatureFlags = typeof FEATURES
export type SystemLimits = typeof LIMITS
