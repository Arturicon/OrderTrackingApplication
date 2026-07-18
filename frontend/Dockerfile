FROM node:20-alpine AS build
WORKDIR /app

# Копируем package.json и package-lock.json из папки frontend
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

# Копируем всё из папки frontend
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]