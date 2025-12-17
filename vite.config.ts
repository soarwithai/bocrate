import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      // 关键修改：base 必须设置为仓库名路径，前后带斜杠
      // 这样 index.css 就会从 /bocrate/index.css 加载，而不是从根目录加载
      base: '/bocrate/', 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [react()],

      resolve: {
        alias: {
          // 保持 alias 配置，方便路径引用
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
