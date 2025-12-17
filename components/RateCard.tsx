import React from 'react';
import { ExchangeRate } from '../types';

interface RateCardProps {
  rate: ExchangeRate;
}

// Simple map for currency flags/symbols
const getCurrencyIcon = (code: string) => {
  switch (code) {
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'EUR': return '€';
    case 'HKD': return 'HK$';
    case 'JPY': return '¥';
    case 'AUD': return 'A$';
    case 'CAD': return 'C$';
    default: return code;
  }
};

const getFlagEmoji = (code: string) => {
    switch (code) {
      case 'USD': return '🇺🇸';
      case 'GBP': return '🇬🇧';
      case 'EUR': return '🇪🇺';
      case 'HKD': return '🇭🇰';
      case 'JPY': return '🇯🇵';
      case 'AUD': return '🇦🇺';
      case 'CAD': return '🇨🇦';
      default: return '🌐';
    }
  };

export const RateCard: React.FC<RateCardProps> = ({ rate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between mb-3 transition-transform active:scale-95">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl shadow-inner">
          {getFlagEmoji(rate.code)}
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{rate.name}</h3>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {rate.code}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">现汇卖出价</p>
        <p className="text-2xl font-bold text-red-600 font-mono tracking-tight">
          {rate.price}
        </p>
      </div>
    </div>
  );
};
