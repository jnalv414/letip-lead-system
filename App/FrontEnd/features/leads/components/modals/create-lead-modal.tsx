'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useCreateLead } from '../../hooks/use-leads'

const createLeadSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  industry: z.string().optional(),
})

type CreateLeadFormData = z.infer<typeof createLeadSchema>

interface CreateLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLeadModal({ open, onOpenChange }: CreateLeadModalProps) {
  const createLead = useCreateLead()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      website: '',
      email: '',
      industry: '',
    },
  })

  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      await createLead.mutateAsync({
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        email: data.email || undefined,
        industry: data.industry || undefined,
      })
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create lead:', error)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTitle>Add New Lead</DialogTitle>
      <DialogDescription>
        Enter the business details to add a new lead to your database.
      </DialogDescription>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            placeholder="Enter business name"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="(555) 123-4567"
              {...register('phone')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="123 Main St, City, State"
            {...register('address')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="https://example.com"
            {...register('website')}
            error={errors.website?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            placeholder="e.g., Technology, Healthcare"
            {...register('industry')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createLead.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createLead.isPending}>
            Add Lead
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
