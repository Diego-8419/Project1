-- =====================================================
-- FIX: RLS Policies - Infinite Recursion Fix
-- =====================================================

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view members of their companies" ON company_members;

-- Create simpler policy without recursion
CREATE POLICY "Users can view members of their companies"
  ON company_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    company_id IN (
      SELECT cm.company_id
      FROM company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );
