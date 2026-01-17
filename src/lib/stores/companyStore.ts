/**
 * Company Store (Zustand)
 * Globaler State für die aktuell ausgewählte Firma
 */

import { create } from 'zustand'
import type { CompanyWithRole } from '@/lib/db/companies'

interface CompanyState {
  currentCompany: CompanyWithRole | null
  setCurrentCompany: (company: CompanyWithRole | null) => void
  clearCompany: () => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  currentCompany: null,
  setCurrentCompany: (company) =>
    set({ currentCompany: company }),
  clearCompany: () => set({ currentCompany: null }),
}))
