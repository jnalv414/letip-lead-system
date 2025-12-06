'use client'

import { motion } from 'framer-motion'
import { Building2, Phone, Globe, Mail, MapPin, MoreVertical, Sparkles, Trash2, Eye } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import type { Business } from '@/shared/types'

interface BusinessCardProps {
  business: Business
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onView?: (business: Business) => void
  onEnrich?: (business: Business) => void
  onDelete?: (business: Business) => void
}

export function BusinessCard({
  business,
  isSelected = false,
  onSelect,
  onView,
  onEnrich,
  onDelete,
}: BusinessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="glass"
        className={`p-4 transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(business.id, e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border bg-background"
            />
          )}

          {/* Business icon */}
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>

          {/* Business info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {business.name}
                </h3>
                {business.industry && (
                  <p className="text-sm text-muted-foreground">{business.industry}</p>
                )}
              </div>
              <Badge variant={business.enrichment_status}>
                {business.enrichment_status}
              </Badge>
            </div>

            {/* Contact details */}
            <div className="mt-3 space-y-1.5">
              {business.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-primary transition-colors"
                  >
                    {business.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <a
                    href={`mailto:${business.email}`}
                    className="truncate hover:text-primary transition-colors"
                  >
                    {business.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(business)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {business.enrichment_status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEnrich?.(business)}
                className="h-8 w-8 p-0"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(business)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
