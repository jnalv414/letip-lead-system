'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Building2, Target, Hash, Sparkles } from 'lucide-react';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={cn('glass-card-premium rounded-2xl overflow-hidden', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <motion.div
              className="p-2 rounded-xl bg-primary/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Search className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="gradient-text">Search Google Maps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Input - Primary with gradient border */}
            <div className="space-y-2">
              <label
                htmlFor="location"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                Location *
              </label>
              <div className={cn(
                'relative rounded-lg transition-all duration-300',
                focusedField === 'location' && 'gradient-border'
              )}>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Freehold, NJ or 07728"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className="bg-background/30 border-white/10 h-12 text-base focus-glow"
                  required
                />
              </div>
            </div>

            {/* Business Type Input */}
            <div className="space-y-2">
              <label
                htmlFor="businessType"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-accent-blue" />
                Business Type
              </label>
              <div className={cn(
                'relative rounded-lg transition-all duration-300',
                focusedField === 'businessType' && 'gradient-border'
              )}>
                <Input
                  id="businessType"
                  type="text"
                  placeholder="e.g., restaurant, plumber, dentist"
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  onFocus={() => setFocusedField('businessType')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className="bg-background/30 border-white/10 h-12 text-base focus-glow"
                />
              </div>
            </div>

            {/* Radius and Max Results Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Radius Select */}
              <div className="space-y-2">
                <label
                  htmlFor="radius"
                  className="text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <Target className="h-4 w-4 text-highlight-cyan" />
                  Radius
                </label>
                <div className={cn(
                  'relative rounded-lg transition-all duration-300',
                  focusedField === 'radius' && 'gradient-border'
                )}>
                  <select
                    id="radius"
                    value={formData.radius.toString()}
                    onChange={(e) => handleChange('radius', parseInt(e.target.value, 10))}
                    onFocus={() => setFocusedField('radius')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={cn(
                      'flex h-12 w-full rounded-lg border border-white/10 bg-background/30 px-3 py-2',
                      'text-base ring-offset-background cursor-pointer',
                      'focus-visible:outline-none focus-glow',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'transition-all duration-200'
                    )}
                  >
                    {radiusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-bg-secondary">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Max Results Input */}
              <div className="space-y-2">
                <label
                  htmlFor="maxResults"
                  className="text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <Hash className="h-4 w-4 text-highlight-pink" />
                  Max Results
                </label>
                <div className={cn(
                  'relative rounded-lg transition-all duration-300',
                  focusedField === 'maxResults' && 'gradient-border'
                )}>
                  <Input
                    id="maxResults"
                    type="number"
                    min={1}
                    max={200}
                    value={formData.maxResults}
                    onChange={(e) => handleChange('maxResults', parseInt(e.target.value, 10) || 50)}
                    onFocus={() => setFocusedField('maxResults')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className="bg-background/30 border-white/10 h-12 text-base focus-glow"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button with Shimmer */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full gap-2 h-12 text-base font-semibold',
                  'bg-gradient-to-r from-primary via-accent-purple to-accent-blue',
                  'hover:from-primary/90 hover:via-accent-purple/90 hover:to-accent-blue/90',
                  'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
                  'transition-all duration-300',
                  !isLoading && 'btn-shimmer'
                )}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Search className="h-5 w-5" />
                    </motion.div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Search Google Maps
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SearchForm;
