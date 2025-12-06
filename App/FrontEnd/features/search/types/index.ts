// Search feature types

export interface ScrapeRequest {
  query: string
  location: string
  radius?: number
  limit?: number
}

export interface ScrapeJob {
  id: string
  runId: string
  query: string
  location: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  found: number
  errors: number
  started_at: string
  completed_at?: string
}

export interface ScrapeStatus {
  runId: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'ABORTING' | 'READY' | 'STARTING'
  progress?: number
  itemCount?: number
  datasetId?: string
  startedAt?: string
  finishedAt?: string
  cost?: number
}

export interface ScrapeProgress {
  jobId: string
  runId: string
  status: ScrapeJob['status']
  progress: number
  total: number
  found: number
  errors: number
  message?: string
}

export interface RecentSearch {
  id: string
  runId?: string
  query: string
  location: string
  result_count: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}
