./remove.sh
docker-compose --env-file .env -f docker-compose.yml up -d --build --force-recreate -V
./log.sh