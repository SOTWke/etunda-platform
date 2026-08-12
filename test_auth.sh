#!/bin/bash

echo "=== TEST 1: Registration with new email ==="
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser2@example.com","password":"password123","role":"farmer"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 2: Registration with duplicate email (should return 409) ==="
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@example.com","password":"password123","role":"buyer"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 3: Login with correct password ==="
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@example.com","password":"password123"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 4: Login with incorrect password ==="
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@example.com","password":"wrongpassword"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 5: Buyer registration ==="
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buyeruser@example.com","password":"password123","role":"buyer"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 6: Login as buyer ==="
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyeruser@example.com","password":"password123"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST 7: Check database integrity - verify only one user per email ==="
docker exec etunda_postgres psql -U postgres -d etunda -c "SELECT COUNT(*), email FROM users GROUP BY email HAVING COUNT(*) > 1;"
echo ""
docker exec etunda_postgres psql -U postgres -d etunda -c "SELECT id, email, role FROM users ORDER BY created_at;"
