# 使用 Node 22 官方镜像
FROM node:22-alpine

WORKDIR /app

# 安装编译工具（better-sqlite3 需要 C++ 编译）
RUN apk add --no-cache python3 make g++

# 复制依赖描述文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 清理编译工具，减小镜像体积
RUN apk del python3 make g++

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3300

# 启动应用
CMD ["node", "src/index.js"]
