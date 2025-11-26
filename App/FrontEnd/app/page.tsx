'use client';

import { useRouter } from 'next/navigation';
import { useSocketStatus } from '@/core/providers/websocket-provider';
import { AppShell } from '@/components/layout';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  MoreHorizontal,
  Send,
  MessageSquare,
  MousePointerClick,
  Reply,
  Bot,
  Loader2,
  ArrowRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { useStats } from '@/hooks/queries/use-stats';
import { useBusinesses } from '@/hooks/queries/use-businesses';
import type { Business } from '@/types/api';

// Type for transformed business data
interface BusinessCardData {
  id: number;
  name: string;
  city: string;
  contacts: number;
  status: 'pending' | 'enriched' | 'failed';
  progress: number;
  emailStatus: 'none' | 'pending' | 'sent' | 'opened' | 'replied';
  emailsSent: number;
}

// Static mock data for features requiring backend analytics endpoints
// TODO: Replace with real API when analytics endpoints are built
const weeklyLeadsData = [
  { day: 'Mon', leads: 45, enriched: 32 },
  { day: 'Tue', leads: 52, enriched: 41 },
  { day: 'Wed', leads: 38, enriched: 28 },
  { day: 'Thu', leads: 65, enriched: 52 },
  { day: 'Fri', leads: 58, enriched: 48 },
  { day: 'Sat', leads: 32, enriched: 24 },
  { day: 'Sun', leads: 28, enriched: 20 },
];

const sourceData = [
  { source: 'Google Maps', count: 425 },
  { source: 'LinkedIn', count: 215 },
  { source: 'Manual', count: 102 },
  { source: 'Referral', count: 75 },
];

const recentActivity = [
  { id: 1, action: 'New lead added', business: 'Shore Electric LLC', time: '2 min ago', type: 'create' },
  { id: 2, action: 'Enrichment complete', business: 'Garden State HVAC', time: '15 min ago', type: 'enrich' },
  { id: 3, action: 'Contact found', business: 'Atlantic Roofing', time: '32 min ago', type: 'contact' },
  { id: 4, action: 'Outreach sent', business: 'Premier Landscaping', time: '1 hr ago', type: 'outreach' },
  { id: 5, action: 'New lead added', business: 'Monmouth Auto Body', time: '2 hr ago', type: 'create' },
];

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  chart
}: {
  title: string;
  value: number;
  change: number;
  icon: any;
  color: string;
  chart?: React.ReactNode;
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl p-6 glass-card-glow group"
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center icon-breathe"
          style={{ background: `${color}20` }}
          whileHover={{ scale: 1.1 }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </motion.div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <motion.p
        className="text-3xl font-bold text-white"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <span className="group-hover:glow-pulse-purple transition-all duration-300">
          <NumberTicker value={value} />
        </span>
      </motion.p>

      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none inner-glow" />

      {chart && (
        <div className="mt-4 h-16">
          {chart}
        </div>
      )}
    </motion.div>
  );
}

