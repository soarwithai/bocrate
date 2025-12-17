
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

    const url = new URL(request.url);
    // 从查询参数 'url' 获取目标地址，或者默认指向 BOC 英文版页面
    const targetUrl = url.searchParams.get("url") || "https://www.boc.cn/sourcedb/whpj/enindex_1619.html";

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });

      const contentType = response.headers.get("Content-Type");
      const text = await response.text();

      return new Response(text, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType || "text/html;charset=utf-8",
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
