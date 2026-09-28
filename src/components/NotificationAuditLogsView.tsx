import React, { useState, useEffect } from 'react';
import { fetchNotificationLogs, fetchGatewayStatus } from '../utils/realAlertDeliveryService';
import { RecentSearchesInput } from './RecentSearchesInput';
import {
  Radio,
  Smartphone,
  Mail,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  ExternalLink,
  RotateCw,
  Shield,
  Layers,
  Check,
  Copy,
  Server,
  Zap,
} from 'lucide-react';

interface NotificationLogItem {
  id: string;
  residentId?: string;
  residentName: string;
  certificateId?: string;
  controlNumber?: string;
  certificateType?: string;
  channel: 'sms' | 'email';
  recipientTarget: string;
  messageContent: string;
  provider: string;
  providerMessageId?: string;
  status: 'sent' | 'delivered' | 'failed' | 'queued';
  errorMessage?: string;
  sentBy: string;
  timestamp: string;
}

export const NotificationAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectingLog, setInspectingLog] = useState<NotificationLogItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryToast, setRetryToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, gwRes] = await Promise.all([
        fetchNotificationLogs({
          channel: channelFilter === 'all' ? undefined : channelFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery || undefined,
          limit: 100,
        }),
        fetchGatewayStatus(),
      ]);

      if (logsRes.success) {
        setLogs(logsRes.logs);
        setTotalCount(logsRes.totalLogs);
      }
      if (gwRes) {
        setGatewayStatus(gwRes);
      }
    } catch (e) {
      console.error('Error loading notification audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [channelFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRetry = async (log: NotificationLogItem) => {
    setRetryingId(log.id);
    try {
      if (log.channel === 'sms') {
        const res = await fetch('/api/notify/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: log.recipientTarget,
            residentName: log.residentName,
            controlNumber: log.controlNumber,
            certificateType: log.certificateType,
            message: log.messageContent,
            sentBy: 'System Retry Action',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRetryToast(`✓ Retry succeeded! Provider ID: ${data.providerMessageId || 'OK'}`);
        } else {
          setRetryToast(`Retry error: ${data.error || 'Failed'}`);
        }
      } else {
        const res = await fetch('/api/notify/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: log.recipientTarget,
            residentName: log.residentName,
            controlNumber: log.controlNumber,
            certificateType: log.certificateType,
            sentBy: 'System Retry Action',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRetryToast(`✓ Retry succeeded! Provider ID: ${data.providerMessageId || 'OK'}`);
        } else {
          setRetryToast(`Retry error: ${data.error || 'Failed'}`);
        }
      }
      setTimeout(() => setRetryToast(null), 4000);
      await loadData();
    } catch (e: any) {
      setRetryToast(`Retry failed: ${e.message}`);
      setTimeout(() => setRetryToast(null), 4000);
    } finally {
      setRetryingId(null);
    }
  };

  const successfulCount = logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {retryToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{retryToast}</span>
          </div>
        </div>
      )}

      {/* Gateway Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">SMS Provider Engine</p>
              <p className="text-xs font-bold text-white">
                {gatewayStatus?.smsGateway?.activeProvider || 'Twilio / Semaphore'}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Email Delivery Engine</p>
              <p className="text-xs font-bold text-white">
                {gatewayStatus?.emailGateway?.activeProvider || 'SendGrid / Resend / Google'}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Audited Events</p>
              <p className="text-xs font-bold text-emerald-400">
                {totalCount} Logs ({successfulCount} Delivered, {failedCount} Failed)
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-all"
            title="Refresh logs from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <RecentSearchesInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by resident name, phone, email, control #, provider msg ID..."
            storageKey="notification_audit_logs"
            theme="dark"
            inputClassName="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS Only</option>
            <option value="email">Email Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="sent">Sent / Delivered</option>
            <option value="failed">Failed / Undelivered</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Backend Notification Audit Trail</span>
          </span>
          <span className="text-xs text-slate-400">{logs.length} records shown</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Radio className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No notification logs recorded</p>
            <p className="text-xs text-slate-500">
              When certificates are approved or alerts are dispatched, audit records appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp & ID</th>
                  <th className="px-4 py-3">Recipient & Target</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Document Reference</th>
                  <th className="px-4 py-3">Gateway Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => {
                  const isSuccess = log.status === 'sent' || log.status === 'delivered';
                  const isFailed = log.status === 'failed';
                  const isCopied = copiedId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <p className="font-bold text-white text-[11px]">{log.id}</p>
                        <p className="text-[10px] text-slate-400">{log.timestamp?.replace('T', ' ').slice(0, 19)}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{log.residentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{log.recipientTarget}</p>
                      </td>

                      <td className="px-4 py-3">
                        {log.channel === 'sms' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                            <Smartphone className="w-3 h-3 text-sky-400" />
                            <span>SMS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            <Mail className="w-3 h-3 text-indigo-400" />
                            <span>Email</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-200">{log.certificateType || 'Clearance'}</p>
                        <p className="text-[10px] font-mono text-slate-400">{log.controlNumber || 'N/A'}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-[11px] font-semibold text-white">{log.provider}</p>
                        {log.providerMessageId && (
                          <p className="font-mono text-[9px] text-slate-400 truncate max-w-[120px]">
                            {log.providerMessageId}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Delivered</span>
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800" title={log.errorMessage}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingLog(log)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Inspect full payload"
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => handleCopy(log.messageContent, log.id)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                            title="Copy message content"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {isFailed && (
                            <button
                              disabled={retryingId === log.id}
                              onClick={() => handleRetry(log)}
                              className="px-2 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Retry delivery immediately"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-80 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Notification Log Payload Details</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400">
                  {inspectingLog.id}
                </span>
              </h4>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Recipient</p>
                  <p className="font-bold text-white">{inspectingLog.residentName}</p>
                  <p className="font-mono text-slate-400">{inspectingLog.recipientTarget}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status & Provider</p>
                  <p className="font-bold text-emerald-400">{inspectingLog.status.toUpperCase()}</p>
                  <p className="text-slate-400">{inspectingLog.provider}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Message Body</p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {inspectingLog.messageContent}
                </div>
              </div>

              {inspectingLog.errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300">
                  <p className="font-bold text-[10px] uppercase">Error Details</p>
                  <p>{inspectingLog.errorMessage}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
