import React from 'react';
import LikedayAnalysis from './common/LikedayAnalysis';

export default function LikedayPage() {
  return (
    <div className="py-12 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gs-gray-900 mb-2">Likeday Analysis</h1>
          <p className="text-gs-gray-600">Find similar historical days based on load, price, and market patterns</p>
        </div>
        
        <div className="space-y-6">
          {/* Main Analysis Component */}
          <LikedayAnalysis />
        </div>
      </div>
    </div>
  );
} 