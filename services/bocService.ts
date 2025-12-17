// src/api/fetchBOCRates.ts
import { ExchangeData, ExchangeRate } from "../types";

/**
 * 你的专属 Cloudflare Worker 地址
 * Worker 已经返回 JSON 格式数据
 */
const MY_WORKER_PROXY = "https://bocrateproxy.1572367688.workers.dev/";

/**
 * 前端关注的目标货币
 */
const TARGET_CURRENCIES = ["GBP", "EUR", "USD", "HKD", "JPY", "AUD", "CAD"];

/**
 * 主请求函数
 * @returns {Promise<ExchangeData>} 汇率数据（只保留 TARGET_CURRENCIES）
 */
export const fetchBOCRates = async (): Promise<ExchangeData> => {
  try {
    const response = await fetch(MY_WORKER_PROXY, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Worker 响应失败: ${response.status}`);
    }

    const data = await response.json();

    // 校验结构
    if (!data || !Array.isArray(data.rates)) {
      throw new Error("Worker 返回的数据结构不正确");
    }

    // 只保留目标货币
    const filteredRates: ExchangeRate[] = data.rates.filter(rate =>
      TARGET_CURRENCIES.includes(rate.code)
    );

    return {
      updateTime: data.updateTime,
      rates: filteredRates,
    };
  } catch (error: any) {
    console.error("获取汇率失败:", error);
    throw error;
  }
};
