# ============================================
# 阶段 1：构建前端（Vite 8 需要 Node 22+）
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./
# npm install 比 npm ci 更能容忍 lock 文件差异
RUN npm config set registry https://registry.npmmirror.com \
    && npm install

# 复制源码并构建
COPY . .
RUN npm run build

# ============================================
# 阶段 2：Nginx 提供静态服务
# ============================================
FROM nginx:alpine

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
