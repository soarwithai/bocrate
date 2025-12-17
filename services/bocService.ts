import { ExchangeData, ExchangeRate } from "../types";

// 1. 目标网页
const BOC_TARGET_URL = "https://www.boc.cn/sourcedb/whpj/enindex_1619.html";

// 2. 免费的 CORS 代理服务（专门解决浏览器跨域问题）
// AllOrigins 会将目标网页包装成 JSON 返回
const CORS_PROXY = "https://api.allorigins.win/get?url=";

const TARGET_CURRENCIES: Record<string, string> = {
  GBP: "英镑",
  EUR: "欧元",
  USD: "美元",
  HKD: "港币",
  JPY: "日元",
  AUD: "澳大利亚元",
  CAD: "加拿大元",
};

export const fetchBOCRates = async (): Promise<ExchangeData> => {
  try {
    const timestamp = new Date().getTime();
    // 构造带时间戳的原始 URL
    const targetUrl = `${BOC_TARGET_URL}?t=${timestamp}`;
    // 构造代理 URL：将原始 URL 进行编码，防止特殊字符导致请求失败
    const finalUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

    console.log('正在通过代理获取数据:', finalUrl);

    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`代理请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();

    // AllOrigins 返回的 JSON 结构中，网页 HTML 存在 contents 字段里
    if (!data || !data.contents) {
      throw new Error("代理服务器返回数据格式不正确");
    }

    console.log('成功获取 HTML 数据，开始解析...');
    return parseBOCHtml(data.contents);

  } catch (error: any) {
    console.error('获取汇率失败:', error);
    throw new Error(`数据加载失败: ${error?.message || '未知错误'}`);
  }
};

const parseBOCHtml = (html: string): ExchangeData => {
  const rates: ExchangeRate[] = [];
  let updateTime = "";

  // 1. 提取发布时间
  const timeRegex = /(\d{4}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const timeMatch = html.match(timeRegex);
  if (timeMatch && timeMatch[1]) updateTime = timeMatch[1];

  // 2. 提取汇率 (针对中行英文版网页结构)
  Object.keys(TARGET_CURRENCIES).forEach((code) => {
    const name = TARGET_CURRENCIES[code];

    const regexStr = 
      `<td[^>]*>\\s*${code}\\s*<\\/td>` +  // 货币代码列
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +    // 买入价列
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +    // 钞买价列
      `\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`;   // 卖出价列 (捕获此值)

    const regex = new RegExp(regexStr, "i");
    const match = html.match(regex);

    if (match && match[1]) {
      let price = match[1].trim();
      price = price.replace(/&nbsp;/g, "").replace(/<[^>]+>/g, "").trim();
      if (!price) price = "暂无";
      rates.push({ code, name, price });
    }
  });

  if (rates.length === 0) {
    throw new Error("解析失败：未能提取汇率数据，请检查网络或网页结构");
  }

  // 排序
  const sortOrder = ["GBP", "EUR", "USD", "HKD", "JPY", "AUD", "CAD"];
  rates.sort((a, b) => sortOrder.indexOf(a.code) - sortOrder.indexOf(b.code));

  return { updateTime, rates };
};