'use client';

import { useSocketStatus } from '@/core/providers/websocket-provider';
import { AppShell } from '@/components/layout';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { useState } from 'react';
import { NumberTicker } from '@/components/magicui/number-ticker';

// Mock data
const weeklyLeadsData = [
  { day: 'Mon', leads: 45, enriched: 32 },
  { day: 'Tue', leads: 52, enriched: 41 },
  { day: 'Wed', leads: 38, enriched: 28 },
  { day: 'Thu', leads: 65, enriched: 52 },
  { day: 'Fri', leads: 58, enriched: 48 },
  { day: 'Sat', leads: 32, enriched: 24 },
  { day: 'Sun', leads: 28, enriched: 20 },
];

const enrichmentStatusData = [
  { name: 'Enriched', value: 612, color: '#10d980' },
  { name: 'Pending', value: 185, color: '#f59e0b' },
  { name: 'Failed', value: 50, color: '#ef4444' },
];

const sourceData = [
  { source: 'Google Maps', count: 425 },
  { source: 'LinkedIn', count: 215 },
  { source: 'Manual', count: 102 },
  { source: 'Referral', count: 75 },
];

const topBusinesses = [
  { id: 1, name: 'Acme Corporation', city: 'Freehold', contacts: 12, status: 'enriched', progress: 100, emailStatus: 'sent', emailsSent: 3 },
  { id: 2, name: 'Tech Solutions LLC', city: 'Marlboro', contacts: 8, status: 'enriched', progress: 85, emailStatus: 'opened', emailsSent: 2 },
  { id: 3, name: 'Global Enterprises', city: 'Manalapan', contacts: 15, status: 'pending', progress: 60, emailStatus: 'pending', emailsSent: 0 },
  { id: 4, name: 'Innovation Hub', city: 'Holmdel', contacts: 5, status: 'enriched', progress: 100, emailStatus: 'replied', emailsSent: 1 },
  { id: 5, name: 'Prime Services', city: 'Colts Neck', contacts: 3, status: 'failed', progress: 0, emailStatus: 'none', emailsSent: 0 },
  { id: 6, name: 'Elite Partners', city: 'Freehold', contacts: 10, status: 'enriched', progress: 90, emailStatus: 'sent', emailsSent: 4 },
];

const outreachData = [
  { name: 'Sent', value: 245, color: '#8b5cf6' },
  { name: 'Opened', value: 156, color: '#3b82f6' },
  { name: 'Clicked', value: 89, color: '#06b6d4' },
  { name: 'Replied', value: 42, color: '#10d980' },
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
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">
        <NumberTicker value={value} />
      </p>

      {chart && (
        <div className="mt-4 h-16">
          {chart}
        </div>
      )}
    </motion.div>
  );
}

// Business Card Component
function BusinessCard({ business }: { business: typeof topBusinesses[0] }) {
  const statusColors = {
    enriched: { bg: '#10d98020', text: '#10d980', icon: CheckCircle2 },
    pending: { bg: '#f59e0b20', text: '#f59e0b', icon: Clock },
    failed: { bg: '#ef444420', text: '#ef4444', icon: XCircle },
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.15)' }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 35, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            }}
          >
            {business.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{business.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {business.city}
            </p>
          </div>
        </div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: status.bg }}
        >
          <StatusIcon className="w-3.5 h-3.5" style={{ color: status.text }} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="text-slate-400">
          <Users className="w-3 h-3 inline mr-1" />{business.contacts}
        </span>
        <span style={{ color: emailConfig.text }}>
          <Mail className="w-3 h-3 inline mr-1" />{emailConfig.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${business.progress}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full"
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
        <div
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mt-1"
          style={{ background: emailConfig.bg, color: emailConfig.text }}
        >
          <Send className="w-3 h-3" />
          {business.emailsSent} emails sent
        </div>
      )}
    </motion.div>
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

