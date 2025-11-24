/**
 * Complete TanStack Query Usage Example
 *
 * Demonstrates all query and mutation hooks in action.
 * Shows real-world patterns for business management, scraping, and enrichment.
 */

'use client';

import { useState } from 'react';
import {
  useBusinesses,
  useBusiness,
  useStats,
  useScrapeStatus,
} from '@/hooks/queries';
import {
  useCreateBusiness,
  useUpdateBusiness,
  useDeleteBusiness,
  useStartScrape,
  useEnrichBusiness,
  useBatchEnrichment,
} from '@/hooks/mutations';

export default function CompleteExample() {
  // ==========================================================================
  // State
  // ==========================================================================

  const [page, setPage] = useState(1);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [scrapeJobId, setScrapeJobId] = useState<string | null>(null);

  // ==========================================================================
  // Query Hooks
  // ==========================================================================

  // Paginated businesses list with filters
  const {
    data: businessesData,
    isLoading: businessesLoading,
    error: businessesError,
  } = useBusinesses({
    page,
    limit: 20,
    enrichment_status: 'pending',
  });

  // Single business details
  const { data: selectedBusiness } = useBusiness(selectedBusinessId);

  // Dashboard statistics (auto-polls every 30s)
  const { data: stats } = useStats();

  // Scraping job status (auto-polls while active)
  const { data: scrapeJob } = useScrapeStatus(scrapeJobId);

  // ==========================================================================
  // Mutation Hooks
  // ==========================================================================

  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();
  const startScrape = useStartScrape();
  const enrichBusiness = useEnrichBusiness();
  const batchEnrich = useBatchEnrichment();

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleCreateBusiness = async () => {
    await createBusiness.mutateAsync({
      name: 'New Business',
      city: 'Freehold',
      phone: '555-1234',
    });
  };

  const handleUpdateBusiness = async (id: number) => {
    await updateBusiness.mutateAsync({
      id,
      updates: { city: 'Manalapan' },
    });
  };

  const handleDeleteBusiness = async (id: number) => {
    if (confirm('Delete this business?')) {
      await deleteBusiness.mutateAsync(id);
    }
  };

  const handleStartScrape = async () => {
    const result = await startScrape.mutateAsync({
      location: 'Route 9, Freehold, NJ',
      radius: 1,
      business_type: 'restaurant',
      max_results: 50,
    });
    setScrapeJobId(result.jobId);
  };

  const handleEnrichBusiness = async (id: number) => {
    await enrichBusiness.mutateAsync(id);
  };

  const handleBatchEnrich = async () => {
    await batchEnrich.mutateAsync(10);
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="p-8">
      {/* Dashboard Stats */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard Statistics</h2>
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-100 rounded">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm">Total Businesses</div>
            </div>
            <div className="p-4 bg-green-100 rounded">
              <div className="text-3xl font-bold">{stats.enriched}</div>
              <div className="text-sm">Enriched</div>
            </div>
            <div className="p-4 bg-yellow-100 rounded">
              <div className="text-3xl font-bold">{stats.pending}</div>
              <div className="text-sm">Pending</div>
            </div>
            <div className="p-4 bg-red-100 rounded">
              <div className="text-3xl font-bold">{stats.failed}</div>
              <div className="text-sm">Failed</div>
            </div>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={handleCreateBusiness}
            disabled={createBusiness.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {createBusiness.isPending ? 'Creating...' : 'Create Business'}
          </button>

          <button
            onClick={handleStartScrape}
            disabled={startScrape.isPending}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            {startScrape.isPending ? 'Starting...' : 'Start Scraping'}
          </button>

          <button
            onClick={handleBatchEnrich}
            disabled={batchEnrich.isPending}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {batchEnrich.isPending ? 'Enriching...' : 'Batch Enrich (10)'}
          </button>
        </div>
      </section>

      {/* Scraping Job Status */}
      {scrapeJobId && scrapeJob && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Scraping Progress</h2>
          <div className="p-4 bg-gray-100 rounded">
            <div className="mb-2">
              <strong>Job ID:</strong> {scrapeJobId}
            </div>
            <div className="mb-2">
              <strong>Status:</strong>{' '}
              <span
                className={
                  scrapeJob.status === 'completed'
                    ? 'text-green-600'
                    : scrapeJob.status === 'failed'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }
              >
                {scrapeJob.status}
              </span>
            </div>
            <div className="mb-2">
              <strong>Progress:</strong> {scrapeJob.progress}%
            </div>
            {scrapeJob.status === 'completed' && scrapeJob.result && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <div>Found: {scrapeJob.result.found || 0} businesses</div>
                <div>Saved: {scrapeJob.result.saved || 0} businesses</div>
              </div>
            )}
            {scrapeJob.status === 'failed' && (
              <div className="mt-4 p-3 bg-red-50 rounded text-red-600">
                Error: {scrapeJob.failedReason}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Business List */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Businesses</h2>

        {businessesLoading && <div>Loading businesses...</div>}

        {businessesError && (
          <div className="text-red-600">Error: {businessesError.message}</div>
        )}

        {businessesData && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {businessesData.data.length} of {businessesData.meta.total} businesses
              (Page {businessesData.meta.page} of {businessesData.meta.totalPages})
            </div>

            <div className="space-y-2">
              {businessesData.data.map((business) => (
                <div
                  key={business.id}
                  className="p-4 border rounded hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{business.name}</h3>
                      <p className="text-sm text-gray-600">
                        {business.city}, {business.state}
                      </p>
                      <p className="text-sm">
                        Status:{' '}
                        <span
                          className={
                            business.enrichment_status === 'enriched'
                              ? 'text-green-600'
                              : business.enrichment_status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }
                        >
                          {business.enrichment_status}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBusinessId(business.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        View
                      </button>

                      {business.enrichment_status === 'pending' && (
                        <button
                          onClick={() => handleEnrichBusiness(business.id)}
                          disabled={enrichBusiness.isPending}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                        >
                          Enrich
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateBusiness(business.id)}
                        disabled={updateBusiness.isPending}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm disabled:opacity-50"
                      >
                        Update
                      </button>

                      <button
                        onClick={() => handleDeleteBusiness(business.id)}
                        disabled={deleteBusiness.isPending}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {businessesData.meta.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === businessesData.meta.totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

      {/* Selected Business Detail */}
      {selectedBusinessId && selectedBusiness && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Business Details</h2>
          <div className="p-4 bg-gray-100 rounded">
            <button
              onClick={() => setSelectedBusinessId(null)}
              className="mb-4 px-3 py-1 bg-gray-300 rounded text-sm"
            >
              Close
            </button>

            <div className="space-y-2">
              <div>
                <strong>Name:</strong> {selectedBusiness.name}
              </div>
              <div>
                <strong>Address:</strong> {selectedBusiness.address || 'N/A'}
              </div>
              <div>
                <strong>City:</strong> {selectedBusiness.city || 'N/A'}
              </div>
              <div>
                <strong>Phone:</strong> {selectedBusiness.phone || 'N/A'}
              </div>
              <div>
                <strong>Website:</strong>{' '}
                {selectedBusiness.website ? (
                  <a
                    href={selectedBusiness.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {selectedBusiness.website}
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
              <div>
                <strong>Enrichment Status:</strong> {selectedBusiness.enrichment_status}
              </div>
              <div>
                <strong>Contacts:</strong> {selectedBusiness.contacts?.length || 0}
              </div>
              {selectedBusiness.contacts && selectedBusiness.contacts.length > 0 && (
                <div className="mt-4">
                  <strong>Contact Details:</strong>
                  <ul className="mt-2 space-y-2">
                    {selectedBusiness.contacts.map((contact) => (
                      <li key={contact.id} className="p-2 bg-white rounded">
                        <div>{contact.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{contact.email || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{contact.title || 'N/A'}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
