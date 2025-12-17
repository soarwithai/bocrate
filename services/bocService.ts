import { ExchangeData, ExchangeRate } from "../types";

const BOC_TARGET_URL = "https://bocrateproxy.1572367688.workers.dev/";

// 两个常用的免费代理，如果第一个失败会自动尝试第二个
const PROXY_LIST = [
  "https://api.allorigins.win/get?url=",
  "https://api.codetabs.com/v1/proxy/?quest=" // 备用代理
];

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
  const timestamp = new Date().getTime();
  const targetUrl = `${BOC_TARGET_URL}?t=${timestamp}`;
  
  // 尝试使用不同的代理
  for (const proxyBase of PROXY_LIST) {
    try {
      const finalUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
      console.log('尝试通过代理获取数据:', proxyBase);

      const response = await fetch(finalUrl);
      if (!response.ok) continue; // 如果当前代理报错，尝试下一个

      const data = await response.json();
      
      // 注意：不同的代理返回的 JSON 结构可能略有不同
      // AllOrigins 用 .contents, CodeTabs 直接返回结果或在不同字段
      const html = data.contents || data.result || (typeof data === 'string' ? data : null);

      if (html) {
        console.log('数据获取成功');
        return parseBOCHtml(html);
      }
    } catch (e) {
      console.warn(`代理 ${proxyBase} 请求失败，准备尝试备用方案...`);
    }
  }

  throw new Error("所有数据通道均无法连接，请检查手机网络或尝试连接 Wi-Fi。");
};

// parseBOCHtml 函数保持不变...
const parseBOCHtml = (html: string): ExchangeData => {
  const rates: ExchangeRate[] = [];
  let updateTime = "";

  const timeRegex = /(\d{4}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const timeMatch = html.match(timeRegex);
  if (timeMatch && timeMatch[1]) updateTime = timeMatch[1];

  Object.keys(TARGET_CURRENCIES).forEach((code) => {
    const name = TARGET_CURRENCIES[code];
    const regexStr = 
      `<td[^>]*>\\s*${code}\\s*<\\/td>` +
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +
      `\\s*<td[^>]*>[\\s\\S]*?<\\/td>` +
      `\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`;

    const regex = new RegExp(regexStr, "i");
    const match = html.match(regex);

    if (match && match[1]) {
      let price = match[1].trim();
      price = price.replace(/&nbsp;/g, "").replace(/<[^>]+>/g, "").trim();
      if (!price) price = "暂无";
      rates.push({ code, name, price });
    }
  });

  if (rates.length === 0) throw new Error("解析失败：网页结构异常");
  
  const sortOrder = ["GBP", "EUR", "USD", "HKD", "JPY", "AUD", "CAD"];
  rates.sort((a, b) => sortOrder.indexOf(a.code) - sortOrder.indexOf(b.code));

  return { updateTime, rates };
};