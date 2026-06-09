import React from 'react';
import { Tag } from 'lucide-react';

export default function Discounts() {
  return (
    <div className="min-h-screen from-slate-50 to-blue-50 py-16 px-4 bg-[hsl(var(--background))]">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-6">
          <Tag className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Pet Discounts & Deals</h1>
        <p className="text-slate-500 text-lg">Exclusive discounts from local pet services coming soon. Check back later!</p>
      </div>
    </div>);

}