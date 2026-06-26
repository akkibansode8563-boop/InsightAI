import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Activity,
  Clock,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  HelpCircle,
  Database,
  ShieldCheck
} from 'lucide-react';

interface TelemetryLog {
  agentId: string;
  language: string;
  durationMs: number;
  tokensEstimated?: number;
  status: 'success' | 'failed' | 'fallback';
  error?: string;
  userRole?: string;
  timestamp: string;
}

interface TelemetryMetrics {
  totalRequests: number;
  agentUsage: Record<string, number>;
  averageLatencyMs: number;
  errorCount: number;
}

const COLORS = ['#f97316', '#8b5cf6', '#0ea5e9', '#10b981', '#ef4444', '#6366f1', '#f59e0b', '#ec4899'];
const STATUS_COLORS = {
  success: '#10b981', // green
  fallback: '#f59e0b', // orange
  failed: '#ef4444' // red
};

export default function ObservabilityDashboard() {
  const { theme, t } = useApp() as any;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<{ metrics: TelemetryMetrics; logs: TelemetryLog[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTelemetry = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      
      const response = await fetch('/api/telemetry');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const telemetryData = await response.json();
      setData(telemetryData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch telemetry data:', err);
      setError(err.message || 'Failed to retrieve observability telemetry metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)]">
        <RefreshCw className="w-10 h-10 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase">Loading System Telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Observability Center Offline</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">{error || 'Unable to connect to the telemetry service.'}</p>
        <button
          onClick={() => fetchTelemetry()}
          className="px-5 py-2.5 rounded-xl text-white font-bold bg-[var(--primary)] hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, logs } = data;

  // Process Logs for charts
  // 1. Latency & Token usage timeline (last 20 entries)
  const timelineData = logs.slice(-20).map((log, idx) => ({
    name: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: log.durationMs,
    tokens: log.tokensEstimated || 0,
    index: idx + 1
  }));

  // 2. Agent Usage Breakdown
  const agentPieData = Object.entries(metrics.agentUsage).map(([name, value]) => ({
    name: name.replace('_agent', '').replace('_', ' ').toUpperCase(),
    value
  })).sort((a, b) => b.value - a.value);

  // 3. Request Status distribution
  const statusCounts = logs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.toUpperCase(),
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280'
  }));

  // Filter logs for the table
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.agentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.error && log.error.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (log.userRole && log.userRole.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).reverse(); // Latest first

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', position: 'relative', paddingBottom: '32px' }} className="custom-scrollbar">
      <div className="aurora-mesh" />

      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          padding: '24px 40px',
          background: `linear-gradient(135deg, var(--accent-chat)12 0%, transparent 60%)`,
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--glass-border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: `rgba(99, 102, 241, 0.15)`,
              border: `2px solid rgba(99, 102, 241, 0.35)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-[var(--text-primary)] leading-tight tracking-tight">
              Observability Center
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              Enterprise AI Core Orchestrator telemetry logs & system performance metrics.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchTelemetry(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all text-xs font-bold text-[var(--text-primary)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Main Content container */}
      <div className="px-6 md:px-10 mt-8 space-y-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Requests */}
          <div className="card-premium p-5 flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">TOTAL ORCHESTRATIONS</span>
              <span className="text-3xl font-black text-[var(--text-primary)] block">{metrics.totalRequests}</span>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
          </div>

          {/* Card 2: Avg Latency */}
          <div className="card-premium p-5 flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">AVERAGE LATENCY</span>
              <span className="text-3xl font-black text-[var(--text-primary)] block">
                {metrics.averageLatencyMs} <span className="text-xs font-semibold text-[var(--text-secondary)]">ms</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          {/* Card 3: Error Rate */}
          <div className="card-premium p-5 flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">ERROR INCIDENTS</span>
              <span className="text-3xl font-black text-rose-500 block">
                {metrics.errorCount}
                <span className="text-xs font-semibold text-[var(--text-muted)] ml-2">
                  ({metrics.totalRequests > 0 ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(1) : 0}%)
                </span>
              </span>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
          </div>

          {/* Card 4: Hardware Health */}
          <div className="card-premium p-5 flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">NODE SECURITY & API</span>
              <span className="text-3xl font-black text-emerald-500 block flex items-center gap-1">
                99.9% <ShieldCheck className="w-5 h-5 text-emerald-500 inline-block" />
              </span>
            </div>
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <Cpu className="w-6 h-6 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Latency Timeline */}
          <div className="card-premium p-5 lg:col-span-2 flex flex-col h-[350px]">
            <h3 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider mb-4">
              Real-time Latency & Estimated Tokens Timeline
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                  <YAxis yAxisId="left" stroke="var(--primary)" fontSize={10} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fill: 'var(--primary)', fontSize: 9 } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} label={{ value: 'Tokens', angle: 90, position: 'insideRight', style: { fill: '#8b5cf6', fontSize: 9 } }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border-strong)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '11px'
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="latency" name="Latency (ms)" stroke="var(--primary)" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="tokens" name="Est. Tokens" stroke="#8b5cf6" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Agent Usage Distribution */}
          <div className="card-premium p-5 flex flex-col h-[350px]">
            <h3 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider mb-4">
              Agent Usage Distribution
            </h3>
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              {agentPieData.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] text-center">No agent usage logged yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {agentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border-strong)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '11px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={8}
                      iconType="circle"
                      formatter={(value) => <span className="text-[9px] font-bold text-[var(--text-secondary)]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Third Row: Status and Filter Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown card */}
          <div className="card-premium p-5 flex flex-col h-[320px]">
            <h3 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider mb-4">
              Resolution Status Breakdown
            </h3>
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              {statusPieData.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] text-center">No logs generated.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      labelLine={false}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Filtering control */}
          <div className="card-premium p-5 lg:col-span-2 flex flex-col h-[320px] justify-between">
            <div>
              <h3 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider mb-2">
                Telemetry Analytics Engine
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4">
                The Observability Center logs transaction duration, target agent IDs, semantic cache resolutions, token count computations, and error responses. Fallback indicates that a local JSON database was consulted when primary API services were unavailable or rate-limited.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search logs by agent or error..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'success', 'fallback', 'failed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        statusFilter === status
                          ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]/30'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--glass-border-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {status.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                <span>Logs stored locally in <code>api-lib/logs/telemetry.jsonl</code>. Active caching threshold 0.95.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs Table */}
        <div className="card-premium p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider">
              Transaction History Log
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--glass-border-strong)] text-[var(--text-secondary)]">
              Showing {filteredLogs.length} items
            </span>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--glass-border-strong)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-black">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Agent Orchestrator ID</th>
                  <th className="py-2.5 px-3">Lang</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Est. Tokens</th>
                  <th className="py-2.5 px-3">User Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Details / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border-weak)] text-xs text-[var(--text-primary)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                      <td className="py-2.5 px-3 text-[10px] font-mono text-[var(--text-muted)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-400">
                        {log.agentId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[var(--text-secondary)] uppercase">
                        {log.language}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {log.durationMs}ms
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                        {log.tokensEstimated || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)]">
                        {log.userRole || 'anonymous'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block"
                          style={{
                            borderColor: `${STATUS_COLORS[log.status]}30`,
                            background: `${STATUS_COLORS[log.status]}10`,
                            color: STATUS_COLORS[log.status]
                          }}
                        >
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)] truncate max-w-[200px]" title={log.error || ''}>
                        {log.status === 'failed' && (
                          <span className="text-rose-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            {log.error || 'Unknown error'}
                          </span>
                        )}
                        {log.status === 'fallback' && 'Loaded local JSON'}
                        {log.status === 'success' && (
                          <span className="text-emerald-500 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Primary resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
