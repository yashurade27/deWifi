#!/bin/sh
set -e

echo "Waiting for Hardhat node at blockchain:8545..."
until nc -z blockchain 8545; do
  sleep 1
done
echo "Hardhat node is up. Proceeding with deploy."

npm run compile
npm run deploy
npm run seed:spots

echo "Blockchain setup complete."
