
/**
 * Cloudflare Worker Proxy for BOC Rates
 * 
 * 部署指南:
 * 1. 登录 Cloudflare Dashboard
 * 2. 创建一个新的 Worker
 * 3. 将此代码粘贴到编辑器中
 * 4. 保存并部署
 * 5. 将生成的 Worker URL 填入 services/bocService.ts 的 PROXY_BASE 中
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };

    // 处理预检请求 (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
        },
      });
    }

    // 目标货币列表 (7种：英镑、美元、欧元、港元、加元、澳元、日元)
    const TARGET_CURRENCIES = ["GBP", "USD", "EUR", "HKD", "CAD", "AUD", "JPY"];

    try {
      // 添加时间戳防止缓存
      const timestamp = Date.now();
      const jsonUrl = `https://www.boc.cn/sourcedb/whpj/?timestamp=${timestamp}`;
      
      const response = await fetch(jsonUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`BOC 服务器响应失败: ${response.status}`);
      }

      const html = await response.text();
      
      // 找到所有表格，取数据表格（通常是最大的那个）
      const allTables = html.match(/<table[^>]*>[\s\S]*?<\/table>/g);
      if (!allTables || allTables.length === 0) {
        throw new Error("无法从BOC网站提取数据表格");
      }
      
      // 找到最大的表格（数据表格）
      let tableContent = '';
      let maxLength = 0;
      for (const table of allTables) {
        const match = table.match(/<table[^>]*>([\s\S]*?)<\/table>/);
        if (match && match[1].length > maxLength) {
          maxLength = match[1].length;
          tableContent = match[1];
        }
      }

      // 提取更新时间
      const timeMatch = html.match(/(\d{4}\/\d{2}\/\d{2})\s+(\d{2}:\d{2}:\d{2})/);
      const updateTime = timeMatch ? `${timeMatch[1].replace(/\//g, '-')} ${timeMatch[2]}` : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      
      // 定义货币名称映射
      const currencyMap = {
        '英镑': 'GBP',
        '美元': 'USD',
        '欧元': 'EUR',
        '港币': 'HKD',
        '加拿大元': 'CAD',
        '澳大利亚元': 'AUD',
        '日元': 'JPY'
      };

      // 解析表格行
      const ratesMap = {};
      const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
      
      for (const rowMatch of rowMatches) {
        const row = rowMatch[1];
        const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map(m => m[1].replace(/<[^>]*>/g, '').trim());
        
        if (cells.length < 5) continue;
        
        const name = cells[0];
        const code = currencyMap[name];
        
        if (!code || !TARGET_CURRENCIES.includes(code)) continue;
        
        // 现汇卖出价 (第4列，索引3)
        const price = cells[3] || '0';
        
        ratesMap[code] = { code, name, price };
      }

      // 按照指定顺序返回货币
      const rates = TARGET_CURRENCIES
        .filter(code => ratesMap[code])
        .map(code => ratesMap[code]);

      const result = {
        updateTime,
        rates
      };

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json;charset=utf-8",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  },
};
