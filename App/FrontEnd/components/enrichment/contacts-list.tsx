'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Star,
  Linkedin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/api';

interface ContactsListProps {
  contacts: Contact[];
  isLoading?: boolean;
  className?: string;
}

export function ContactsList({ contacts, isLoading, className }: ContactsListProps) {
  if (isLoading) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
              <Skeleton data-testid="skeleton" className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton data-testid="skeleton" className="h-4 w-32" />
                <Skeleton data-testid="skeleton" className="h-3 w-40" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Contacts</span>
          </div>
          <Badge variant="outline" className="text-primary border-primary/50">
            {contacts.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No contacts discovered</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Enrich the business to find contacts
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <AnimatePresence>
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{contact.name || 'Unknown'}</span>
                        {contact.is_primary && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/50 text-xs">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            Primary
                          </Badge>
                        )}
                        {contact.email_verified && (
                          <Badge variant="outline" className="text-green-400 border-green-400/50 text-xs">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.linkedin_url && (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContactsList;
