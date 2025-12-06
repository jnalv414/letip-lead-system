'use client'

import { useState } from 'react'
import { Sparkles, Mail, Linkedin, MessageSquare, Copy, Send, Check } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import type { Business, Contact } from '@/shared/types'
import type { MessageTemplate, GeneratedMessage } from '../types'

interface MessageGeneratorProps {
  business: Business | null
  contacts: Contact[]
  templates: MessageTemplate[]
  generatedMessage: GeneratedMessage | null
  onGenerate: (contactId: string, templateId: string, type: 'email' | 'linkedin' | 'sms') => void
  onSend: (contactId: string, message: GeneratedMessage, type: 'email' | 'linkedin' | 'sms') => void
  isGenerating?: boolean
  isSending?: boolean
}

export function MessageGenerator({
  business,
  contacts,
  templates,
  generatedMessage,
  onGenerate,
  onSend,
  isGenerating,
  isSending,
}: MessageGeneratorProps) {
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [messageType, setMessageType] = useState<'email' | 'linkedin' | 'sms'>('email')
  const [copied, setCopied] = useState(false)

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: `${c.first_name ?? ''} ${c.last_name ?? ''} - ${c.email}`.trim(),
  }))

  const templateOptions = templates
    .filter((t) => t.type === messageType)
    .map((t) => ({
      value: t.id,
      label: t.name,
    }))

  const typeOptions = [
    { value: 'email', label: 'Email' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'sms', label: 'SMS' },
  ]

  const handleGenerate = () => {
    if (selectedContactId) {
      onGenerate(selectedContactId, selectedTemplateId, messageType)
    }
  }

  const handleSend = () => {
    if (selectedContactId && generatedMessage) {
      onSend(selectedContactId, generatedMessage, messageType)
    }
  }

  const handleCopy = async () => {
    if (generatedMessage) {
      const text = generatedMessage.subject
        ? `Subject: ${generatedMessage.subject}\n\n${generatedMessage.body}`
        : generatedMessage.body
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const TypeIcon = messageType === 'email' ? Mail : messageType === 'linkedin' ? Linkedin : MessageSquare

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Message Generator</h2>
          <p className="text-sm text-muted-foreground">
            {business ? `Generate message for ${business.name}` : 'Select a business first'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Message Type */}
        <div className="space-y-2">
          <Label>Message Type</Label>
          <div className="flex gap-2">
            {typeOptions.map((option) => {
              const Icon = option.value === 'email' ? Mail : option.value === 'linkedin' ? Linkedin : MessageSquare
              return (
                <Button
                  key={option.value}
                  variant={messageType === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType(option.value as 'email' | 'linkedin' | 'sms')}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Contact Selection */}
        <div className="space-y-2">
          <Label>Contact</Label>
          <Select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            options={contactOptions}
            placeholder="Select a contact..."
            disabled={contacts.length === 0}
          />
          {contacts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No contacts found. Enrich the business first.
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Template (Optional)</Label>
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            options={[{ value: '', label: 'Use AI to generate' }, ...templateOptions]}
          />
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={!business || !selectedContactId || isGenerating}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Message
        </Button>

        {/* Generated Message Preview */}
        {generatedMessage && (
          <div className="space-y-3 pt-4 border-t border-border">
            {generatedMessage.subject && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="text-sm font-medium">{generatedMessage.subject}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Message</Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{generatedMessage.body}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button size="sm" onClick={handleSend} isLoading={isSending} className="flex-1">
                <Send className="h-4 w-4 mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
