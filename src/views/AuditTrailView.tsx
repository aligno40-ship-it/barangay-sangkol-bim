import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { History, Search, Filter, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, currentUser, users } = useBarangay();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      log.userName.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term);
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'ISSUE_CERTIFICATE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'DELETE':
      case 'ARCHIVE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'LOGIN':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'BACKUP_EXPORT':
      case 'BACKUP_RESTORE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <History className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>System Audit Trail & Security Logs</span>
            <InfoButton
              title="Audit Trail & Security Logs"
              info="Immutable activity chronicle of all user logins, record mutations, certificate issuances, and backups."
              variant="light"
            />
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold shadow-xs">
            {auditLogs.length} total events logged
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <RecentSearchesInput
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search logs by staff name, module, action, details..."
          storageKey="audit_trail"
          theme="dark"
        />

        <div className="w-full sm:w-64">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Action Types</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ISSUE_CERTIFICATE">ISSUE_CERTIFICATE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="BACKUP_EXPORT">BACKUP_EXPORT</option>
            <option value="BACKUP_RESTORE">BACKUP_RESTORE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">System Event Timeline</span>
          <span className="text-xs text-slate-400">Chronological descending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details & Event Payload</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logUser = users.find(
                    (u) =>
                      (log.userId && u.id === log.userId) ||
                      u.name.toLowerCase() === log.userName.toLowerCase() ||
                      u.username.toLowerCase() === log.userName.toLowerCase()
                  );

                  const displayName = logUser ? logUser.name : log.userName;
                  const displayRole = logUser ? logUser.role : log.userRole;
                  const displayAvatar = logUser?.avatar || log.userAvatar;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                            {displayAvatar ? (
                              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              displayName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">{displayName}</p>
                            <p className="text-[10px] text-emerald-400 leading-tight">{displayRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-300">
                        {log.module}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        <p className="line-clamp-2">{log.details}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '192.168.1.100'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
