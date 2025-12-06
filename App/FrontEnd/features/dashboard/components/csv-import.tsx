'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
} from '@/shared/components/ui'
import { useValidateCsv, useImportCsv, useCsvImportStatus } from '../hooks/use-dashboard'
import type { CsvColumnMapping, CsvValidationResult } from '../api/dashboard-api'

interface CsvImportProps {
  onComplete?: () => void
}

const TARGET_FIELDS = [
  { value: 'name', label: 'Business Name', required: true },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP Code' },
  { value: 'phone', label: 'Phone' },
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
  { value: 'industry', label: 'Industry' },
  { value: 'source', label: 'Source' },
  { value: '', label: '-- Skip Column --' },
]

type ImportStep = 'upload' | 'mapping' | 'options' | 'importing' | 'complete'

export function CsvImport({ onComplete }: CsvImportProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null)
  const [columnMappings, setColumnMappings] = useState<CsvColumnMapping[]>([])
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip')
  const [defaultCity, setDefaultCity] = useState('')
  const [defaultIndustry, setDefaultIndustry] = useState('')
  const [sourceTag, setSourceTag] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateMutation = useValidateCsv()
  const importMutation = useImportCsv()
  const { data: jobStatus } = useCsvImportStatus(jobId)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)

    try {
      const result = await validateMutation.mutateAsync(selectedFile)
      setValidationResult(result)

      // Auto-create mappings from detected columns
      const mappings: CsvColumnMapping[] = result.detectedColumns.map((col) => {
        // Try to auto-match common column names
        const lowerCol = col.toLowerCase()
        let targetField = ''

        if (lowerCol.includes('name') || lowerCol.includes('business')) {
          targetField = 'name'
        } else if (lowerCol.includes('address') || lowerCol.includes('street')) {
          targetField = 'address'
        } else if (lowerCol.includes('city')) {
          targetField = 'city'
        } else if (lowerCol.includes('state')) {
          targetField = 'state'
        } else if (lowerCol.includes('zip') || lowerCol.includes('postal')) {
          targetField = 'zip'
        } else if (lowerCol.includes('phone')) {
          targetField = 'phone'
        } else if (lowerCol.includes('website') || lowerCol.includes('url')) {
          targetField = 'website'
        } else if (lowerCol.includes('email')) {
          targetField = 'email'
        } else if (lowerCol.includes('industry') || lowerCol.includes('category')) {
          targetField = 'industry'
        } else if (lowerCol.includes('source')) {
          targetField = 'source'
        }

        return {
          csvColumn: col,
          targetField,
          isRequired: targetField === 'name',
        }
      })

      setColumnMappings(mappings)
      setStep('mapping')
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }, [validateMutation])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, targetField, isRequired: targetField === 'name' }
          : mapping
      )
    )
  }

  const handleStartImport = async () => {
    if (!file) return

    setStep('importing')

    try {
      const result = await importMutation.mutateAsync({
        file,
        params: {
          columnMappings,
          skipHeader: true,
          duplicateHandling,
          defaultCity: defaultCity || undefined,
          defaultIndustry: defaultIndustry || undefined,
          sourceTag: sourceTag || undefined,
        },
      })

      setJobId(result.id)
    } catch (error) {
      console.error('Import failed:', error)
      setStep('options')
    }
  }

  // Watch for job completion
  if (jobStatus?.status === 'completed' && step === 'importing') {
    setStep('complete')
  }

  const hasNameMapping = columnMappings.some((m) => m.targetField === 'name')

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import CSV
        </CardTitle>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <UploadStep
              key="upload"
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              fileInputRef={fileInputRef}
              isLoading={validateMutation.isPending}
            />
          )}

          {step === 'mapping' && validationResult && (
            <MappingStep
              key="mapping"
              validationResult={validationResult}
              columnMappings={columnMappings}
              onMappingChange={handleMappingChange}
              onBack={() => setStep('upload')}
              onNext={() => setStep('options')}
              hasNameMapping={hasNameMapping}
            />
          )}

          {step === 'options' && (
            <OptionsStep
              key="options"
              duplicateHandling={duplicateHandling}
              setDuplicateHandling={setDuplicateHandling}
              defaultCity={defaultCity}
              setDefaultCity={setDefaultCity}
              defaultIndustry={defaultIndustry}
              setDefaultIndustry={setDefaultIndustry}
              sourceTag={sourceTag}
              setSourceTag={setSourceTag}
              onBack={() => setStep('mapping')}
              onImport={handleStartImport}
              isLoading={importMutation.isPending}
            />
          )}

          {step === 'importing' && (
            <ImportingStep
              key="importing"
              jobStatus={jobStatus}
            />
          )}

          {step === 'complete' && (
            <CompleteStep
              key="complete"
              jobStatus={jobStatus}
              onDone={() => {
                setStep('upload')
                setFile(null)
                setValidationResult(null)
                setJobId(null)
                onComplete?.()
              }}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// Step Components

interface UploadStepProps {
  onFileSelect: (file: File) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isLoading: boolean
}

function UploadStep({ onFileSelect, onDrop, fileInputRef, isLoading }: UploadStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed border-muted-foreground/30 rounded-lg p-8
          text-center cursor-pointer transition-colors
          hover:border-primary/50 hover:bg-muted/30
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />

        {isLoading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Validating CSV...</p>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">Drop CSV file here</p>
            <p className="text-muted-foreground">or click to browse</p>
          </>
        )}
      </div>
    </motion.div>
  )
}

