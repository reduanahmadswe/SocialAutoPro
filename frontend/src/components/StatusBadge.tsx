'use client';

interface StatusBadgeProps {
  status: 'pending' | 'published' | 'failed' | 'success';
}

const statusConfig = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
    label: 'Pending',
    animate: true,
  },
  published: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
    label: 'Published',
    animate: false,
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
    label: 'Failed',
    animate: false,
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
    label: 'Success',
    animate: false,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
          config.animate ? 'animate-pulse-dot' : ''
        }`}
      />
      {config.label}
    </span>
  );
}
