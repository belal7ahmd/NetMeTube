cd backend


docker rm netmetube-db -f
docker run -d -p 3306:3306 --env-file ../.env --name netmetube-db netmetube-db