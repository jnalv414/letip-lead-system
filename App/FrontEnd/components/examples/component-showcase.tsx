'use client';

/**
 * Component Showcase - Usage Examples
 *
 * This file demonstrates how to use all the newly created UI components.
 * Use this as a reference when building dashboard features.
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { DataTable, RankCell } from '@/components/ui/data-table';
import { Settings, Trash, Download, MoreVertical } from 'lucide-react';

export function ComponentShowcase() {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data for DataTable
  const businessData = [
    { id: 1, name: 'Acme Corp', status: 'enriched', leads: 145 },
    { id: 2, name: 'TechStart Inc', status: 'pending', leads: 89 },
    { id: 3, name: 'Global Solutions', status: 'failed', leads: 234 },
  ];

  const tableColumns = [
    {
      key: 'id',
      header: 'Rank',
      render: (_row: any, index: number) => <RankCell rank={index + 1} />,
    },
    {
      key: 'name',
      header: 'Business',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <Badge variant={row.status as any}>{row.status}</Badge>
      ),
    },
    {
      key: 'leads',
      header: 'Leads',
      sortable: true,
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">Component Showcase</h1>

      {/* Avatar Examples */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Avatar Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Single Avatars
            </h3>
            <div className="flex items-center gap-4">
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" />
              <Avatar name="Bob Johnson" size="lg" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Avatar Stack
            </h3>
            <AvatarStack
              avatars={[
                { name: 'Alice Cooper' },
                { name: 'Bob Dylan' },
                { name: 'Charlie Brown' },
                { name: 'Diana Ross' },
                { name: 'Edward Norton' },
                { name: 'Fiona Apple' },
              ]}
              max={4}
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Badge Examples */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Enrichment Status
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="enriched">Enriched</Badge>
              <Badge variant="pending">Pending</Badge>
              <Badge variant="failed">Failed</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Privacy Status
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="public">Public</Badge>
              <Badge variant="private">Private</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              General Status
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Examples */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Tab Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'settings', label: 'Settings' },
            ]}
            defaultTab="overview"
            onChange={setActiveTab}
          />

          <div className="mt-4 p-4 rounded-lg bg-white/5">
            <TabsContent value="overview" activeValue={activeTab}>
              <p className="text-[var(--text-secondary)]">Overview content goes here</p>
            </TabsContent>
            <TabsContent value="analytics" activeValue={activeTab}>
              <p className="text-[var(--text-secondary)]">Analytics content goes here</p>
            </TabsContent>
            <TabsContent value="settings" activeValue={activeTab}>
              <p className="text-[var(--text-secondary)]">Settings content goes here</p>
            </TabsContent>
          </div>
        </CardContent>
      </Card>

      {/* Dropdown Examples */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Dropdown Menus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Dropdown
              trigger={
                <button className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors">
                  Actions
                </button>
              }
              align="left"
            >
              <DropdownItem icon={<Download size={16} />}>
                Download Report
              </DropdownItem>
              <DropdownItem icon={<Settings size={16} />}>
                Settings
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<Trash size={16} />} variant="destructive">
                Delete
              </DropdownItem>
            </Dropdown>

            <Dropdown
              trigger={
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <MoreVertical size={20} className="text-[var(--text-secondary)]" />
                </button>
              }
              align="right"
            >
              <DropdownItem>View Details</DropdownItem>
              <DropdownItem>Edit</DropdownItem>
              <DropdownSeparator />
              <DropdownItem variant="destructive">Delete</DropdownItem>
            </Dropdown>
          </div>
        </CardContent>
      </Card>

      {/* DataTable Examples */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={businessData}
            columns={tableColumns}
            onRowClick={(row) => console.log('Clicked:', row)}
          />
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--text-secondary)]">
              Standard card with charcoal background
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--text-secondary)]">
              Glass morphism effect with blur
            </p>
          </CardContent>
        </Card>

        <Card variant="glass-elevated">
          <CardHeader>
            <CardTitle>Elevated Glass Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--text-secondary)]">
              Stronger glass effect with more blur
            </p>
          </CardContent>
        </Card>

        <Card variant="teal">
          <CardHeader>
            <CardTitle>Teal Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--text-secondary)]">
              Teal variant for highlights
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