// Business Card Component
function BusinessCard({ business, onClick }: { business: BusinessCardData; onClick?: () => void }) {
  const statusColors = {
    enriched: { bg: '#10d98020', text: '#10d980', icon: CheckCircle2, glow: 'glow-success' },
    pending: { bg: '#f59e0b20', text: '#f59e0b', icon: Clock, glow: 'glow-warning' },
    failed: { bg: '#ef444420', text: '#ef4444', icon: XCircle, glow: 'glow-error' },
  };

  const emailStatusConfig = {
    none: { bg: '#64748b20', text: '#64748b', label: 'No emails' },
    pending: { bg: '#f59e0b20', text: '#f59e0b', label: 'Queued' },
    sent: { bg: '#8b5cf620', text: '#8b5cf6', label: 'Sent' },
    opened: { bg: '#3b82f620', text: '#3b82f6', label: 'Opened' },
    replied: { bg: '#10d98020', text: '#10d980', label: 'Replied' },
  };

  const status = statusColors[business.status as keyof typeof statusColors];
  const emailConfig = emailStatusConfig[business.emailStatus as keyof typeof emailStatusConfig];
  const StatusIcon = status.icon;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl cursor-pointer glass-card-premium p-6 min-h-[200px] w-full text-left focus:outline-none focus:ring-2 focus:ring-violet-500/50"
    >
      {/* Header with avatar and status */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-violet-500 to-indigo-500"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {business.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </motion.div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white leading-tight text-base mb-1.5">{business.name}</h3>
            <p className="text-slate-400 flex items-center text-sm gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {business.city}
            </p>
          </div>
        </div>
        <motion.div
          className={`w-9 h-9 shrink-0 ml-3 rounded-lg flex items-center justify-center ${status.glow}`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400 }}
          style={{ background: status.bg }}
        >
          <StatusIcon className="w-4.5 h-4.5" style={{ color: status.text }} />
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-5 mb-4 text-sm">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />{business.contacts}
        </span>
        <span className="flex items-center gap-1.5" style={{ color: emailConfig.text }}>
          <Mail className="w-3.5 h-3.5" />{emailConfig.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 mb-4 rounded-full overflow-hidden bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${business.progress}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full progress-glow"
          style={{
            background: business.status === 'enriched'
              ? 'linear-gradient(90deg, #10d980 0%, #8b5cf6 100%)'
              : business.status === 'pending'
              ? 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)'
              : '#ef4444',
          }}
        />
      </div>

      {/* Email badge */}
      {business.emailsSent > 0 && (
        <motion.div
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs"
          whileHover={{ scale: 1.05 }}
          style={{ background: emailConfig.bg, color: emailConfig.text }}
        >
          <Send className="w-3 h-3" />
          {business.emailsSent} emails sent
        </motion.div>
      )}
    </motion.button>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const typeColors = {
    create: '#8b5cf6',
    enrich: '#10d980',
    contact: '#3b82f6',
    outreach: '#f59e0b',
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: typeColors[activity.type as keyof typeof typeColors] }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{activity.action}</p>
        <p className="text-xs text-slate-400 truncate">{activity.business}</p>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
    </div>
  );
}

