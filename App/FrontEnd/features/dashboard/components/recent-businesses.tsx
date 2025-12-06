'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Building2, MapPin, Users, ArrowRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from '@/shared/components/ui'
import type { RecentBusiness } from '../types'

interface RecentBusinessesProps {
  businesses?: RecentBusiness[]
  isLoading?: boolean
}

function BusinessRow({ business, index }: { business: RecentBusiness; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/leads?id=${business.id}` as string}
        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-violet-400 transition-colors">
            {business.name}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {business.city && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{business.city}</span>
                <span>·</span>
              </>
            )}
            <Users className="h-3 w-3" />
            <span>{business.contacts_count} contacts</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={business.enrichment_status}>
            {business.enrichment_status}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {formatDistanceToNow(new Date(business.created_at), { addSuffix: true })}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  )
}

function BusinessRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function RecentBusinesses({ businesses, isLoading }: RecentBusinessesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Businesses</CardTitle>
          <Link href="/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <BusinessRowSkeleton key={i} />)
          ) : businesses && businesses.length > 0 ? (
            businesses.map((business, index) => (
              <BusinessRow key={business.id} business={business} index={index} />
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No businesses yet</p>
              <p className="text-sm">Start by scraping some leads</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
