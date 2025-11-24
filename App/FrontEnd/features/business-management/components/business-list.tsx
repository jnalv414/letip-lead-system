/**
 * Business List Component
 *
 * Displays paginated list of businesses with real-time updates.
 * Co-located with the business-management feature.
 */

'use client';

import { useState } from 'react';
import { useBusinesses } from '../hooks/use-businesses';
import { useBusinessWebSocket } from '../hooks/use-business-websocket';
import type { BusinessFilters } from '../types/business.types';

interface BusinessListProps {
  initialFilters?: BusinessFilters;
}

export function BusinessList({ initialFilters = {} }: BusinessListProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BusinessFilters>(initialFilters);

  // Fetch businesses with filters
  const { data, isLoading, error } = useBusinesses({
    page,
    limit: 20,
    ...filters,
  });

  // Subscribe to real-time updates
  const { isConnected } = useBusinessWebSocket();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading businesses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-400">
          Error loading businesses: {error.message}
        </div>
      </div>
    );
  }

  const businesses = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* WebSocket connection indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Businesses</h2>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-slate-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Business table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                City
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                Contacts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {businesses.map((business) => (
              <tr
                key={business.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-slate-100">
                  {business.name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {business.city || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {business.industry || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      business.enrichment_status === 'enriched'
                        ? 'bg-green-500/10 text-green-400'
                        : business.enrichment_status === 'failed'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {business.enrichment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {business._count?.contacts || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {businesses.length} of {meta.total} businesses
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-slate-400">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
