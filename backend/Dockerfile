FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev libxml2-dev zip unzip \
    oniguruma-dev libzip-dev freetype-dev libjpeg-turbo-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl \
       bcmath gd zip opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
