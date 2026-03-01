# Railway Manual Configuration

যদি `railway.json` কাজ না করে, তাহলে Railway Dashboard থেকে manually configure করুন:

## Settings → Build

**Root Directory:** `backend`

**Build Command:**
```bash
npm install && npm run build
```

**Install Command:**
```bash
npm install
```

## Settings → Deploy

**Start Command:**
```bash
npm run start
```

**Watch Paths:**
```
backend/**
```

## Settings → Environment

**Node Version:**
```
18.x
```

## Alternative: Simple Approach

Railway.json delete করে শুধু এই settings manually দিন dashboard থেকে।

অথবা root এ একটা `package.json` তৈরি করুন:

```json
{
  "name": "socialautopro",
  "version": "1.0.0",
  "scripts": {
    "build": "cd backend && npm install && npm run build",
    "start": "cd backend && npm run start"
  }
}
```

এটা সবচেয়ে সহজ!