interface MappingStepProps {
  validationResult: CsvValidationResult
  columnMappings: CsvColumnMapping[]
  onMappingChange: (csvColumn: string, targetField: string) => void
  onBack: () => void
  onNext: () => void
  hasNameMapping: boolean
}

function MappingStep({
  validationResult,
  columnMappings,
  onMappingChange,
  onBack,
  onNext,
  hasNameMapping,
}: MappingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={validationResult.valid ? 'default' : 'destructive'}>
          {validationResult.validRows} valid rows
        </Badge>
        {validationResult.errorRows > 0 && (
          <Badge variant="secondary">{validationResult.errorRows} with errors</Badge>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {columnMappings.map((mapping) => (
          <div key={mapping.csvColumn} className="flex items-center gap-3">
            <span className="w-1/3 text-sm font-medium truncate" title={mapping.csvColumn}>
              {mapping.csvColumn}
            </span>
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <Select
              value={mapping.targetField}
              onChange={(e) => onMappingChange(mapping.csvColumn, e.target.value)}
              className="flex-1"
              options={TARGET_FIELDS.map((field) => ({
                value: field.value,
                label: `${field.label}${field.required ? ' *' : ''}`,
              }))}
            />
          </div>
        ))}
      </div>

      {!hasNameMapping && (
        <p className="text-sm text-destructive">
          Business Name mapping is required
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!hasNameMapping}>
          Next
        </Button>
      </div>
    </motion.div>
  )
}

interface OptionsStepProps {
  duplicateHandling: 'skip' | 'update' | 'create_new'
  setDuplicateHandling: (value: 'skip' | 'update' | 'create_new') => void
  defaultCity: string
  setDefaultCity: (value: string) => void
  defaultIndustry: string
  setDefaultIndustry: (value: string) => void
  sourceTag: string
  setSourceTag: (value: string) => void
  onBack: () => void
  onImport: () => void
  isLoading: boolean
}

function OptionsStep({
  duplicateHandling,
  setDuplicateHandling,
  defaultCity,
  setDefaultCity,
  defaultIndustry,
  setDefaultIndustry,
  sourceTag,
  setSourceTag,
  onBack,
  onImport,
  isLoading,
}: OptionsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Duplicate Handling</label>
        <Select
          value={duplicateHandling}
          onChange={(e) => setDuplicateHandling(e.target.value as typeof duplicateHandling)}
          options={[
            { value: 'skip', label: 'Skip duplicates' },
            { value: 'update', label: 'Update existing' },
            { value: 'create_new', label: 'Create as new' },
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Default City (if not in CSV)</label>
        <Input
          value={defaultCity}
          onChange={(e) => setDefaultCity(e.target.value)}
          placeholder="e.g., Freehold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Default Industry (if not in CSV)</label>
        <Input
          value={defaultIndustry}
          onChange={(e) => setDefaultIndustry(e.target.value)}
          placeholder="e.g., Professional Services"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Source Tag</label>
        <Input
          value={sourceTag}
          onChange={(e) => setSourceTag(e.target.value)}
          placeholder="e.g., csv_import_dec2025"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onImport} disabled={isLoading}>
          {isLoading ? 'Starting Import...' : 'Start Import'}
        </Button>
      </div>
    </motion.div>
  )
}

interface ImportingStepProps {
  jobStatus?: { status: string; progress?: number; imported?: number; failed?: number } | null
}

function ImportingStep({ jobStatus }: ImportingStepProps) {
  const progress = jobStatus?.progress ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="py-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <svg className="w-16 h-16 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      <p className="text-lg font-medium mb-2">Importing businesses...</p>
      <p className="text-muted-foreground mb-4">
        {progress > 0 ? `${progress}% complete` : 'Starting...'}
      </p>

      {jobStatus?.imported !== undefined && (
        <p className="text-sm text-muted-foreground">
          Imported: {jobStatus.imported} | Failed: {jobStatus.failed ?? 0}
        </p>
      )}
    </motion.div>
  )
}

interface CompleteStepProps {
  jobStatus?: { imported?: number; skipped?: number; failed?: number } | null
  onDone: () => void
}

function CompleteStep({ jobStatus, onDone }: CompleteStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="py-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="text-lg font-medium mb-2">Import Complete!</p>

      <div className="flex justify-center gap-4 mb-6 text-sm">
        <div>
          <span className="text-2xl font-bold text-emerald-500">{jobStatus?.imported ?? 0}</span>
          <p className="text-muted-foreground">Imported</p>
        </div>
        <div>
          <span className="text-2xl font-bold text-amber-500">{jobStatus?.skipped ?? 0}</span>
          <p className="text-muted-foreground">Skipped</p>
        </div>
        <div>
          <span className="text-2xl font-bold text-red-500">{jobStatus?.failed ?? 0}</span>
          <p className="text-muted-foreground">Failed</p>
        </div>
      </div>

      <Button onClick={onDone}>Done</Button>
    </motion.div>
  )
}
