#!/bin/bash

echo "🔧 Test CMS Headless API"
echo "========================"

BASE_URL="http://localhost:3000/api"

echo -e "\n1️⃣  Health Check"
curl -s $BASE_URL/health | json_pp

echo -e "\n\n2️⃣  Crea nuova risorsa 'article'"
curl -s -X POST $BASE_URL/admin/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "article",
    "pluralName": "articles",
    "displayName": "Articolo",
    "fields": [
      {
        "name": "title",
        "type": "string",
        "required": true,
        "label": "Titolo"
      },
      {
        "name": "content",
        "type": "richtext",
        "required": true,
        "label": "Contenuto"
      },
      {
        "name": "published",
        "type": "boolean",
        "default": false,
        "label": "Pubblicato"
      }
    ]
  }' | json_pp

echo -e "\n\n3️⃣  Lista risorse"
curl -s $BASE_URL/admin/resources | json_pp

echo -e "\n\n4️⃣  Crea un articolo"
curl -s -X POST $BASE_URL/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Primo articolo",
    "content": "Questo è il contenuto del primo articolo",
    "published": true
  }' | json_pp

echo -e "\n\n5️⃣  Lista articoli"
curl -s "$BASE_URL/articles" | json_pp

echo -e "\n\n✅ Test completato!"