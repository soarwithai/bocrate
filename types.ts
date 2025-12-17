// src/types.ts

/**
 * 单个货币汇率数据
 */
export interface ExchangeRate {
  code: string;        // 货币代码，例如 USD
  name: string;        // 货币名称，例如 美元
  price: string;       // 汇率，保持字符串以保留中行原始精度
}

/**
 * 汇率数据整体结构
 */
export interface ExchangeData {
  updateTime: string;          // 数据更新时间
  rates: ExchangeRate[];       // 货币列表
  sourceUrls?: string[];       // 可选：数据来源 URL
}

/**
 * 前端调用接口或 Worker 出错时返回的错误结构
 */
export interface AppError {
  message: string;             // 错误信息
  code?: number;               // 可选：HTTP 状态码或自定义错误码
}
