import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '..', 'logs');

export interface TelemetryData {
  agentId: string;
  language: string;
  durationMs: number;
  tokensEstimated?: number;
  status: 'success' | 'failed' | 'fallback';
  error?: string;
  userRole?: string;
  timestamp: string;
}

// Ensure logs directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (e) {
  // Silent fail if directory is read-only (e.g. on serverless Vercel)
}

/**
 * Log structured telemetry data for AI response logging and analytics
 */
export function logTelemetry(data: Omit<TelemetryData, 'timestamp'>) {
  const telemetryRecord: TelemetryData = {
    ...data,
    timestamp: new Date().toISOString()
  };

  // 1. Structured Console Logging (visible in Docker/container outputs)
  console.log(`[TELEMETRY] ${JSON.stringify(telemetryRecord)}`);

  // 2. Append to a local JSON lines file for local auditing
  const logFile = path.join(logDir, 'telemetry.jsonl');
  try {
    fs.appendFileSync(logFile, JSON.stringify(telemetryRecord) + '\n', 'utf8');
  } catch (err) {
    // Expected on read-only serverless platforms, ignore safely
  }
}

/**
 * In-memory telemetry cache for real-time dashboard analytics
 */
const metricsCache = {
  totalRequests: 0,
  agentUsage: {} as Record<string, number>,
  latencies: [] as number[],
  errorCount: 0
};

export function recordMetric(agentId: string, durationMs: number, isError: boolean) {
  metricsCache.totalRequests++;
  metricsCache.agentUsage[agentId] = (metricsCache.agentUsage[agentId] || 0) + 1;
  metricsCache.latencies.push(durationMs);
  if (isError) metricsCache.errorCount++;

  // Keep latency list capped to last 1000 items
  if (metricsCache.latencies.length > 1000) {
    metricsCache.latencies.shift();
  }
}

export function getSystemMetrics() {
  const avgLatency = metricsCache.latencies.length > 0
    ? metricsCache.latencies.reduce((a, b) => a + b, 0) / metricsCache.latencies.length
    : 0;

  return {
    totalRequests: metricsCache.totalRequests,
    agentUsage: metricsCache.agentUsage,
    averageLatencyMs: Math.round(avgLatency),
    errorCount: metricsCache.errorCount
  };
}
