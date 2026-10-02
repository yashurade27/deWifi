#!/bin/sh
set -e

echo "Waiting for backend at backend:3000..."
until nc -z backend 3000; do
  sleep 1
done
echo "Backend is up. Proceeding with seed."

npm run seed

echo "Backend seeding complete."
