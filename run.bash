#!/bin/bash

# 1. Start the DB
docker start netmetube-db

# 2. Wait for MySQL to be ready
echo "Waiting for MySQL..."
until nc -z -v -w3 localhost 3306; do
  sleep 1
done

# 3. Start Backend and Frontend in the background
cd backend && npm run dev &
cd Frontend && npm run dev &

# Keep the script running
wait
