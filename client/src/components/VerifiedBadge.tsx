import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <span className={`bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${className}`}>
      <CheckCircle2 className="w-3 h-3" />
      Verified
    </span>
  );
}
