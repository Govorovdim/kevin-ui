# Kevin UI

React Native (Expo) frontend for [Kevin](https://wackyduckling.com/kevin/) — a household financial planner.

## Demo

A deployed demo is available at **<https://wackyduckling.com/kevin/>**

- **User:** `demo`
- **Password:** `password`

## Features

### AI Chat

Kevin includes a built-in **Gemini-powered AI assistant** available from the
home and dashboard screens. The assistant is context-aware — it receives the
active household, the selected year/month, and a financial summary (net worth,
portfolio value, debt, income, and expenses).

The assistant doesn't just answer questions — it can take actions on your
behalf, such as:

- create records,
- update existing entries,
- delete records,
- find records by the name or sum,
- convert currencies,
- calculating figures from your financial data.

Chat sessions are kept per-household and stored locally, so you can switch
between conversations from the chat history view.

Requests are sent to the backend `/api/v1/chat/` endpoint, which proxies them to
Google Gemini — no API key is configured in the frontend.

## Setup

```bash
npm install
cp .env.example .env   # configure API URL
npx expo start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |
| `EXPO_PUBLIC_APP_URL` | App URL for deep linking (e.g. `http://localhost:8081`) |
