import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { AuditEvent } from '../../types/admin';
import { Loader } from '../common/Loader';
import { Shield, RefreshCw, Clock } from 'lucide-react';

export const AdminAuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminAuditLogs(100);
      setLogs(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load system audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {action}
        </span>
      );
    }
    if (action.includes('ARCHIVE') || action.includes('DELETE') || action.includes('CANCEL')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {action}
        </span>
      );
    }
    if (action.includes('STOCK')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Immutable Administrative Audit Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically timestamped audit trail of sensitive inventory, order, and catalogue mutations.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          title="Refresh Audit Logs"
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading audit log records..." />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No administrative events recorded yet.</p>
          <p>Actions performed by administrators will automatically be logged here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Mutation Details / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(ev.action)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-white font-semibold font-sans">{ev.entity_name}</span>{' '}
                    <span className="text-slate-500 text-[10px]">({ev.entity_id.substring(0, 8)}...)</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-sans">
                    {ev.actor_email || ev.actor_id || 'System'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="max-w-md truncate text-[10px] text-slate-400">
                      {ev.new_values ? JSON.stringify(ev.new_values) : '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
