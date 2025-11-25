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
import { useBulkDeleteBusinesses } from '@/features/business-management';

interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkDeleteModal({
  isOpen,
  selectedIds,
  onClose,
  onSuccess,
}: BulkDeleteModalProps) {
  const deleteMutation = useBulkDeleteBusinesses();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(selectedIds);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete businesses:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {selectedIds.length} Leads
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete these leads?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-center py-6 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="text-center">
              <div className="text-4xl font-bold text-destructive mb-2">
                {selectedIds.length}
              </div>
              <div className="text-sm text-muted-foreground">
                leads will be permanently deleted
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-destructive">Warning:</span>{' '}
            This action cannot be undone. All associated contacts, enrichment
            logs, and outreach messages will also be deleted.
          </p>
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
            {deleteMutation.isPending
              ? 'Deleting...'
              : `Delete ${selectedIds.length} Leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkDeleteModal;
