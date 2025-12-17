import React, { useEffect, useState, useCallback } from 'react';
// Change import source
import { fetchBOCRates } from './services/bocService';
import { ExchangeRate, AppError } from './types';
import { RateCard } from './components/RateCard';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [updateTime, setUpdateTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBOCRates();
      setRates(data.rates);
      setUpdateTime(data.updateTime);
    } catch (err: any) {
      setError({ message: err.message || '未知错误' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <Header onRefresh={loadRates} loading={loading} />

      <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col">
        
        {/* Status Banner */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                数据来源: 中国银行 (BOC) 官网
            </h2>
            <div className="flex justify-between items-end">
                <div>
                     <p className="text-xs text-gray-400">官网发布时间</p>
                     <p className="text-sm font-medium text-gray-700">
                        {updateTime || '--'}
                     </p>
                </div>
                {!loading && !error && updateTime && (
                    <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        已更新
                    </span>
                )}
            </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700 font-bold mb-1">
                  获取数据失败
                </p>
                <p className="text-xs text-red-600 mb-2">
                  {error.message}
                </p>
                <button 
                    onClick={loadRates} 
                    className="text-xs font-bold text-red-700 underline hover:text-red-800 bg-red-100 px-2 py-1 rounded"
                >
                    重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && rates.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-3 w-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Data List */}
        <div className="flex-1">
          {rates.map((rate) => (
            <RateCard key={rate.code} rate={rate} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center pb-6">
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                * 本应用直接解析中国银行静态页面。
                <br/>
                如果一直显示连接失败，请配置 Cloudflare Worker 代理。
            </p>
            <div className="mt-2 text-[10px] text-gray-300">
                 数据源: www.boc.cn
            </div>
        </footer>
      </main>
    </div>
  );
};

export default App;