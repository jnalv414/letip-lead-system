'use client';

import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateBusiness } from '@/features/business-management';
import { cn } from '@/lib/utils';
import type { CreateBusinessDto } from '@/types/api';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  city?: string;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    city: '',
    state: 'NJ',
    phone: '',
    website: '',
    industry: '',
    address: '',
    zip: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const createMutation = useCreateBusiness();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = useCallback(
    (field: keyof CreateBusinessDto) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error when user types
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Filter out empty optional fields to avoid backend validation errors
      const payload: CreateBusinessDto = {
        name: formData.name,
        city: formData.city,
      };

      // Only add optional fields if they have values
      if (formData.state?.trim()) payload.state = formData.state;
      if (formData.address?.trim()) payload.address = formData.address;
      if (formData.zip?.trim()) payload.zip = formData.zip;
      if (formData.phone?.trim()) payload.phone = formData.phone;
      if (formData.website?.trim()) payload.website = formData.website;
      if (formData.industry?.trim()) payload.industry = formData.industry;

      await createMutation.mutateAsync(payload);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      city: '',
      state: 'NJ',
      phone: '',
      website: '',
      industry: '',
      address: '',
      zip: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Lead
          </DialogTitle>
          <DialogDescription>
            Add a new business lead to your database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Business Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Enter business name"
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-foreground">
              Address
            </label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={handleChange('address')}
              placeholder="123 Main St"
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium text-foreground">
                City *
              </label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={handleChange('city')}
                placeholder="Freehold"
                className={cn(errors.city && 'border-destructive')}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium text-foreground">
                State
              </label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={handleChange('state')}
                placeholder="NJ"
              />
            </div>
          </div>

          {/* Zip */}
          <div className="space-y-2">
            <label htmlFor="zip" className="text-sm font-medium text-foreground">
              ZIP Code
            </label>
            <Input
              id="zip"
              value={formData.zip || ''}
              onChange={handleChange('zip')}
              placeholder="07728"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleChange('phone')}
              placeholder="732-555-1234"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium text-foreground">
              Website
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={handleChange('website')}
              placeholder="https://example.com"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium text-foreground">
              Industry
            </label>
            <Input
              id="industry"
              value={formData.industry || ''}
              onChange={handleChange('industry')}
              placeholder="Technology"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateLeadModal;
