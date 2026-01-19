/**
 * API Route für Benutzer-Einladungen
 * Sendet eine Einladungs-E-Mail über Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIMITS } from '@/config/features'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role, companyId } = body

    if (!email || !name || !role || !companyId) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Prüfe ob der anfragende User berechtigt ist
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob User Admin oder GL in dieser Firma ist
    const { data: membership } = await (supabase as any)
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['admin', 'gl'].includes((membership as any).role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Einladen von Mitgliedern' },
        { status: 403 }
      )
    }

    // Prüfe das Benutzer-Limit
    const { data: adminCompanies } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (adminCompanies && adminCompanies.length > 0) {
      const companyIds = adminCompanies.map((c: any) => c.company_id)

      const { data: allMembers } = await supabase
        .from('company_members')
        .select('user_id')
        .in('company_id', companyIds)

      const { data: pendingInvites } = await (supabase as any)
        .from('pending_invitations')
        .select('email')
        .in('company_id', companyIds)
        .gt('expires_at', new Date().toISOString())

      const uniqueUserIds = new Set((allMembers || []).map((m: any) => m.user_id))
      const uniqueInviteEmails = new Set((pendingInvites || []).map((i: any) => i.email))
      const totalCount = uniqueUserIds.size + uniqueInviteEmails.size

      if (totalCount >= LIMITS.MAX_USERS_PER_ADMIN) {
        return NextResponse.json(
          { error: `Benutzer-Limit erreicht. Sie haben bereits ${totalCount} von ${LIMITS.MAX_USERS_PER_ADMIN} Benutzern.` },
          { status: 400 }
        )
      }
    }

    // Hole Firmenname für die E-Mail
    const { data: company } = await supabase
      .from('companies')
      .select('name, slug')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Firma nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User bereits existiert
    const adminClient = createAdminClient()
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // User existiert bereits - prüfe ob schon Mitglied
      const { data: existingMembership } = await supabase
        .from('company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingUser.id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'Benutzer ist bereits Mitglied dieser Firma' },
          { status: 400 }
        )
      }

      // Füge existierenden User direkt hinzu
      const { error: memberError } = await (supabase as any)
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: existingUser.id,
          role: role,
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        return NextResponse.json(
          { error: 'Fehler beim Hinzufügen des Mitglieds' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Mitglied wurde erfolgreich hinzugefügt!',
        userExists: true,
      })
    }

    // User existiert nicht - Einladung erstellen und E-Mail senden
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 Tage gültig

    // Speichere Einladung in der Datenbank
    const { error: inviteError } = await (supabase as any)
      .from('pending_invitations')
      .insert({
        company_id: companyId,
        email: email,
        name: name,
        role: role,
        token: token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json(
          { error: 'Eine Einladung für diese E-Mail existiert bereits' },
          { status: 400 }
        )
      }
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Einladung' },
        { status: 500 }
      )
    }

    // Sende Einladungs-E-Mail über Supabase Auth
    const inviteUrl = `${request.nextUrl.origin}/invite/${token}`

    const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteUrl,
      data: {
        full_name: name,
        invited_to_company: companyId,
        invited_role: role,
        invite_token: token,
      },
    })

    if (emailError) {
      console.error('Error sending invite email:', emailError)
      // Einladung wurde erstellt, aber E-Mail konnte nicht gesendet werden
      // Gib trotzdem Erfolg zurück mit dem Link zum manuellen Teilen
      return NextResponse.json({
        success: true,
        message: `Einladung erstellt, aber E-Mail konnte nicht gesendet werden. Bitte teilen Sie diesen Link manuell: ${inviteUrl}`,
        inviteUrl: inviteUrl,
        emailSent: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Einladung wurde an ${email} gesendet!`,
      emailSent: true,
    })

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
