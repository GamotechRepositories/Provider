# Enabled Games Service

**Folder:** `enbledgames/`  
**Port:** `3002`  
**Production URL:** proxied via `https://api.dpbossking.com/api/v1/enabled-games`

## Purpose

Returns the list of games enabled for an operator, enriched with full game details (thumbnail, launchUrl, etc.) from the Games API.

## Flow

```
API Gateway
      │
      ▼
Enabled Games Service
  1. Fetch operator by operatorId
  2. Get enabledGames IDs from operator record
  3. Fetch each game from Games API
  4. Return enriched game list
```

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/enabled-games?operatorId=` | List enabled games for operator |
| GET | `/health` | Health check |

## Request (via Gateway)

```bash
GET https://api.dpbossking.com/api/v1/enabled-games?operatorId=AAKDA-001
```

## Success response

```json
{
  "success": true,
  "operatorId": "AAKDA-001",
  "operatorName": "Aakda",
  "count": 2,
  "enabledGames": [
    {
      "_id": "6a95526f52ceb66fa14e0012",
      "name": "Teen Patti",
      "slug": "teen-patti",
      "code": "TEENPATTI",
      "status": "ACTIVE",
      "thumbnail": "https://...",
      "launchUrl": "https://www.doormart.shop/",
      "demoUrl": "https://www.doormart.shop/",
      "maintenanceMode": false
    }
  ]
}
```

## Project structure

```
enbledgames/
├── controllers/
│   └── enabledGamesController.js
├── routes/
│   └── enabledGames.js
└── services/
    ├── enabledGamesService.js
    ├── operatorRepository.js
    └── gameRepository.js
```

## Environment

```env
PORT=3002
OPERATOR_BASE_URL=https://admin.dpbossking.com/api/v1
```

## Run locally

```bash
cd enbledgames && npm start
```

## Notes

- Standalone microservice — not called by Launch Service.
- `operatorId` is passed as a **query parameter**, not URL path.
- Each game's `launchUrl` comes from the Games API, not hardcoded.
