'use client';

import React from 'react';
import { Calendar, Sun, Sparkles } from 'lucide-react';
import { getFormattedToday } from '../lib/constants';

export default function WeekendHoliday({ dateFormatted }) {
  const todayFormatted = getFormattedToday();
  const displayDate = dateFormatted || todayFormatted;

  return (
    <div className="glass-panel weekend-card">
      <div className="weekend-icon-wrapper">
        <Sun size={48} className="weekend-sun-icon" />
        <Sparkles size={24} className="weekend-sparkle-icon" />
      </div>

      <div className="weekend-date-badge">
        <Calendar size={16} />
        <span>{displayDate}</span>
      </div>

      <h2 className="weekend-title">Weekend Holiday!</h2>
      <p className="weekend-subtitle">
        Saturday and Sunday are holidays for students. Daily attendance recording is not required today.
      </p>

      <div className="weekend-tip">
        Enjoy your weekend! Attendance will automatically resume on Monday.
      </div>
    </div>
  );
}
