'use client'

import { motion } from 'framer-motion'
import { Activity, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/components/ui'
import { useApiStatus } from '../hooks/use-api-status'

const serviceLabels: Record<string, string> = {
  apify: 'Apify (Scraping)',
  hunter: 'Hunter.io (Email)',
  abstractapi: 'AbstractAPI (Enrichment)',
  sendgrid: 'SendGrid (Email)',
}

export function ApiStatusWidget() {
  const { data, isLoading, isError, refetch, isFetching } = useApiStatus()

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load API status.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              API Status
            </CardTitle>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {data?.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {serviceLabels[service.name] || service.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      service.configured
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                    }`}
                  />
                  <span className={service.configured ? 'text-emerald-400' : 'text-red-400'}>
                    {service.configured ? 'Active' : 'Missing'}
                  </span>
                </span>
              </div>
            ))}

            <div className="border-t border-border/50 pt-2.5 mt-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Redis Cache</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      data?.redis.connected
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                    }`}
                  />
                  <span className={data?.redis.connected ? 'text-emerald-400' : 'text-red-400'}>
                    {data?.redis.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
