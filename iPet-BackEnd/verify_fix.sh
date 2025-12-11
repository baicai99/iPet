#!/bin/bash

# Base URL
API_URL="http://localhost:3000/api"
EMAIL="testuser_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "1. Registering user..."
curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}"

echo -e "\n\n2. Logging in..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi

echo "Token: $TOKEN"

echo -e "\n\n3. Creating Pet..."
curl -v -X POST "$API_URL/pets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Buddy",
    "type": "dog",
    "breed": "Golden Retriever",
    "gender": "male",
    "birthday": "2020-01-01",
    "weight": 30,
    "isSterilized": true,
    "chipId": "123456789",
    "toys": "Ball",
    "personality": ["Friendly", "Playful"],
    "allergens": "None",
    "vaccineDate": "2023-01-01",
    "description": "A good boy",
    "avatar": "http://example.com/avatar.jpg"
  }'
