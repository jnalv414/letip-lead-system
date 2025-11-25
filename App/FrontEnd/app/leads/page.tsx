'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, List, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Pagination } from '@/components/shared/pagination';
import { BusinessList } from '@/components/leads/business-list';
import { CreateLeadModal, ViewLeadModal, DeleteLeadModal } from '@/components/leads/modals';
import { ErrorBoundary, ErrorState } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { useBusinesses } from '@/features/business-management';
import { useEnrichBusiness } from '@/features/lead-enrichment';
import { cn } from '@/lib/utils';
import type { Business, QueryBusinessesDto } from '@/types/api';

type ViewMode = 'grid' | 'table';

interface FilterValues {
  search?: string;
  city?: string;
  enrichment_status?: string;
  industry?: string;
}

const filterConfig = [
  {
    key: 'city',
    label: 'City',
    type: 'select' as const,
    options: [
      { value: 'freehold', label: 'Freehold' },
      { value: 'marlboro', label: 'Marlboro' },
      { value: 'manalapan', label: 'Manalapan' },
      { value: 'holmdel', label: 'Holmdel' },
      { value: 'colts-neck', label: 'Colts Neck' },
    ],
  },
  {
    key: 'enrichment_status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'enriched', label: 'Enriched' },
      { value: 'failed', label: 'Failed' },
    ],
  },
];

export default function LeadsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({});
  const itemsPerPage = 20;

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Enrichment mutation
  const enrichMutation = useEnrichBusiness();

  // Build query params from filters
  const queryParams: QueryBusinessesDto = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      ...(filters.search && { search: filters.search }),
      ...(filters.city && { city: filters.city }),
      ...(filters.enrichment_status && {
        enrichment_status: filters.enrichment_status as 'pending' | 'enriched' | 'failed',
      }),
      ...(filters.industry && { industry: filters.industry }),
    }),
    [currentPage, filters]
  );

  const { data, isLoading, error, refetch } = useBusinesses(queryParams);

  const businesses = data?.data ?? [];
  const totalItems = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleBusinessClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setViewModalOpen(true);
  }, []);

  const handleAddLead = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleEditLead = useCallback((business: Business) => {
    // For now, navigate to edit page - can be replaced with edit modal later
    router.push(`/leads/${business.id}/edit`);
  }, [router]);

  const handleDeleteLead = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setViewModalOpen(false);
    setDeleteModalOpen(true);
  }, []);

  const handleEnrichLead = useCallback((business: Business) => {
    enrichMutation.mutate(business.id, {
      onSuccess: () => {
        refetch();
      },
    });
  }, [enrichMutation, refetch]);

  const handleCreateSuccess = useCallback(() => {
    setCreateModalOpen(false);
    refetch();
  }, [refetch]);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedBusiness(null);
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Leads" subtitle="Manage your business leads" />
        <ErrorState
          title="Failed to load leads"
          message="There was an error loading your leads. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Leads"
          subtitle={`${totalItems} total leads`}
          action={{
            label: 'Add Lead',
            onClick: handleAddLead,
            icon: <Plus className="h-4 w-4" />,
          }}
        />

        {/* Filter Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <FilterBar
              filters={filterConfig}
              values={filters}
              onFilterChange={handleFilterChange}
              searchable
              searchPlaceholder="Search leads..."
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card/50 border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-8 w-8',
                viewMode === 'grid' && 'bg-primary/20 text-primary'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('table')}
              className={cn(
                'h-8 w-8',
                viewMode === 'table' && 'bg-primary/20 text-primary'
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Export Button */}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Business List */}
        <BusinessList
          businesses={businesses}
          onBusinessClick={handleBusinessClick}
          isLoading={isLoading}
          viewMode={viewMode}
          totalCount={totalItems}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Modals */}
        <CreateLeadModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {selectedBusiness && (
          <>
            <ViewLeadModal
              isOpen={viewModalOpen}
              business={selectedBusiness}
              onClose={() => {
                setViewModalOpen(false);
                setSelectedBusiness(null);
              }}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              onEnrich={handleEnrichLead}
            />

            <DeleteLeadModal
              isOpen={deleteModalOpen}
              business={selectedBusiness}
              onClose={() => {
                setDeleteModalOpen(false);
                setSelectedBusiness(null);
              }}
              onSuccess={handleDeleteSuccess}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
