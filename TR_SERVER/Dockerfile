FROM node:20-slim

WORKDIR /app

# 换阿里云 Debian 镜像源（用 HTTP，容器内无 CA 证书）+ 安装 better-sqlite3 编译依赖
RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖文件，利用缓存
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源码
COPY . .

EXPOSE 3300

CMD ["npm", "start"]
