# Parlant ↔ MyOperator WhatsApp Bridge

Local Fastify service that receives WhatsApp Cloud webhooks, maps senders to Parlant sessions, and replies via MyOperator.

## Backend quick start

```bash
npm install
npm run dev
```

Defaults:
- Port: `8083`
- DB: `./data/bridge.db`

Environment overrides:
- `BRIDGE_PORT`
- `BRIDGE_HOST`
- `BRIDGE_DB_PATH`

## UI quick start

The repo also includes a Next.js UI for managing bridge config and running tests.

```bash
cd presentation
npm install
npm run dev
```

Open `http://localhost:3000/channels/whatsapp-bridge`.

The UI talks to the bridge API at `http://localhost:8083` by default. Override with `NEXT_PUBLIC_BRIDGE_BASE_URL` if needed.

## Core endpoints

- `POST /webhook/whatsapp` (Meta webhook payload)
- `GET /health`
- `GET /config`
- `PUT /config`
- `POST /test/send`
- `POST /test/parlant`
- `GET /status`

## Config shape

```json
{
  "parlant": {
    "baseUrl": "http://localhost:8800",
    "agentId": "riva",
    "apiKey": null
  },
  "session": { "ttlHours": 24 },
  "webhook": {
    "allowedPhoneNumberIds": ["106540352242922"],
    "allowedDisplayNumbers": ["15550783881"],
    "verify": {
      "enabled": false,
      "headerName": "X-Hub-Signature-256",
      "secret": ""
    }
  },
  "myoperator": {
    "sendApi": {
      "url": "https://publicapi.myoperator.co/chat/messages",
      "apiKey": "",
      "companyId": "",
      "defaultMyopPhoneNumberId": "87673432323365",
      "defaultCountryCode": "91",
      "previewUrl": false,
      "customerNumberFormat": "E164"
    }
  }
}
```

## Docker

```bash
docker compose up --build
```

The service listens on `http://localhost:8083`.

## Notes

- Webhook idempotency uses WhatsApp message `id` (wamid).
- Signature verification supports `X-Hub-Signature-256` when enabled.
- No secrets are logged; keep API keys in config and avoid committing them.
- UI source lives in `presentation/src/app/channels/whatsapp-bridge`.
