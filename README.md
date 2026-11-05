# ГлотокЪ — готовый комплект для VPS

Загрузите на VPS **всю папку `Glotok-vps`**. Сайт уже собран: Nginx отдаёт HTML, CSS, JavaScript, фотографии и шрифты. Сборка, Node.js, Python и база данных на VPS не нужны.

## Содержимое

```text
Glotok-vps/
├── docker-compose.yml
├── nginx/default.conf
├── site/                  # Готовые страницы и все локальные ресурсы
├── .env.example           # Необязательная настройка порта
└── README.md
```

## Запуск

На VPS должны быть установлены Docker Engine и Docker Compose v2, запущена служба Docker и свободен TCP-порт 80. Команды выполняйте пользователем с доступом к Docker (либо с `sudo`).

1. Загрузите папку через SFTP, например в `/opt/Glotok-vps`. Либо передайте архив `Glotok-vps.zip` и распакуйте его в `/opt`: внутри архива уже есть папка `Glotok-vps`.
2. Подключитесь к VPS по SSH и выполните:

```sh
cd /opt/Glotok-vps
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
```

Откройте `http://IP_ВАШЕГО_VPS/` и `http://IP_ВАШЕГО_VPS/menu/`. Для доступа извне разрешите TCP-порт 80 в сетевых правилах VPS и панели провайдера.

Контейнер автоматически запускается после перезагрузки VPS, если служба Docker включена. Nginx установлен внутри контейнера; отдельно устанавливать его на VPS не требуется.

## Другой порт или существующий Nginx на VPS

Если порт 80 занят, создайте `.env` и задайте другой порт:

```sh
cp .env.example .env
# Откройте .env в редакторе и замените HTTP_PORT=80 на HTTP_PORT=8080.
docker compose up -d
```

После этого сайт доступен по `http://IP_ВАШЕГО_VPS:8080/`. Разрешите выбранный порт в сетевых правилах.

Если существующий обратный прокси на самом VPS будет направлять запросы на сайт, в `.env` задайте `HTTP_BIND_IP=127.0.0.1` и `HTTP_PORT=8080`, затем направьте прокси на `http://127.0.0.1:8080`. В этом случае порт 8080 не требуется открывать извне.

## Домен и HTTPS

Сайт открывается по IP или любому домену, направленному на VPS. В canonical-ссылках, `robots.txt` и `sitemap.xml` уже указан **https://glotok.cafe**. Для него создайте DNS-запись A на IPv4 VPS. Если выберете другой домен, замените `https://glotok.cafe` в `site/index.html`, `site/menu/index.html`, `site/robots.txt` и `site/sitemap.xml`.

Этот Compose запускает **HTTP на порту 80**. HTTPS-сертификат и порт 443 в комплект не включены: HTTPS нужно подключить на внешнем обратном прокси или отдельно настроить в Nginx после привязки домена. До этого сайт проверяется по HTTP; наличие HTTPS-адресов в SEO-метаданных не включает TLS.

## Управление и обновление

```sh
docker compose logs --tail=100 nginx          # Логи
docker compose exec nginx nginx -t           # Проверка конфигурации
docker compose exec nginx nginx -s reload    # Применить правки nginx/default.conf
docker compose down                         # Остановить сайт
docker compose up -d                         # Запустить снова
```

Чтобы обновить сайт, замените файлы **внутри** `site/`. HTML перепроверяется браузером при открытии; CSS, JS, фотографии и шрифты кешируются на сутки. Для немедленного обновления ресурса используйте новое имя файла или параметр версии в ссылке. Если заменили целиком папку `site/` или файл конфигурации через переименование, выполните `docker compose up -d --force-recreate` для обновления подключений.

Чтобы обновить образ Nginx:

```sh
docker compose pull
docker compose up -d
```

Используется официальный образ `nginx:stable-alpine`. Конфигурация включает сжатие, кеширование, заголовки безопасности и собственную страницу 404. Проверка работоспособности контейнера обращается к главной странице.

Документация: [образ Nginx](https://hub.docker.com/_/nginx), [Docker Compose](https://docs.docker.com/reference/compose-file/services/).
