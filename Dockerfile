# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 构建参数：API 地址
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 运行阶段：使用 Nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物到 Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建 Nginx 配置
RUN echo 'server { \
    listen 5172; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://admin-api:8082; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 5172

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
