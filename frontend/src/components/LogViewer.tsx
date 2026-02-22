'use client';

import { PostLog } from '@/types';
import StatusBadge from './StatusBadge';

interface LogViewerProps {
  logs: PostLog[];
  onClose: () => void;
}

const platformConfig: Record<string, { label: string; color: string; bg: string }> = {
  facebook: { label: 'Facebook', color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10' },
  linkedin: { label: 'LinkedIn Profile', color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
  linkedin_page: { label: 'LinkedIn Page', color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
  telegram: { label: 'Telegram', color: 'text-[#26A5E4]', bg: 'bg-[#26A5E4]/10' },
};

export default function LogViewer({ logs, onClose }: LogViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Publishing Logs</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[65vh] sm:max-h-[60vh] space-y-3 sm:space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No logs available yet</p>
              <p className="text-xs mt-1">Logs will appear after publishing completes</p>
            </div>
          ) : (
            logs.map((log) => {
              const platform = platformConfig[log.platform] || {
                label: log.platform,
                color: 'text-slate-600',
                bg: 'bg-slate-100',
              };

              return (
                <div
                  key={log.id}
                  className="border border-slate-100 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${platform.bg} ${platform.color}`}
                      >
                        {platform.label}
                      </span>
                      <StatusBadge status={log.status} />
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  {log.error && (
                    <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600 font-mono">
                      {log.error}
                    </div>
                  )}

                  {log.response && (
                    <details className="group">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                        View API Response
                      </summary>
                      <pre className="mt-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono overflow-x-auto">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
