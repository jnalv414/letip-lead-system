'use client'

import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { useDeleteLead } from '../../hooks/use-leads'
import type { Business } from '@/shared/types'

interface DeleteLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: Business | null
}

export function DeleteLeadModal({
  open,
  onOpenChange,
  business,
}: DeleteLeadModalProps) {
  const deleteLead = useDeleteLead()

  if (!business) return null

  const handleDelete = async () => {
    try {
      await deleteLead.mutateAsync(business.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete lead:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <DialogTitle>Delete Lead</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Are you sure you want to delete <strong>{business.name}</strong>? All
        associated contacts and enrichment data will also be permanently removed.
      </p>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={deleteLead.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          isLoading={deleteLead.isPending}
        >
          Delete Lead
        </Button>
      </div>
    </Dialog>
  )
}
