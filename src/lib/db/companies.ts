/**
 * Company Database Queries
 * Funktionen für Company CRUD Operationen
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type Company = {
  id: string
  name: string
  slug: string
  settings: any
  created_at: string
  updated_at: string
}

export type CompanyMember = {
  user_id: string
  role: 'admin' | 'gl' | 'superuser' | 'user'
  email: string
  full_name: string | null
  created_at: string
}

export type CompanyWithRole = Company & {
  role: 'admin' | 'gl' | 'superuser' | 'user'
}

export type SuperuserPermission = {
  id: string
  superuser_id: string
  company_id: string | null
  target_user_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Holt alle Firmen, in denen der User Mitglied ist
 * Inkl. Firmen die einem Superuser zugewiesen wurden
 */
export async function getUserCompanies(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyWithRole[]> {
  // Erst die Memberships holen
  const { data: memberships, error: memberError } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)

  if (memberError) {
    console.error('Error loading memberships:', memberError)
    throw memberError
  }

  const companiesMap = new Map<string, CompanyWithRole>()

  // Companies aus Memberships
  if (memberships && memberships.length > 0) {
    const companyIds = (memberships as any[]).map((m: any) => m.company_id)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .in('id', companyIds)

    if (companyError) {
      console.error('Error loading companies:', companyError)
      throw companyError
    }

    if (companies) {
      (companies as any[]).forEach((company: any) => {
        const membership = (memberships as any[]).find((m: any) => m.company_id === company.id)
        companiesMap.set(company.id, {
          ...company,
          role: membership!.role
        } as CompanyWithRole)
      })
    }
  }

  // Prüfe ob User Superuser ist und hole zugewiesene Firmen
  const { data: superuserPermissions, error: permError } = await supabase
    .from('superuser_permissions')
    .select('company_id')
    .eq('superuser_id', userId)
    .not('company_id', 'is', null)

  if (!permError && superuserPermissions && superuserPermissions.length > 0) {
    const superuserCompanyIds = superuserPermissions
      .map((p: any) => p.company_id)
      .filter((id: string | null) => id !== null && !companiesMap.has(id))

    if (superuserCompanyIds.length > 0) {
      const { data: superuserCompanies, error: superCompanyError } = await supabase
        .from('companies')
        .select('*')
        .in('id', superuserCompanyIds)

      if (!superCompanyError && superuserCompanies) {
        (superuserCompanies as any[]).forEach((company: any) => {
          companiesMap.set(company.id, {
            ...company,
            role: 'superuser'
          } as CompanyWithRole)
        })
      }
    }
  }

  return Array.from(companiesMap.values())
}

/**
 * Erstellt eine neue Firma
 */
export async function createCompany(
  supabase: SupabaseClient<Database>,
  data: {
    name: string
    slug: string
    userId: string
  }
): Promise<Company> {
  // 1. Erstelle die Firma
  const { data: company, error: companyError } = await (supabase as any)
    .from('companies')
    .insert({
      name: data.name,
      slug: data.slug,
      settings: {},
    })
    .select()
    .single()

  if (companyError) throw companyError

  // 2. Füge den Ersteller als Admin hinzu
  const { error: memberError } = await (supabase as any)
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: data.userId,
      role: 'admin',
    })

  if (memberError) throw memberError

  return company
}

/**
 * Holt eine Firma nach Slug
 */
export async function getCompanyBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error loading company by slug:', error)
    throw error
  }

  return data as Company
}

/**
 * Holt die Mitgliedschaft eines Users in einer Firma
 */
export async function getUserCompanyMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string
): Promise<{ role: 'admin' | 'gl' | 'user' } | null> {
  const { data, error } = await supabase
    .from('company_members')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data
}

/**
 * Aktualisiert eine Firma
 */
export async function updateCompany(
  supabase: SupabaseClient<Database>,
  companyId: string,
  data: Partial<Pick<Company, 'name' | 'settings'>>
): Promise<Company> {
  const { data: company, error } = await (supabase as any)
    .from('companies')
    .update(data)
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error

  return company
}

/**
 * Löscht eine Firma (nur für Admins)
 */
export async function deleteCompany(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)

  if (error) throw error
}

/**
 * Holt alle Mitglieder einer Firma
 */
