# Руководство по развертыванию PixelHub

Это руководство описывает процесс развертывания PixelHub в продакшн-окружении. Проект состоит из трех основных компонентов: база данных PostgreSQL, Spring Boot бэкенд и Angular фронтенд.

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка окружения](#подготовка-окружения)
3. [Развертывание базы данных](#развертывание-базы-данных)
4. [Развертывание бэкенда](#развертывание-бэкенда)
5. [Развертывание фронтенда](#развертывание-фронтенда)
6. [Развертывание через Docker Compose](#развертывание-через-docker-compose)
7. [Настройка Nginx как reverse proxy](#настройка-nginx-как-reverse-proxy)
8. [Мониторинг и логирование](#мониторинг-и-логирование)
9. [Резервное копирование](#резервное-копирование)
10. [Обновление приложения](#обновление-приложения)

## Требования

### Минимальные системные требования

- **CPU**: 2 ядра
- **RAM**: 4 GB (рекомендуется 8 GB)
- **Диск**: 20 GB свободного места
- **ОС**: Linux (Ubuntu 20.04+, Debian 11+, или аналогичная)

### Необходимое ПО

- Docker 20.10+ и Docker Compose 2.0+
- Или отдельно:
  - Java 21 JDK
  - Node.js 22+ и npm
  - PostgreSQL 15+
  - Nginx (для фронтенда)

## Подготовка окружения

### 1. Создание файла `.env`

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# База данных
POSTGRES_USER=pixelhub
POSTGRES_PASSWORD=your_secure_password_here_change_me
POSTGRES_DB=pixelhub

# JWT секрет (минимум 64 символа, рекомендуется 128+)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_minimum_64_characters_long_please_change_this

# Настройки приложения
RATE_LIMIT=30
CANVAS_WIDTH=2000
CANVAS_HEIGHT=2000
MIN_COLOR=0
MAX_COLOR=127

# Опционально: настройки JWT
JWT_EXPIRATION_SECOND=604800000
```

**Важно**: 
- Используйте сильные пароли для продакшена
- Сгенерируйте случайный JWT_SECRET (можно использовать `openssl rand -base64 64`)
- Не коммитьте файл `.env` в Git

### 2. Настройка файрвола

Откройте необходимые порты:

```bash
# Для Docker Compose (если используется)
sudo ufw allow 8080/tcp  # Backend
sudo ufw allow 8081/tcp  # Frontend
sudo ufw allow 5432/tcp  # PostgreSQL (только если нужен внешний доступ)

# Или для Nginx reverse proxy
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

## Развертывание базы данных

### Вариант 1: Через Docker Compose (рекомендуется)

База данных автоматически развернется при запуске `docker-compose up`. Проверьте, что контейнер запущен:

```bash
docker-compose ps
docker-compose logs postgres
```

### Вариант 2: Отдельная установка PostgreSQL

#### Установка PostgreSQL 15

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15

# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Создание базы данных и пользователя

```bash
sudo -u postgres psql

-- В psql консоли:
CREATE USER pixelhub WITH PASSWORD 'your_secure_password';
CREATE DATABASE pixelhub OWNER pixelhub;
GRANT ALL PRIVILEGES ON DATABASE pixelhub TO pixelhub;
\q
```

#### Применение миграций

Миграции Liquibase применяются автоматически при запуске Spring Boot приложения. Убедитесь, что в `application.properties` указаны правильные параметры подключения.

### Проверка подключения

```bash
# Через Docker
docker-compose exec postgres psql -U pixelhub -d pixelhub

# Или напрямую
psql -h localhost -U pixelhub -d pixelhub
```

## Развертывание бэкенда

### Вариант 1: Через Docker (рекомендуется)

#### Сборка образа

```bash
cd backend

# Сборка JAR файла
./gradlew build

# Сборка Docker образа
docker build -t pixelhub-backend:latest .
```

#### Запуск контейнера

```bash
docker run -d \
  --name pixelhub-backend \
  --network pixelhub_app-network \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/pixelhub \
  -e SPRING_DATASOURCE_USERNAME=pixelhub \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e DB_USERNAME=pixelhub \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e RATE_LIMIT=30 \
  pixelhub-backend:latest
```

### Вариант 2: Нативная установка

#### Установка Java 21

```bash
# Ubuntu/Debian
sudo apt install openjdk-21-jdk

# Проверка версии
java -version
```

#### Сборка приложения

```bash
cd backend
./gradlew clean build
```

#### Запуск приложения

```bash
# Простой запуск
java -Xms1G -Xmx2G -jar build/libs/backend-0.0.1-SNAPSHOT.jar

# С переменными окружения
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pixelhub
export SPRING_DATASOURCE_USERNAME=pixelhub
export SPRING_DATASOURCE_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret
export RATE_LIMIT=30

java -Xms1G -Xmx2G -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

#### Настройка systemd сервиса

Создайте файл `/etc/systemd/system/pixelhub-backend.service`:

```ini
[Unit]
Description=PixelHub Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=pixelhub
WorkingDirectory=/opt/pixelhub/backend
ExecStart=/usr/bin/java -Xms1G -Xmx2G -jar /opt/pixelhub/backend/build/libs/backend-0.0.1-SNAPSHOT.jar
Environment="SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pixelhub"
Environment="SPRING_DATASOURCE_USERNAME=pixelhub"
Environment="SPRING_DATASOURCE_PASSWORD=your_password"
Environment="JWT_SECRET=your_jwt_secret"
Environment="RATE_LIMIT=30"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активация сервиса:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pixelhub-backend
sudo systemctl start pixelhub-backend
sudo systemctl status pixelhub-backend
```

### Проверка работы бэкенда

```bash
# Проверка health endpoint (если включен Actuator)
curl http://localhost:8080/actuator/health

# Проверка API
curl http://localhost:8080/full-board
```

## Развертывание фронтенда

### Вариант 1: Через Docker (рекомендуется)

#### Сборка образа

```bash
cd frontend

# Сборка Docker образа с build arguments
docker build \
  --build-arg NG_APP_API_BASE=/api \
  --build-arg NG_APP_CANVAS_WIDTH=2000 \
  --build-arg NG_APP_CANVAS_HEIGHT=2000 \
  --build-arg NG_APP_RATE_LIMIT_SECONDS=30 \
  -t pixelhub-frontend:latest .
```

#### Запуск контейнера

```bash
docker run -d \
  --name pixelhub-frontend \
  --network pixelhub_app-network \
  -p 8081:80 \
  pixelhub-frontend:latest
```

### Вариант 2: Нативная установка

#### Установка Node.js 22

```bash
# Используя nvm (рекомендуется)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Или через пакетный менеджер
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Сборка приложения

```bash
cd frontend

# Установка зависимостей
npm ci

# Сборка для продакшена
export NG_APP_API_BASE=/api
export NG_APP_CANVAS_WIDTH=2000
export NG_APP_CANVAS_HEIGHT=2000
export NG_APP_RATE_LIMIT_SECONDS=30

npm run build
```

#### Настройка Nginx

Создайте файл `/etc/nginx/sites-available/pixelhub`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/pixelhub/frontend/dist/frontend/browser;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Angular SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy для API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket для STOMP
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

Активация конфигурации:

```bash
sudo ln -s /etc/nginx/sites-available/pixelhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Развертывание через Docker Compose

### Полное развертывание

1. **Подготовка окружения**:
```bash
# Создайте .env файл (см. раздел "Подготовка окружения")
cp .env.example .env
nano .env  # Отредактируйте значения
```

2. **Сборка и запуск**:
```bash
# Сборка всех образов
docker-compose build

# Запуск в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

3. **Проверка статуса**:
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Остановка и перезапуск

```bash
# Остановка
docker-compose stop

# Перезапуск
docker-compose restart

# Полная остановка с удалением контейнеров
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД!)
docker-compose down -v
```

## Настройка Nginx как reverse proxy

Если вы хотите использовать один домен для фронтенда и бэкенда:

### Конфигурация Nginx

```nginx
upstream backend {
    server localhost:8080;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Настройка HTTPS с Let's Encrypt

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo certbot renew --dry-run
```

## Мониторинг и логирование

### Просмотр логов Docker Compose

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Последние 100 строк
docker-compose logs --tail=100 backend
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
docker system df
```

### Health checks

Backend включает Spring Boot Actuator. Добавьте в `application.properties`:

```properties
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
```

Проверка здоровья:
```bash
curl http://localhost:8080/actuator/health
```

## Резервное копирование

### Резервное копирование базы данных

#### Автоматический бэкап через cron

Создайте скрипт `/opt/pixelhub/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/pixelhub/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Через Docker
docker-compose exec -T postgres pg_dump -U pixelhub pixelhub > $BACKUP_DIR/backup_$DATE.sql

# Или напрямую
# pg_dump -U pixelhub pixelhub > $BACKUP_DIR/backup_$DATE.sql

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Сделайте скрипт исполняемым и добавьте в cron:

```bash
chmod +x /opt/pixelhub/backup.sh
crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00
0 2 * * * /opt/pixelhub/backup.sh
```

#### Восстановление из бэкапа

```bash
# Через Docker
docker-compose exec -T postgres psql -U pixelhub pixelhub < backup_20250101_020000.sql

# Или напрямую
psql -U pixelhub pixelhub < backup_20250101_020000.sql
```

## Обновление приложения

### Обновление через Docker Compose

```bash
# Остановка сервисов (кроме БД)
docker-compose stop backend frontend

# Получение обновлений кода
git pull origin main

# Пересборка образов
docker-compose build backend frontend

# Запуск обновленных сервисов
docker-compose up -d backend frontend

# Проверка логов
docker-compose logs -f backend frontend
```

### Обновление базы данных

Миграции Liquibase применяются автоматически при запуске бэкенда. Убедитесь, что:

1. Бэкап БД создан перед обновлением
2. Бэкенд имеет права на применение миграций
3. Проверены логи на наличие ошибок миграций

### Откат изменений

```bash
# Остановка сервисов
docker-compose stop backend frontend

# Откат к предыдущей версии
git checkout <previous-commit-hash>

# Пересборка и запуск
docker-compose build backend frontend
docker-compose up -d backend frontend
```

## Устранение неполадок

### Бэкенд не запускается

1. Проверьте логи: `docker-compose logs backend`
2. Убедитесь, что БД доступна: `docker-compose exec postgres pg_isready`
3. Проверьте переменные окружения в `.env`
4. Проверьте доступность порта 8080: `netstat -tuln | grep 8080`

### Фронтенд не подключается к бэкенду

1. Проверьте `NG_APP_API_BASE` в build arguments
2. Проверьте CORS настройки в бэкенде
3. Проверьте логи браузера (F12 → Console)
4. Убедитесь, что бэкенд доступен по указанному адресу

### Проблемы с WebSocket

1. Проверьте настройки прокси в Nginx (если используется)
2. Убедитесь, что заголовки `Upgrade` и `Connection` правильно проксируются
3. Проверьте логи бэкенда на ошибки аутентификации WebSocket

### Проблемы с базой данных

1. Проверьте логи: `docker-compose logs postgres`
2. Проверьте подключение: `docker-compose exec postgres psql -U pixelhub -d pixelhub`
3. Проверьте миграции: посмотрите таблицу `databasechangelog`
4. Убедитесь, что volume не переполнен: `df -h`

## Производительность

### Оптимизация PostgreSQL

Добавьте в `/var/lib/postgresql/data/postgresql.conf`:

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Оптимизация Java приложения

Настройте JVM параметры в Dockerfile или systemd сервисе:

```bash
-Xms2G -Xmx4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

## Безопасность

1. **Используйте сильные пароли** для всех сервисов
2. **Настройте файрвол** для ограничения доступа
3. **Используйте HTTPS** в продакшене
4. **Регулярно обновляйте** зависимости и систему
5. **Ограничьте доступ к БД** только с необходимых хостов
6. **Используйте секреты** для хранения паролей (Docker secrets, Kubernetes secrets и т.д.)
7. **Настройте rate limiting** на уровне Nginx для защиты от DDoS

## Дополнительные ресурсы

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Angular Documentation](https://angular.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)

