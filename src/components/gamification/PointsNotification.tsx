'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface PointsNotificationProps {
  points: number;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export function PointsNotification({
  points,
  message,
  duration = 3000,
  onClose
}: PointsNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="font-bold text-lg">+{points} Points</div>
            {message && (
              <div className="text-sm opacity-90">{message}</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
