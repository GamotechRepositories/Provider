Operator / Platform
        │
        ▼
   API Gateway (:3000)
   POST /api/v1/launch
        │
        ▼
   Launch Service (:3001)
   1. Validate operator + HMAC
   2. Create session ──────────► Session Service (:3004)
   3. Return sessionToken + launchUrl
        │
        ▼
   Operator opens launchUrl
   (includes sessionToken in URL)
        │
        ▼
   Game (Teen Patti / Ludo / Slots)
   POST /api/v1/sessions/validate
        │
        ▼
   API Gateway → Session Service
   Validates token → Play