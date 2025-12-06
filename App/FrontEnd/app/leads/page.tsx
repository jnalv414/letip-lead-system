'use client'

import { AppShell } from '@/shared/components/layout'
import { BusinessList } from '@/features/leads'

export default function LeadsPage() {
  return (
    <AppShell title="Leads">
      <BusinessList />
    </AppShell>
  )
}
