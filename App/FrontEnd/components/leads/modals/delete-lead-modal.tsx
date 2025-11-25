'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteBusiness } from '@/features/business-management';
import type { Business } from '@/types/api';

interface DeleteLeadModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteLeadModal({
  isOpen,
  business,
  onClose,
  onSuccess,
}: DeleteLeadModalProps) {
  const deleteMutation = useDeleteBusiness();

  const handleDelete = async () => {
    if (!business) return;

    try {
      await deleteMutation.mutateAsync(business.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  if (!business) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Lead</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lead?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="font-medium">{business.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {[business.city, business.state].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> This action cannot be undone. All associated
              contacts, enrichment logs, and outreach messages will also be deleted.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteLeadModal;
