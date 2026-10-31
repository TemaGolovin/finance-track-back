# Деплой на один VPS (Docker + nginx)

Стек: **PostgreSQL**, **Nest API**, **Next.js**, **nginx** (TLS через Let's Encrypt). API снаружи не публикуется — браузер ходит на Next BFF (`/api/...`), Next проксирует на `http://api:3000`.

## Структура на сервере

Оба репозитория — **соседние каталоги**:

```text
/opt/finance-track/
  finance-track-back/
  finance-track-front/
```

## 1. Подготовка

```bash
cd /opt/finance-track/finance-track-back
cp .env.example .env
chmod 600 .env
```

Заполните минимум:

| Переменная | Пример |
|------------|--------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | сильные значения |
| `JWT_SECRET_CODE`, `JWT_REFRESH_SECRET` | длинные случайные строки |
| `PUBLIC_ORIGIN` | `https://finance.example.com` или на первый запуск `http://IP` |
| `MAIL_*`, `APP_URL` | для писем (в compose `APP_URL` = `PUBLIC_ORIGIN`) |

**Почта на стенде:** в `docker-compose.prod.yml` поднимается **Mailpit**. Если в `.env` не заданы `MAIL_HOST` / `MAIL_PORT`, API шлёт письма в `mailpit:1025`. Веб-интерфейс: `{PUBLIC_ORIGIN}/mailpit/` (регистрация, сброс пароля, верификация). Для реальной доставки укажите Resend или другой SMTP в `.env` (см. комментарии в `.env.example`). На публичном проде с внешним SMTP удалите блок `location /mailpit/` из nginx, чтобы не светить перехватчик писем.

`DATABASE_URL` в `.env` нужен для локального Prisma; в compose для `api`/`migrate` хост переопределяется на `postgres`.

## 2. Запуск

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Снаружи открыты только **80** и **443**. Проверка: откройте `PUBLIC_ORIGIN` в браузере.

Логи:

```bash
docker compose -f docker-compose.prod.yml logs -f nginx web api
```

## 3. HTTPS (Let's Encrypt)

1. DNS домена → IP VPS, порт **80** доступен с интернета.
2. В `PUBLIC_ORIGIN` уже должен быть `https://ваш-домен` **до** сборки фронта (см. ниже).
3. Выпустить сертификат (подставьте email и домен):

```bash
docker compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d finance.example.com \
  --email you@example.com --agree-tos --no-eff-email
```

4. Скопировать и отредактировать SSL-конфиг nginx:

```bash
cp deploy/nginx/conf.d/20-https.conf.example deploy/nginx/conf.d/20-https.conf
# server_name и пути к /etc/letsencrypt/live/...
```

5. Перезагрузить nginx:

```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

6. Пересобрать фронт с `PUBLIC_ORIGIN=https://...` (иначе `NEXT_PUBLIC_API_BFF` останется старым):

```bash
docker compose -f docker-compose.prod.yml up -d --build web
```

Контейнер **certbot** в compose периодически делает `certbot renew`.

Опционально: редирект HTTP→HTTPS — добавьте в `10-http.conf` отдельный `location /` с `return 301 https://$host$request_uri;`, оставив `/.well-known/acme-challenge/` как сейчас.

## 4. Обновление версии

```bash
git pull   # в обоих репозиториях
docker compose -f docker-compose.prod.yml up -d --build
```

Миграции применяются сервисом `migrate` перед стартом `api`.

## 5. Бэкапы БД

См. [BACKUP_GUIDE.md](../BACKUP_GUIDE.md). Контейнер Postgres: `finance-track-postgres`.

## Локальная разработка

Без nginx — прежний [docker-compose.yml](../docker-compose.yml) (только Postgres + API на порту **3001**). Фронт: `pnpm dev` на хосте.
