'use client';

import React from 'react';
import {
  MapPin,
  Phone,
  Globe,
  Building2,
  Mail,
  Briefcase,
  Calendar,
  Users,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Business, Contact } from '@/types/api';

interface ViewLeadModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onEdit: (business: Business) => void;
  onDelete: (business: Business) => void;
  onEnrich: (business: Business) => void;
}

const statusColors: Record<string, string> = {
  enriched: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Users className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{contact.name || 'Unknown'}</span>
          {contact.is_primary && (
            <Badge variant="outline" className="text-xs">Primary</Badge>
          )}
        </div>
        {contact.title && (
          <p className="text-sm text-muted-foreground">{contact.title}</p>
        )}
        {contact.email && (
          <div className="flex items-center gap-1 text-sm mt-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
              {contact.email}
            </a>
            {contact.email_verified ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ViewLeadModal({
  isOpen,
  business,
  onClose,
  onEdit,
  onDelete,
  onEnrich,
}: ViewLeadModalProps) {
  if (!business) return null;

  const location = [business.address, business.city, business.state, business.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{business.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('capitalize', statusColors[business.enrichment_status])}>
                  {business.enrichment_status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Source: {business.source}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Business Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{location}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${business.phone}`} className="text-sm hover:underline">
                    {business.phone}
                  </a>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {business.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {business.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{business.industry}</span>
                </div>
              )}
              {business.employee_count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{business.employee_count} employees</span>
                </div>
              )}
              {business.year_founded && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Founded {business.year_founded}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contacts */}
          {business.contacts && business.contacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Contacts ({business.contacts.length})
              </h3>
              <div className="space-y-2">
                {business.contacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          )}

          {/* No contacts */}
          {(!business.contacts || business.contacts.length === 0) && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No contacts found</p>
              {business.enrichment_status === 'pending' && (
                <p className="text-sm mt-1">Enrich this lead to discover contacts</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {business.enrichment_status === 'pending' && (
            <Button variant="outline" onClick={() => onEnrich(business)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Enrich
            </Button>
          )}
          <Button variant="outline" onClick={() => onEdit(business)} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(business)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewLeadModal;
