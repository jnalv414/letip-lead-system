'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Building2, Target, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ScrapingFormData } from '@/features/map-scraping';

interface SearchFormProps {
  onSubmit: (data: ScrapingFormData) => void;
  isLoading?: boolean;
  className?: string;
}

const radiusOptions = [
  { value: '1', label: '1 mile' },
  { value: '5', label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
];

export function SearchForm({ onSubmit, isLoading = false, className }: SearchFormProps) {
  const [formData, setFormData] = useState<ScrapingFormData>({
    location: '',
    radius: 5,
    businessType: '',
    maxResults: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.location.trim()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof ScrapingFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Google Maps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Input */}
            <div className="space-y-2">
              <label
                htmlFor="location"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location *
              </label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Freehold, NJ or 07728"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                disabled={isLoading}
                className="bg-background/50"
                required
              />
            </div>

            {/* Business Type Input */}
            <div className="space-y-2">
              <label
                htmlFor="businessType"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Business Type
              </label>
              <Input
                id="businessType"
                type="text"
                placeholder="e.g., restaurant, plumber, dentist"
                value={formData.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                disabled={isLoading}
                className="bg-background/50"
              />
            </div>

            {/* Radius and Max Results Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Radius Select */}
              <div className="space-y-2">
                <label
                  htmlFor="radius"
                  className="text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Radius
                </label>
                <select
                  id="radius"
                  value={formData.radius.toString()}
                  onChange={(e) => handleChange('radius', parseInt(e.target.value, 10))}
                  disabled={isLoading}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2',
                    'text-sm ring-offset-background',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {radiusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Results Input */}
              <div className="space-y-2">
                <label
                  htmlFor="maxResults"
                  className="text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Max Results
                </label>
                <Input
                  id="maxResults"
                  type="number"
                  min={1}
                  max={200}
                  value={formData.maxResults}
                  onChange={(e) => handleChange('maxResults', parseInt(e.target.value, 10) || 50)}
                  disabled={isLoading}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Search className="h-4 w-4" />
                  </motion.div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search Google Maps
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SearchForm;
