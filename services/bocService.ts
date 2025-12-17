import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { ExchangeData, ExchangeRate } from "../types";

// 目标网页（英文版）
const BOC_TARGET_URL = "https://www.boc.cn/sourcedb/whpj/enindex_1619.html";

const TARGET_CURRENCIES: Record<string, string> = {
  GBP: "英镑",
  EUR: "欧元",
  USD: "美元",
  HKD: "港币",
  JPY: "日元",
  AUD: "澳大利亚元",
  CAD: "加拿大元",
};

export const PROXY_BASE = ""; // 可填写 Cloudflare Worker URL，例如: "https://your-worker.example.workers.dev"

export const fetchBOCRates = async (): Promise<ExchangeData> => {
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  const urlWithCacheBust = `${BOC_TARGET_URL}?t=${timestamp}`;

  console.log('开始获取汇率数据...', urlWithCacheBust);

  // 先尝试 Capacitor 原生 HTTP（在移动/Capacitor 环境中可用）
  if (typeof CapacitorHttp !== 'undefined' && (CapacitorHttp as any).get) {
    try {
      const response: HttpResponse = await CapacitorHttp.get({
        url: urlWithCacheBust,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      console.log('CapacitorHttp 响应状态:', response.status);

      if (response && response.status === 200 && typeof response.data === 'string') {
        console.log('收到HTML数据（CapacitorHttp），长度:', response.data.length);
        return parseBOCHtml(response.data);
      }
      console.warn('CapacitorHttp 未返回可用 HTML，回退到浏览器 fetch');
    } catch (e: any) {
      console.warn('CapacitorHttp 请求失败，回退到浏览器 fetch:', e?.message || e);
    }
  }

  // 浏览器环境回退：直接使用 fetch（注意目标站点可能禁止 CORS）
  try {
    const target = PROXY_BASE ? `${PROXY_BASE}?url=${encodeURIComponent(BOC_TARGET_URL)}&t=${timestamp}` : urlWithCacheBust;

    const resp = await fetch(target, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Browser)'
      },
      mode: 'cors',
    });

    console.log('fetch 响应状态:', resp.status);

    if (!resp.ok) {
      throw new Error(`Fetch 请求失败，状态码: ${resp.status}`);
    }

    const html = await resp.text();
    if (!html || typeof html !== 'string') throw new Error('未收到有效的HTML响应 (fetch)');

    console.log('收到HTML数据（fetch），长度:', html.length);
    return parseBOCHtml(html);
  } catch (error: any) {
    console.error('获取汇率失败:', error);
    const hint = '如果是在浏览器中运行，目标网站可能阻止跨域请求(CORS)。建议部署 Cloudflare Worker 代理并将其地址填入 PROXY_BASE，或在服务器端代理请求。';
    throw new Error(`${error?.message || '网络请求失败'} — ${hint}`);
  }
};

const parseBOCHtml = (html: string): ExchangeData => {
  const rates: ExchangeRate[] = [];
  let updateTime = "";

  // 1. 提取发布时间
  const timeRegex = /(\d{4}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const timeMatch = html.match(timeRegex);
  if (timeMatch && timeMatch[1]) updateTime = timeMatch[1];

  // 2. 提取汇率
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

  if (rates.length === 0) {
    throw new Error("解析失败：未能提取汇率数据，网页结构可能已变");
  }

  // 排序（将新增货币放在末尾）
  const sortOrder = ["GBP", "EUR", "USD", "HKD", "JPY", "AUD", "CAD"];
  rates.sort((a, b) => sortOrder.indexOf(a.code) - sortOrder.indexOf(b.code));

  return { updateTime, rates };
};
