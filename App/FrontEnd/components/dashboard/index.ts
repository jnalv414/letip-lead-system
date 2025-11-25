/**
 * Dashboard Components
 *
 * Central export file for all dashboard feature components.
 * Organized by category for better maintainability.
 */

// Stats Components
export { DashboardStats } from './stats/dashboard-stats';
export { ConnectionStatus } from './stats/connection-status';

// Section Components (New Design System)
export { MyLeadsSection } from './sections/my-leads-section';
export { PipelineOverviewSection } from './sections/pipeline-overview-section';
export { TopBusinessesGrid } from './sections/top-businesses-grid';
export { RecentBusinessesTable } from './sections/recent-businesses-table';

// Visualization Components
export { BusinessGrowthChart } from './visualizations/business-growth-chart';
export { LeadSourcesChart } from './visualizations/lead-sources-chart';
export { CalendarWidget } from './visualizations/calendar-widget';
export { TopBusinessesList } from './visualizations/top-businesses-list';
export { PipelineBubbles } from './visualizations/pipeline-bubbles';
export { GeographicStats } from './visualizations/geographic-stats';

// Activity Components
export { ActivityFeed } from './activity/activity-feed';
