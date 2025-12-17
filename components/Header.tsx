import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, loading }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
            {/* BOC Logo simplified */}
            <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                BOC
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-wide">
             汇率通
            </h1>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md shadow-red-200'}
          `}
        >
          {loading ? (
             <>
               <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>更新中...</span>
             </>
          ) : (
            <>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               <span>更新</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