// AI Chatbot Component - Hero Section
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(20, 20, 35, 0.95) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        boxShadow: '0 12px 48px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Lead Assistant</h2>
            <p className="text-sm text-slate-300">Ask anything about your leads, enrichment status, or outreach performance</p>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-6 max-h-40 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setQuery(q)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.25) 100%)',
                    border: '1px solid rgba(139,92,246,0.5)',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          ) : (
            messages.map((msg, i) => (
              msg.role === 'user' ? (
                /* User message with slide-in from right and gradient glow */
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm text-violet-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.2) 100%)',
                      border: '1px solid rgba(139,92,246,0.35)',
                      boxShadow: '0 0 20px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ) : (
                /* AI message with slide-in from left and bot icon */
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm text-slate-100 backdrop-blur-sm"
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(71, 85, 105, 0.4)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span>{msg.content}</span>
                    </div>
                  </div>
                </motion.div>
              )
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/80 px-5 py-3 rounded-2xl rounded-bl-md border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="text-sm text-slate-400">Analyzing your data...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          {/* Input with animated glow border effect */}
          <div className="relative flex-1 group">
            {/* Animated glow border effect */}
            <div
              className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(90deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4), rgba(6,182,212,0.4))',
                filter: 'blur(8px)',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about leads, enrichment, contact status, email campaigns..."
              className="relative w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
            />
          </div>

          {/* Send button with shimmer sweep effect */}
          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              boxShadow: '0 0 30px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Shimmer sweep effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <Send className="relative w-5 h-5 text-white" />
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
    <div
      className="rounded-lg p-3 text-sm"
      style={{
        background: 'rgba(20, 20, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
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
  const { isConnected } = useSocketStatus();

  return (
    <AppShell title="Dashboard">
      {/* Hero Section - AI Chatbot */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Live Updates Active' : 'Connecting...'}
          </div>
        </div>
        <AIChatbot />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard
          title="Total Leads"
          value={847}
          change={12.5}
          icon={Building2}
          color="#8b5cf6"
        />
        <StatCard
          title="Enriched"
          value={612}
          change={18.2}
          icon={Sparkles}
          color="#10d980"
        />
        <StatCard
          title="Total Contacts"
          value={1284}
          change={8.4}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Pending"
          value={185}
          change={-5.2}
          icon={Clock}
          color="#f59e0b"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Leads Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
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

          <div style={{ width: '100%', height: '288px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyLeadsData}>
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
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-2">Enrichment Status</h2>
          <p className="text-sm text-slate-400 mb-4">Distribution overview</p>

          <div style={{ width: '100%', height: '192px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enrichmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {enrichmentStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
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
        className="rounded-2xl p-6 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Email Outreach Funnel</h2>
            <p className="text-sm text-slate-400">Track automated personalized email performance</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">17.1%</p>
            <p className="text-xs text-slate-400">Overall conversion rate</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {outreachData.map((item, index) => (
            <div
              key={item.name}
              className="relative p-5 rounded-xl text-center"
              style={{
                background: `${item.color}15`,
                border: `1px solid ${item.color}30`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${item.color}25` }}
              >
                {index === 0 && <Send className="w-6 h-6" style={{ color: item.color }} />}
                {index === 1 && <Mail className="w-6 h-6" style={{ color: item.color }} />}
                {index === 2 && <MousePointerClick className="w-6 h-6" style={{ color: item.color }} />}
                {index === 3 && <Reply className="w-6 h-6" style={{ color: item.color }} />}
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                <NumberTicker value={item.value} />
              </p>
              <p className="text-sm font-medium" style={{ color: item.color }}>{item.name}</p>
              {index > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {((item.value / outreachData[index - 1].value) * 100).toFixed(0)}% of previous
                </p>
              )}
              {index < outreachData.length - 1 && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{ background: 'rgba(30, 30, 50, 1)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-slate-400 text-xs">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Businesses Grid & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Top Businesses Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Top Businesses</h2>
              <p className="text-sm text-slate-400">Most active leads with enrichment progress</p>
            </div>
            <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              View All
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {topBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
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
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Lead Sources</h2>
            <p className="text-sm text-slate-400">Where your leads come from</p>
          </div>
        </div>

        <div style={{ width: '100%', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData} layout="vertical">
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
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </AppShell>
  );
}
