# Kevin UI

React Native (Expo) frontend for [Kevin](https://github.com/Govorovdim/kevin) — a household financial planner.

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
