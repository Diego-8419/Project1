/**
 * Label Utilities
 * Helfer für benutzerdefinierte Bezeichnungen
 */

export interface CustomLabels {
  company?: string
  roles?: {
    admin?: string
    gl?: string
    superuser?: string
    user?: string
  }
}

export const DEFAULT_LABELS: CustomLabels = {
  company: 'Firma',
  roles: {
    admin: 'Administrator',
    gl: 'Geschäftsleitung',
    superuser: 'Superuser',
    user: 'Benutzer',
  },
}

/**
 * Gibt den Label für die Firmenbezeichnung zurück
 */
export function getCompanyLabel(customLabels?: CustomLabels | null): string {
  return customLabels?.company || DEFAULT_LABELS.company || 'Firma'
}

/**
 * Gibt den Label für eine Rolle zurück
 */
export function getRoleLabel(
  role: 'admin' | 'gl' | 'superuser' | 'user',
  customLabels?: CustomLabels | null
): string {
  if (customLabels?.roles?.[role]) {
    return customLabels.roles[role]
  }
  return DEFAULT_LABELS.roles?.[role] || role
}

/**
 * Gibt alle Rollen-Labels zurück
 */
export function getAllRoleLabels(customLabels?: CustomLabels | null): Record<string, string> {
  return {
    admin: getRoleLabel('admin', customLabels),
    gl: getRoleLabel('gl', customLabels),
    superuser: getRoleLabel('superuser', customLabels),
    user: getRoleLabel('user', customLabels),
  }
}

/**
 * Merged benutzerdefinierte Labels mit Defaults
 */
export function mergeLabels(customLabels?: CustomLabels | null): CustomLabels {
  return {
    company: customLabels?.company || DEFAULT_LABELS.company,
    roles: {
      admin: customLabels?.roles?.admin || DEFAULT_LABELS.roles?.admin,
      gl: customLabels?.roles?.gl || DEFAULT_LABELS.roles?.gl,
      superuser: customLabels?.roles?.superuser || DEFAULT_LABELS.roles?.superuser,
      user: customLabels?.roles?.user || DEFAULT_LABELS.roles?.user,
    },
  }
}
