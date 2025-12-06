'use client'

import { Building2, Phone, Globe, Mail, MapPin, Calendar, Users, Briefcase } from 'lucide-react'
import { Dialog, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useLead } from '../../hooks/use-leads'
import type { Business } from '@/shared/types'

interface ViewLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string | null
  onEnrich?: (business: Business) => void
}

export function ViewLeadModal({
  open,
  onOpenChange,
  businessId,
  onEnrich,
}: ViewLeadModalProps) {
  const { data: lead, isLoading } = useLead(businessId || '')

  if (!businessId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          <span>{lead?.name}</span>
        )}
      </DialogTitle>
      <DialogDescription>
        View detailed information about this business.
      </DialogDescription>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : lead ? (
        <div className="mt-4 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={lead.enrichment_status}>
              {lead.enrichment_status}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
            <div className="grid gap-2">
              {lead.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{lead.address}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:text-primary">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:text-primary">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary truncate"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Business Details</h4>
            <div className="grid grid-cols-2 gap-4">
              {lead.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm">{lead.industry}</p>
                  </div>
                </div>
              )}
              {lead.employee_count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Employees</p>
                    <p className="text-sm">{lead.employee_count}</p>
                  </div>
                </div>
              )}
              {lead.year_founded && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Founded</p>
                    <p className="text-sm">{lead.year_founded}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contacts */}
          {lead.contacts && lead.contacts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">
                Contacts ({lead.contacts.length})
              </h4>
              <div className="space-y-2">
                {lead.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <p className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.position && (
                      <p className="text-muted-foreground">{contact.position}</p>
                    )}
                    <p className="text-primary">{contact.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {lead.enrichment_status === 'pending' && onEnrich && (
              <Button onClick={() => onEnrich(lead)}>
                Enrich Lead
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
