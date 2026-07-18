FROM node:20-alpine AS build

# Принимаем аргументы сборки
ARG VITE_BACKEND_URL
ARG VITE_NOTIFY_URL

# Делаем их доступными во время сборки
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_NOTIFY_URL=$VITE_NOTIFY_URL

WORKDIR /app

# Копируем package.json и package-lock.json из папки frontend
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

# Копируем всё из папки frontend
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]