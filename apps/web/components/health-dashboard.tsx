'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { SystemHealth } from '@versionflow/contracts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Database, Server, RefreshCw, Cpu } from 'lucide-react';

export function HealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.health.getSystemHealth();
      if (response.success && response.data) {
        setHealth(response.data);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to reach API server');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown connection error';
      setError(msg);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    const interval = setInterval(() => {
      void fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">HEALTHY</Badge>;
      case 'degraded':
        return <Badge variant="warning">DEGRADED</Badge>;
      default:
        return <Badge variant="destructive">UNAVAILABLE</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Infrastructure Status Console
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status probe across VersionFlow API, PostgreSQL, and Redis/BullMQ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchHealth()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {lastChecked && (
            <span className="text-xs text-slate-500">
              Checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <div className="font-semibold">Backend Unreachable:</div>
          <div>{error}</div>
          <div className="text-xs text-rose-400 mt-1">
            Ensure `apps/api` is running on port 4000.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API Backend Card */}
        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Server className="h-5 w-5" />
              </div>
              {getStatusBadge(health?.services['api']?.status)}
            </div>
            <CardTitle className="mt-3">NestJS Core API</CardTitle>
            <CardDescription>HTTP service at port 4000</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-400">
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Uptime</span>
              <span className="text-slate-200 font-mono">
                {health ? `${health.uptime}s` : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Version</span>
              <span className="text-slate-200 font-mono">{health?.version || '0.1.0'}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Details</span>
              <span className="text-slate-300">
                {health?.services['api']?.message || (error ? 'Offline' : 'Connected')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Database Card */}
        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              {getStatusBadge(health?.services['database']?.status)}
            </div>
            <CardTitle className="mt-3">PostgreSQL + Drizzle</CardTitle>
            <CardDescription>Primary relational storage</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-400">
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Latency</span>
              <span className="text-slate-200 font-mono">
                {health?.services['database']?.latencyMs !== undefined
                  ? `${health.services['database'].latencyMs}ms`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Dialect</span>
              <span className="text-slate-200">PostgreSQL 16</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Status</span>
              <span className="text-slate-300">
                {health?.services['database']?.message || 'Awaiting check'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Redis & BullMQ Card */}
        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Cpu className="h-5 w-5" />
              </div>
              {getStatusBadge(health?.services['redis']?.status)}
            </div>
            <CardTitle className="mt-3">Redis + BullMQ</CardTitle>
            <CardDescription>Asynchronous queue broker</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-400">
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Latency</span>
              <span className="text-slate-200 font-mono">
                {health?.services['redis']?.latencyMs !== undefined
                  ? `${health.services['redis'].latencyMs}ms`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Queue Status</span>
              <span className="text-slate-200 font-mono">Active</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-800/50">
              <span>Status</span>
              <span className="text-slate-300">
                {health?.services['redis']?.message || 'Awaiting check'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

