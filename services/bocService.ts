import { ExchangeData, ExchangeRate } from "../types";

// 1. 目标汇率页面地址
const REAL_BOC_URL = "https://www.boc.cn/sourcedb/whpj/enindex_1619.html";

// 2. 你的专属 Cloudflare Worker 地址
const MY_WORKER_PROXY = "https://bocrateproxy.1572367688.workers.dev/";

const TARGET_CURRENCIES: Record<string, string> = {
  GBP: "英镑",
  EUR: "欧元",
  USD: "美元",
  HKD: "港币",
  JPY: "日元",
  AUD: "澳大利亚元",
  CAD: "加拿大元",
};

/**
 * 主请求函数
 */
export const fetchBOCRates = async (): Promise<ExchangeData> => {
  try {
    const timestamp = new Date().getTime();
    const targetUrl = `${REAL_BOC_URL}?t=${timestamp}`;
    const finalUrl = `${MY_WORKER_PROXY}?url=${encodeURIComponent(targetUrl)}`;

    console.log('正在请求 Worker...', finalUrl);

    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`代理响应失败: ${response.status}`);

    const html = await response.text();

    // 验证返回内容
    if (!html || !html.includes('Currency')) {
      throw new Error("抓取失败：返回内容不包含汇率表格");
    }

    // 调用下方的解析函数
    return parseBOCHtml(html);

  } catch (error: any) {
    console.error('获取汇率失败:', error);
    throw error;
  }
};

/**
 * HTML 解析函数 (修复 "not defined" 的关键)
 */
const parseBOCHtml = (html: string): ExchangeData => {
  const rates: ExchangeRate[] = [];
  let updateTime = "";

  // 1. 提取发布时间
  const timeRegex = /(\d{4}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const timeMatch = html.match(timeRegex);
  if (timeMatch && timeMatch[1]) updateTime = timeMatch[1];

  // 2. 循环提取每种货币的汇率
  Object.keys(TARGET_CURRENCIES).forEach((code) => {
    const name = TARGET_CURRENCIES[code];

    // 匹配逻辑：货币代码 -> 跳过2列 -> 提取第4列(现汇卖出价)
    const regexStr = 
      `<td[^>]*>\\s*${code}\\s*<\\/td>` +
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +
      `\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`;

    const regex = new RegExp(regexStr, "i");
    const match = html.match(regex);

    if (match && match[1]) {
      let price = match[1].trim();
      // 清理残留标签和空格
      price = price.replace(/&nbsp;/g, "").replace(/<[^>]+>/g, "").trim();
      if (!price) price = "暂无";
      rates.push({ code, name, price });
    }
  });

  if (rates.length === 0) {
    throw new Error("解析失败：未能从页面中找到匹配的货币数据");
  }

  // 排序
  const sortOrder = ["GBP", "EUR", "USD", "HKD", "JPY", "AUD", "CAD"];
  rates.sort((a, b) => sortOrder.indexOf(a.code) - sortOrder.indexOf(b.code));

  return { updateTime, rates };
};