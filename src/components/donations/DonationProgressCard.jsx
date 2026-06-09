import React from 'react';
import { Heart, TrendingUp, Target } from 'lucide-react';

export default function DonationProgressCard({ goal }) {
  const progressPercent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
  
  const daysRemaining = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900">{goal.title}</h3>
          </div>
          {goal.description && (
            <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
          )}
        </div>
        {goal.image_url && (
          <img src={goal.image_url} alt={goal.title} className="w-16 h-16 rounded-lg object-cover ml-4" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-600 font-medium">Raised</p>
          <p className="text-lg font-bold text-rose-600">
            ${goal.current_amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Goal</p>
          <p className="text-lg font-bold text-slate-900">
            ${goal.target_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Progress</p>
          <p className="text-lg font-bold text-slate-900">{Math.round(progressPercent)}%</p>
        </div>
        {daysRemaining !== null && (
          <div>
            <p className="text-xs text-slate-600 font-medium">Days Left</p>
            <p className={`text-lg font-bold ${daysRemaining > 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {daysRemaining > 0 ? daysRemaining : 'Ended'}
            </p>
          </div>
        )}
      </div>

      {/* Remaining */}
      {remaining > 0 && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg">
          <Target className="w-4 h-4 text-rose-600" />
          <p className="text-sm text-rose-900 font-medium">
            ${remaining.toLocaleString('en-US', { maximumFractionDigits: 2 })} needed to reach goal
          </p>
        </div>
      )}

      {progressPercent >= 100 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-900 font-medium">
            Goal reached! Thank you to our supporters!
          </p>
        </div>
      )}
    </div>
  );
}