// AI Chatbot Component - PREMIUM Hero Section
function AIChatbot() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);

  const suggestedQuestions = [
    'How many leads were enriched today?',
    'Which businesses need follow-up?',
    'Show email open rates',
    'Top performing outreach campaigns',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    // Simulate AI response (in production, this would call your AI API)
    setTimeout(() => {
      const responses: Record<string, string> = {
        'enriched': 'Today, 47 new leads were enriched with contact information. 38 emails found, 12 phone numbers discovered. Your enrichment rate is up 12% from yesterday!',
        'follow-up': 'There are 23 businesses that need follow-up: 15 opened emails but haven\'t replied, 8 clicked links but no conversion. I recommend prioritizing Acme Corporation and Tech Solutions LLC.',
        'open rates': 'Current email open rate is 63.7% (156/245 sent). This is 12% above industry average! Best performing subject line: "Quick question about your services"',
        'outreach': 'Top campaign: "Local Business Introduction" - 72% open rate, 34% reply rate. Worst: "Cold Outreach Q4" - 28% open rate. Consider A/B testing subject lines.',
      };

      const key = Object.keys(responses).find(k => query.toLowerCase().includes(k));
      const aiResponse = key ? responses[key] : `Based on your current data: You have 847 total leads, 612 enriched (72.3% rate). 245 outreach emails sent with 17.1% conversion to replies. Top performing city: Freehold with 34 businesses. Would you like me to drill down into any specific metric?`;

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsLoading(false);
    }, 1000);

    setQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
      className="rounded-3xl p-10 lg:p-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 30%, rgba(20, 20, 35, 0.95) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        boxShadow: '0 20px 80px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Multiple decorative glows for depth - Enhanced visibility */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-2xl pointer-events-none orb-animated glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-2xl pointer-events-none orb-animated-slow glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0.15) 40%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.1) 30%, transparent 60%)' }}
      />
      {/* Additional accent orb for visual richness */}
      <div
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full blur-xl pointer-events-none orb-animated-fast"
        style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Header with large icon and gradient text */}
        <div className="flex items-start gap-6 mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
              boxShadow: '0 12px 40px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          >
            <Bot className="w-10 h-10 text-white" />
          </motion.div>
          <div className="pt-1">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI Lead Assistant
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-300/90 max-w-xl"
            >
              Ask anything about your leads, enrichment status, or outreach performance
            </motion.p>
          </div>
        </div>

        {/* Messages area with more space */}
        <div className="space-y-4 mb-8 min-h-[120px] max-h-[200px] overflow-y-auto">
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {suggestedQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4, type: 'spring' }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setQuery(q)}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.3) 100%)',
                    border: '1px solid rgba(139,92,246,0.5)',
                    boxShadow: '0 8px 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              msg.role === 'user' ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[75%] px-5 py-4 rounded-2xl rounded-br-md text-sm text-violet-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.25) 100%)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      boxShadow: '0 4px 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-start"
                >
                  <div
                    className="max-w-[75%] px-5 py-4 rounded-2xl rounded-bl-md text-sm text-slate-100 backdrop-blur-sm"
                    style={{
                      background: 'rgba(30, 41, 59, 0.85)',
                      border: '1px solid rgba(71, 85, 105, 0.5)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="leading-relaxed">{msg.content}</span>
                    </div>
                  </div>
                </motion.div>
              )
            ))
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800/90 px-6 py-4 rounded-2xl rounded-bl-md border border-slate-700/60 shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  <span className="text-sm text-slate-300">Analyzing your data...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Premium Input */}
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1 group">
            {/* Animated glow border effect */}
            <motion.div
              className="absolute -inset-1 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500"
              style={{
                background: 'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5), rgba(6,182,212,0.5), rgba(139,92,246,0.5))',
                backgroundSize: '300% 100%',
                filter: 'blur(12px)',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about leads, enrichment, contact status, email campaigns..."
              className="relative w-full px-6 py-5 rounded-2xl bg-slate-900/60 border border-slate-600/50 text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all"
              style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
              }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden px-8 py-5 rounded-2xl bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 bg-[length:200%_100%] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            style={{
              boxShadow: '0 8px 40px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <Send className="relative w-6 h-6 text-white" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg p-3 text-sm glass-tooltip"
    >
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected } = useSocketStatus();

  // Fetch real data from APIs
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: businessesData, isLoading: businessesLoading } = useBusinesses({ limit: 6 });

  // Calculate enrichment pie chart data from real stats
  const enrichmentStatusData = useMemo(() => {
    if (!stats) return [
      { name: 'Enriched', value: 0, color: '#10d980' },
      { name: 'Pending', value: 0, color: '#f59e0b' },
      { name: 'Failed', value: 0, color: '#ef4444' },
    ];

    const failed = stats.totalBusinesses - stats.enrichedBusinesses - stats.pendingEnrichment;
    return [
      { name: 'Enriched', value: stats.enrichedBusinesses, color: '#10d980' },
      { name: 'Pending', value: stats.pendingEnrichment, color: '#f59e0b' },
      { name: 'Failed', value: Math.max(0, failed), color: '#ef4444' },
    ];
  }, [stats]);

  // Calculate outreach funnel data from real stats
  const outreachData = useMemo(() => {
    if (!stats) return [
      { name: 'Sent', value: 0, color: '#8b5cf6' },
      { name: 'Opened', value: 0, color: '#3b82f6' },
      { name: 'Clicked', value: 0, color: '#06b6d4' },
      { name: 'Replied', value: 0, color: '#10d980' },
    ];

    // Use real messagesSent, calculate approximate funnel (TODO: add backend tracking)
    const sent = stats.messagesSent + stats.messagesPending;
    return [
      { name: 'Sent', value: sent, color: '#8b5cf6' },
      { name: 'Opened', value: Math.floor(sent * 0.63), color: '#3b82f6' },
      { name: 'Clicked', value: Math.floor(sent * 0.36), color: '#06b6d4' },
      { name: 'Replied', value: Math.floor(sent * 0.17), color: '#10d980' },
    ];
  }, [stats]);

  // Transform businesses data for display
  const topBusinesses = useMemo((): BusinessCardData[] => {
    const businesses = businessesData?.data || [];
    if (!businesses.length) return [];
    return businesses.map((b: Business) => ({
      id: b.id,
      name: b.name,
      city: b.city || 'Unknown',
      contacts: b._count?.contacts || b.contacts?.length || 0,
      status: b.enrichment_status,
      progress: b.enrichment_status === 'enriched' ? 100 : b.enrichment_status === 'pending' ? 50 : 0,
      emailStatus: (b._count?.outreach_messages && b._count.outreach_messages > 0 ? 'sent' : 'none') as BusinessCardData['emailStatus'],
      emailsSent: b._count?.outreach_messages || 0,
    }));
  }, [businessesData]);

  return (
    <AppShell title="Dashboard">
      {/* Hero Section - AI Chatbot */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wider uppercase ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : 'bg-amber-500/8 text-amber-400/80 border border-amber-500/20'
            }`}
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {isConnected ? (
              <>
                <motion.div
                  className="relative flex items-center justify-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-400/60 animate-ping" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
                </motion.div>
                <Wifi size={14} className="opacity-80" />
                <span>Live</span>
              </>
            ) : (
              <>
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <WifiOff size={14} className="opacity-80" />
                </motion.div>
                <span>Connecting</span>
              </>
            )}
          </motion.div>
        </div>
        <AIChatbot />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={stats?.totalBusinesses ?? 0}
          change={12.5}
          icon={Building2}
          color="#8b5cf6"
        />
        <StatCard
          title="Enriched"
          value={stats?.enrichedBusinesses ?? 0}
          change={18.2}
          icon={Sparkles}
          color="#10d980"
        />
        <StatCard
          title="Total Contacts"
          value={stats?.totalContacts ?? 0}
          change={8.4}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Pending"
          value={stats?.pendingEnrichment ?? 0}
          change={-5.2}
          icon={Clock}
          color="#f59e0b"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-8">
        {/* Leads Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 glass-card inner-glow"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Weekly Leads</h2>
              <p className="text-sm text-slate-400">Lead generation this week</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500" />
                Total Leads
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                Enriched
              </span>
            </div>
          </div>

          <div className="w-full" style={{ height: '288px' }}>
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={weeklyLeadsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="enrichedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10d980" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10d980" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                  name="Total Leads"
                />
                <Area
                  type="monotone"
                  dataKey="enriched"
                  stroke="#10d980"
                  strokeWidth={2}
                  fill="url(#enrichedGradient)"
                  name="Enriched"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Enrichment Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 glass-card inner-glow"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Enrichment Status</h2>
          <p className="text-sm text-slate-400 mb-4">Distribution overview</p>

          <div className="w-full" style={{ height: '192px' }}>
            <ResponsiveContainer width="100%" height={192}>
              <PieChart>
                <Pie
                  data={enrichmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {enrichmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2">
            {enrichmentStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Outreach Funnel Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 mb-8 glass-card inner-glow"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Email Outreach Funnel</h2>
            <p className="text-sm text-slate-400">Track automated personalized email performance</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {outreachData[0].value > 0
                ? ((outreachData[3].value / outreachData[0].value) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-xs text-slate-400">Overall conversion rate</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {outreachData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="relative p-5 rounded-xl text-center glow-pulse"
              style={{
                background: `${item.color}15`,
                border: `1px solid ${item.color}30`,
              }}
            >
              <motion.div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                style={{ background: `${item.color}25` }}
              >
                {index === 0 && <Send className="w-6 h-6" style={{ color: item.color }} />}
                {index === 1 && <Mail className="w-6 h-6" style={{ color: item.color }} />}
                {index === 2 && <MousePointerClick className="w-6 h-6" style={{ color: item.color }} />}
                {index === 3 && <Reply className="w-6 h-6" style={{ color: item.color }} />}
              </motion.div>
              <p className="text-3xl font-bold text-white mb-1">
                <NumberTicker value={item.value} />
              </p>
              <p className="text-sm font-medium" style={{ color: item.color }}>{item.name}</p>
              {index > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {outreachData[index - 1].value > 0
                    ? ((item.value / outreachData[index - 1].value) * 100).toFixed(0)
                    : '0'}% of previous
                </p>
              )}
              {index < outreachData.length - 1 && (
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: 'rgba(30, 30, 50, 1)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-slate-400 text-xs">→</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Businesses Grid & Activity */}
      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-8">
        {/* Top Businesses Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 glass-card inner-glow"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Top Businesses</h2>
              <p className="text-sm text-slate-400">Most active leads with enrichment progress</p>
            </div>
            <button
              onClick={() => router.push('/leads')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {topBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onClick={() => router.push('/leads')}
              />
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 glass-card-glow"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Recent Activity</h2>
          <p className="text-sm text-slate-400 mb-4">Latest actions</p>

          <div className="space-y-1">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lead Sources Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6 glass-card inner-glow"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Lead Sources</h2>
            <p className="text-sm text-slate-400">Where your leads come from</p>
          </div>
        </div>

        <div className="w-full" style={{ height: '208px' }}>
          <ResponsiveContainer width="100%" height={208}>
            <BarChart data={sourceData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="source"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 13 }}
                width={100}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                fill="url(#barGradient)"
                animationBegin={0}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </AppShell>
  );
}
