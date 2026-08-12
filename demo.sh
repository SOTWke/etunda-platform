#!/bin/bash

# eTunda Platform - Complete Feature Demo Script
# Demonstrates all modular features: Auth, Products, Farmers, Buyers, Orders

API="http://localhost:5000/api"

echo "🌱 eTunda Platform - Feature Demo"
echo "=================================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. REGISTER USERS
echo -e "\n${BLUE}1️⃣  Authentication Feature${NC}"
echo "Registering farmer and buyer..."

FARMER_RESPONSE=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"john_farmer@etunda.com","password":"FarmPassword123","role":"farmer"}')

FARMER_TOKEN=$(echo $FARMER_RESPONSE | jq -r '.token')
FARMER_ID=$(echo $FARMER_RESPONSE | jq -r '.user.id')
echo -e "${GREEN}✅ Farmer registered${NC} - ID: $FARMER_ID"

BUYER_RESPONSE=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice_buyer@etunda.com","password":"BuyerPassword123","role":"buyer"}')

BUYER_TOKEN=$(echo $BUYER_RESPONSE | jq -r '.token')
BUYER_ID=$(echo $BUYER_RESPONSE | jq -r '.user.id')
echo -e "${GREEN}✅ Buyer registered${NC} - ID: $BUYER_ID"

# 2. CREATE FARMER PROFILE
echo -e "\n${BLUE}2️⃣  Farmers Feature${NC}"
echo "Creating farmer profile..."

FARMER_PROFILE=$(curl -s -X POST "$API/farmers" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Kiprotich",
    "location":"Kisii, Kenya",
    "phone":"+254712345678",
    "bio":"Growing organic tomatoes and maize for 15 years"
  }')

FARMER_PROFILE_ID=$(echo $FARMER_PROFILE | jq -r '.data.id')
echo -e "${GREEN}✅ Farmer profile created${NC} - ID: $FARMER_PROFILE_ID"

# 3. CREATE PRODUCTS
echo -e "\n${BLUE}3️⃣  Products Feature${NC}"
echo "Adding products to marketplace..."

PRODUCT1=$(curl -s -X POST "$API/products" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"Organic Tomatoes\",
    \"description\":\"Fresh red tomatoes grown without pesticides\",
    \"price\":80,
    \"quantity\":500,
    \"category\":\"Vegetables\"
  }")

PRODUCT1_ID=$(echo $PRODUCT1 | jq -r '.data.id')
echo -e "${GREEN}✅ Product 1 created${NC} - Organic Tomatoes (KES 80/kg)"

PRODUCT2=$(curl -s -X POST "$API/products" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"Maize Grain\",
    \"description\":\"High-quality yellow maize, drought-resistant variety\",
    \"price\":35,
    \"quantity\":2000,
    \"category\":\"Grains\"
  }")

PRODUCT2_ID=$(echo $PRODUCT2 | jq -r '.data.id')
echo -e "${GREEN}✅ Product 2 created${NC} - Maize Grain (KES 35/kg)"

# 4. LIST PRODUCTS
echo -e "\n${BLUE}4️⃣  Search Products${NC}"
echo "Listing available products..."

PRODUCTS=$(curl -s "$API/products?limit=10" -H "Authorization: Bearer $BUYER_TOKEN")
PRODUCT_COUNT=$(echo $PRODUCTS | jq '.data | length')
echo -e "${GREEN}✅ Found $PRODUCT_COUNT products in marketplace${NC}"

# 5. CREATE BUYER PROFILE
echo -e "\n${BLUE}5️⃣  Buyers Feature${NC}"
echo "Creating buyer profile..."

BUYER_PROFILE=$(curl -s -X POST "$API/buyers" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Alice Mwangi",
    "location":"Nairobi, Kenya",
    "phone":"+254712987654"
  }')

BUYER_PROFILE_ID=$(echo $BUYER_PROFILE | jq -r '.data.id')
echo -e "${GREEN}✅ Buyer profile created${NC} - ID: $BUYER_PROFILE_ID"

# 6. CREATE ORDERS
echo -e "\n${BLUE}6️⃣  Orders Feature${NC}"
echo "Placing orders..."

ORDER1=$(curl -s -X POST "$API/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT1_ID\",
    \"quantity\":50
  }")

ORDER1_ID=$(echo $ORDER1 | jq -r '.data.id')
ORDER1_PRICE=$(echo $ORDER1 | jq -r '.data.total_price')
echo -e "${GREEN}✅ Order 1 created${NC} - 50kg Tomatoes (Total: KES $ORDER1_PRICE)"

ORDER2=$(curl -s -X POST "$API/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT2_ID\",
    \"quantity\":100
  }")

ORDER2_ID=$(echo $ORDER2 | jq -r '.data.id')
ORDER2_PRICE=$(echo $ORDER2 | jq -r '.data.total_price')
echo -e "${GREEN}✅ Order 2 created${NC} - 100kg Maize (Total: KES $ORDER2_PRICE)"

# 7. UPDATE ORDER STATUS
echo -e "\n${BLUE}7️⃣  Order Management${NC}"
echo "Updating order statuses..."

curl -s -X PATCH "$API/orders/$ORDER1_ID/status" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}' > /dev/null
echo -e "${GREEN}✅ Order 1 confirmed by farmer${NC}"

curl -s -X PATCH "$API/orders/$ORDER2_ID/status" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}' > /dev/null
echo -e "${GREEN}✅ Order 2 shipped${NC}"

# 8. GET MY PROFILE
echo -e "\n${BLUE}8️⃣  User Profiles${NC}"

FARMER_CURRENT=$(curl -s "$API/farmers/profile/me" \
  -H "Authorization: Bearer $FARMER_TOKEN")
FARMER_NAME=$(echo $FARMER_CURRENT | jq -r '.data.name')
echo -e "${GREEN}✅ Farmer profile:${NC} $FARMER_NAME"

BUYER_CURRENT=$(curl -s "$API/buyers/profile/me" \
  -H "Authorization: Bearer $BUYER_TOKEN")
BUYER_NAME=$(echo $BUYER_CURRENT | jq -r '.data.name')
echo -e "${GREEN}✅ Buyer profile:${NC} $BUYER_NAME"

# 9. GET MY ORDERS
echo -e "\n${BLUE}9️⃣  My Orders${NC}"

MY_ORDERS=$(curl -s "$API/orders/my-orders" \
  -H "Authorization: Bearer $BUYER_TOKEN")
ORDER_COUNT=$(echo $MY_ORDERS | jq '.data | length')
echo -e "${GREEN}✅ Buyer has $ORDER_COUNT orders${NC}"

# 10. SUMMARY
echo -e "\n${BLUE}📊 Platform Summary${NC}"
echo "========================================="
echo -e "👨‍🌾 Farmer: $FARMER_NAME (ID: $FARMER_ID)"
echo -e "👩 Buyer: $BUYER_NAME (ID: $BUYER_ID)"
echo -e "🌾 Products Listed: 2"
echo -e "📦 Orders Placed: 2"
echo -e "💰 Total Revenue: KES $((ORDER1_PRICE + ORDER2_PRICE))"
echo "========================================="

echo -e "\n${GREEN}✅ Feature Demo Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check API logs: docker logs -f etunda_backend"
echo "2. View database: psql -h localhost -U postgres -d etunda_db"
echo "3. Test frontend: http://localhost:3000"
echo "4. Read docs: cat FEATURE_DEVELOPMENT.md"
