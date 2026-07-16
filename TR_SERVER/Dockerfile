# 使用 Node 22 官方镜像
FROM node:22-alpine

WORKDIR /app

# 复制依赖描述文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3300

# 启动应用
CMD ["node", "src/index.js"]
