'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, MapPin, Crosshair } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import type { ScrapeRequest } from '../types'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  location: z.string().min(1, 'Location is required'),
  radius: z.number().min(1).max(50).optional(),
  limit: z.number().min(10).max(500).optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

interface SearchFormProps {
  onSubmit: (data: ScrapeRequest) => void
  isLoading?: boolean
  isDisabled?: boolean
}

export function SearchForm({ onSubmit, isLoading, isDisabled }: SearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      location: '',
      radius: 10,
      limit: 100,
    },
  })

  const handleFormSubmit = (data: SearchFormData) => {
    onSubmit({
      query: data.query,
      location: data.location,
      radius: data.radius,
      limit: data.limit,
    })
  }

  const radiusOptions = [
    { value: '5', label: '5 miles' },
    { value: '10', label: '10 miles' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
  ]

  const limitOptions = [
    { value: '50', label: '50 results' },
    { value: '100', label: '100 results' },
    { value: '200', label: '200 results' },
    { value: '500', label: '500 results' },
  ]

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Map Search</h2>
          <p className="text-sm text-muted-foreground">
            Search for businesses on Google Maps
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Business Type or Keyword</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="query"
              placeholder="e.g., restaurants, plumbers, dentists..."
              className="pl-9"
              {...register('query')}
              error={errors.query?.message}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA or 94102"
              className="pl-9"
              {...register('location')}
              error={errors.location?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="radius">Search Radius</Label>
            <Select
              id="radius"
              {...register('radius', { valueAsNumber: true })}
              options={radiusOptions}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Max Results</Label>
            <Select
              id="limit"
              {...register('limit', { valueAsNumber: true })}
              options={limitOptions}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isDisabled || isLoading}
        >
          <Crosshair className="h-4 w-4 mr-2" />
          Start Scraping
        </Button>
      </form>
    </Card>
  )
}
