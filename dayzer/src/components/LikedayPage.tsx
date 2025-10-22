import React from 'react';
import LikedayAnalysis from './common/LikedayAnalysis';

export default function LikedayPage() {
  return (
    <div className="py-12 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Main Analysis Component */}
          <LikedayAnalysis />
        </div>
      </div>
    </div>
  );
} 