FROM node:20-slim

WORKDIR /app

# better-sqlite3 编译依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
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