export async function getCompanyMembers(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<CompanyMember[]> {
  const { data, error } = await supabase
    .from('company_members')
    .select(`
      user_id,
      role,
      created_at,
      user_profiles!company_members_user_id_fkey (
        full_name
      )
    `)
    .eq('company_id', companyId)

  if (error) throw error

  // Transformiere Daten in das erwartete Format
  return (data || []).map((member: any) => ({
    user_id: member.user_id,
    role: member.role,
    email: member.user_profiles?.full_name || member.user_id, // Fallback zu user_id wenn kein Name
    full_name: member.user_profiles?.full_name || null,
    created_at: member.created_at,
  }))
}

/**
 * Fügt ein Mitglied zu einer Firma hinzu
 */
export async function addCompanyMember(
  supabase: SupabaseClient<Database>,
  data: {
    companyId: string
    userId: string
    role: 'admin' | 'gl' | 'superuser' | 'user'
  }
): Promise<CompanyMember> {
  const { data: member, error } = await (supabase as any)
    .from('company_members')
    .insert({
      company_id: data.companyId,
      user_id: data.userId,
      role: data.role,
    })
    .select()
    .single()

  if (error) throw error

  return member
}

/**
 * Fügt ein Mitglied per E-Mail zu einer Firma hinzu
 */
export async function addCompanyMemberByEmail(
  supabase: SupabaseClient<Database>,
  data: {
    companyId: string
    userEmail: string
    role: 'admin' | 'gl' | 'superuser' | 'user'
  }
): Promise<void> {
  // Finde User ID by Email
  const { data: userData, error: userError } = await (supabase as any)
    .from('user_profiles')
    .select('id')
    .eq('email', data.userEmail)
    .single()

  if (userError) {
    if (userError.code === 'PGRST116') {
      throw new Error('Benutzer mit dieser E-Mail existiert nicht')
    }
    throw userError
  }

  // Füge Mitglied hinzu
  const { error } = await (supabase as any)
    .from('company_members')
    .insert({
      company_id: data.companyId,
      user_id: userData.id,
      role: data.role,
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Benutzer ist bereits Mitglied dieser Firma')
    }
    throw error
  }
}

/**
 * Aktualisiert die Rolle eines Mitglieds
 */
export async function updateMemberRole(
  supabase: SupabaseClient<Database>,
  companyId: string,
  userId: string,
  role: 'admin' | 'gl' | 'user' | 'superuser'
): Promise<void> {
  const { error } = await (supabase as any)
    .from('company_members')
    .update({ role })
    .eq('company_id', companyId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Entfernt ein Mitglied aus einer Firma
 */
export async function removeCompanyMember(
  supabase: SupabaseClient<Database>,
  companyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Generiert einen eindeutigen Slug aus einem Firmennamen
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Prüft, ob ein Slug bereits existiert
 */
export async function isSlugAvailable(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single()

  if (error && error.code === 'PGRST116') return true // Not found = available
  if (error) throw error

  return false // Slug exists
}

/**
 * Holt alle Superuser-Berechtigungen für einen Benutzer
 */
export async function getSuperuserPermissions(
  supabase: SupabaseClient<Database>,
  superuserId: string
): Promise<SuperuserPermission[]> {
  const { data, error } = await supabase
    .from('superuser_permissions')
    .select('*')
    .eq('superuser_id', superuserId)

  if (error) throw error
  return data || []
}

/**
 * Fügt eine Superuser-Berechtigung hinzu (Firma oder User)
 */
export async function addSuperuserPermission(
  supabase: SupabaseClient<Database>,
  data: {
    superuserId: string
    companyId?: string
    targetUserId?: string
  }
): Promise<void> {
  const { error } = await (supabase as any)
    .from('superuser_permissions')
    .insert({
      superuser_id: data.superuserId,
      company_id: data.companyId || null,
      target_user_id: data.targetUserId || null,
    })

  if (error) throw error
}

/**
 * Entfernt eine Superuser-Berechtigung
 */
export async function removeSuperuserPermission(
  supabase: SupabaseClient<Database>,
  permissionId: string
): Promise<void> {
  const { error } = await supabase
    .from('superuser_permissions')
    .delete()
    .eq('id', permissionId)

  if (error) throw error
}

/**
 * Entfernt alle Superuser-Berechtigungen für einen User
 */
export async function clearSuperuserPermissions(
  supabase: SupabaseClient<Database>,
  superuserId: string
): Promise<void> {
  const { error } = await supabase
    .from('superuser_permissions')
    .delete()
    .eq('superuser_id', superuserId)

  if (error) throw error
}

/**
 * Prüft ob ein Superuser Zugriff auf eine Firma hat
 */
export async function hasSuperuserAccessToCompany(
  supabase: SupabaseClient<Database>,
  superuserId: string,
  companyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('superuser_permissions')
    .select('id')
    .eq('superuser_id', superuserId)
    .eq('company_id', companyId)
    .single()

  if (error && error.code === 'PGRST116') return false // Not found
  if (error) throw error

  return !!data
}
