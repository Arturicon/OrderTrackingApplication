# Этап сборки
FROM node:20-alpine AS build

WORKDIR /app

# Копируем package.json и устанавливаем все зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходники
COPY . .

# Собираем проект
RUN npm run build

# Production этап
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=build /app/dist  /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]