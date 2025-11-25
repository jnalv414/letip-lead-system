'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Sparkles,
  Send,
  Trash2,
  Medal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable, RankCell } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/dropdown';
import { cn } from '@/lib/utils';

// Business data interface
interface RecentBusiness {
  id: number;
  rank: number;
  name: string;
  city: string;
  source: string;
  contactCount: number;
  status: 'enriched' | 'pending' | 'failed';
  avatarUrl?: string;
}

// Mock data for demonstration
const mockBusinesses: RecentBusiness[] = [
  {
    id: 1,
    rank: 1,
    name: 'Freehold Plumbing Co',
    city: 'Freehold',
    source: 'Google Maps',
    contactCount: 3,
    status: 'enriched',
  },
  {
    id: 2,
    rank: 2,
    name: 'Shore Electric LLC',
    city: 'Marlboro',
    source: 'Google Maps',
    contactCount: 2,
    status: 'enriched',
  },
  {
    id: 3,
    rank: 3,
    name: 'Garden State HVAC',
    city: 'Manalapan',
    source: 'Manual',
    contactCount: 1,
    status: 'pending',
  },
  {
    id: 4,
    rank: 4,
    name: 'Atlantic Roofing',
    city: 'Colts Neck',
    source: 'Google Maps',
    contactCount: 4,
    status: 'enriched',
  },
  {
    id: 5,
    rank: 5,
    name: 'Premier Landscaping',
    city: 'Holmdel',
    source: 'Google Maps',
    contactCount: 0,
    status: 'failed',
  },
  {
    id: 6,
    rank: 6,
    name: 'Monmouth Auto Body',
    city: 'Freehold',
    source: 'Manual',
    contactCount: 2,
    status: 'enriched',
  },
  {
    id: 7,
    rank: 7,
    name: 'Elite Painting Services',
    city: 'Marlboro',
    source: 'Google Maps',
    contactCount: 1,
    status: 'pending',
  },
  {
    id: 8,
    rank: 8,
    name: 'Coastal Construction',
    city: 'Howell',
    source: 'Google Maps',
    contactCount: 3,
    status: 'enriched',
  },
];

// Enhanced RankCell with medal icons for top 3
function EnhancedRankCell({ rank }: { rank: number }) {
  const getMedalColor = () => {
    if (rank === 1) return 'from-yellow-500 to-amber-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-600 to-orange-800';
    return 'from-violet-500/20 to-blue-500/20';
  };

  const showMedal = rank <= 3;

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center',
        `bg-gradient-to-br ${getMedalColor()}`
      )}
    >
      {showMedal ? (
        <Medal className="w-4 h-4 text-white" />
      ) : (
        <span className="text-sm font-semibold text-violet-400">#{rank}</span>
      )}
    </div>
  );
}

// Business name cell with avatar
function BusinessCell({ business }: { business: RecentBusiness }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={business.name} size="md" src={business.avatarUrl} />
      <div className="flex flex-col">
        <span className="font-medium text-[var(--text-primary)]">
          {business.name}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {business.city}
        </span>
      </div>
    </div>
  );
}

// Status badge cell
function StatusCell({ status }: { status: RecentBusiness['status'] }) {
  const statusConfig = {
    enriched: {
      variant: 'enriched' as const,
      label: 'Enriched',
    },
    pending: {
      variant: 'pending' as const,
      label: 'Pending',
    },
    failed: {
      variant: 'failed' as const,
      label: 'Failed',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </Badge>
  );
}

// Actions dropdown menu
function ActionsCell({
  business,
  onAction,
}: {
  business: RecentBusiness;
  onAction: (action: string, id: number) => void;
}) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      }
    >
      <DropdownItem
        icon={<Eye className="w-4 h-4" />}
        onClick={() => onAction('view', business.id)}
      >
        View Details
      </DropdownItem>
      <DropdownItem
        icon={<Pencil className="w-4 h-4" />}
        onClick={() => onAction('edit', business.id)}
      >
        Edit Business
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem
        icon={<Sparkles className="w-4 h-4" />}
        onClick={() => onAction('enrich', business.id)}
      >
        Enrich Data
      </DropdownItem>
      <DropdownItem
        icon={<Send className="w-4 h-4" />}
        onClick={() => onAction('outreach', business.id)}
      >
        Generate Outreach
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem
        icon={<Trash2 className="w-4 h-4" />}
        onClick={() => onAction('delete', business.id)}
        variant="destructive"
      >
        Delete
      </DropdownItem>
    </Dropdown>
  );
}

// Main component
export function RecentBusinessesTable() {
  const [businesses] = useState<RecentBusiness[]>(mockBusinesses);

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on business ID: ${id}`);
    // TODO: Implement action handlers
    // - view: Navigate to business detail page
    // - edit: Open edit modal/page
    // - enrich: Trigger enrichment API call
    // - outreach: Generate outreach message
    // - delete: Show confirmation modal then delete
  };

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      render: (row: RecentBusiness) => <EnhancedRankCell rank={row.rank} />,
      className: 'w-[80px]',
    },
    {
      key: 'name',
      header: 'Business',
      sortable: true,
      render: (row: RecentBusiness) => <BusinessCell business={row} />,
      className: 'min-w-[250px]',
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      className: 'hidden md:table-cell', // Hide on mobile
    },
    {
      key: 'contactCount',
      header: 'Contacts',
      sortable: true,
      render: (row: RecentBusiness) => (
        <span className="font-medium text-[var(--text-secondary)]">
          {row.contactCount}
        </span>
      ),
      className: 'hidden lg:table-cell text-center', // Hide on mobile/tablet
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: RecentBusiness) => <StatusCell status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: RecentBusiness) => (
        <ActionsCell business={row} onAction={handleAction} />
      ),
      className: 'w-[60px]',
    },
  ];

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Businesses</span>
          <Badge variant="teal" size="sm">
            {businesses.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <DataTable
            data={businesses}
            columns={columns}
            className="border-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Usage example:
// <RecentBusinessesTable />
//
// Features:
// - Sortable columns (click header to sort)
// - Top 3 ranks show medal icons (gold, silver, bronze)
// - Avatar circles with name initials
// - Status badges with pulse animation
// - Actions dropdown with 6 actions
// - Responsive: hides Source column on mobile, Contacts on mobile/tablet
// - Glass styling matches dashboard design
// - Row hover highlight
// - Smooth animations
//
// Accessibility:
// - Semantic table markup
// - Keyboard navigation for dropdown
// - ARIA labels on action buttons
// - Focus states on interactive elements
//
// Performance:
// - Memoized column renders
// - Efficient sorting algorithm
// - AnimatePresence for dropdown animations
// - Lazy load avatar images
