# 🏥 Clinic Appointment System — Complete Setup Guide

## What Was Added / Changed

### Backend Changes
| File | What Changed |
|------|-------------|
| `models/Doctor.js` | Added `photo`, `email`, `experience`, `fee`, `availability[]` fields |
| `models/User.js` | **NEW** — Admin user model with bcrypt password hashing |
| `controllers/authController.js` | **NEW** — Login + seed admin endpoint |
| `controllers/doctorController.js` | Full CRUD + photo file handling |
| `middleware/authMiddleware.js` | **NEW** — JWT token verification |
| `middleware/uploadMiddleware.js` | **NEW** — Multer photo upload (5MB max) |
| `routes/authRoutes.js` | **NEW** — `/api/auth/login` and `/api/auth/seed` |
| `routes/doctorRoutes.js` | All routes now require JWT auth + support photo upload |
| `app.js` | Added auth routes + static `/uploads` folder |
| `.env` | Added `JWT_SECRET` |
| `package.json` | Added: `bcryptjs`, `jsonwebtoken`, `multer` |

### Mobile Changes
| File | What Changed |
|------|-------------|
| `app/_layout.tsx` | Added AuthProvider + navigation guard (redirect to login if not logged in) |
| `app/login.tsx` | **NEW** — Beautiful login screen |
| `app/(tabs)/index.tsx` | **NEW** — Dashboard with stats + recent doctors |
| `app/doctors/index.tsx` | **NEW** — Full doctor list with search, filter, delete |
| `app/doctors/new.tsx` | **NEW** — Add doctor page |
| `app/doctors/[id]/index.tsx` | **NEW** — Doctor detail view |
| `app/doctors/[id]/edit.tsx` | **NEW** — Edit doctor page |
| `components/DoctorForm.tsx` | **NEW** — Reusable form with photo picker + availability |
| `services/doctors.ts` | Full API service with JWT auth + FormData for photo upload |
| `services/auth-storage.ts` | **NEW** — Save/get/clear JWT token using AsyncStorage |
| `hooks/useAuth.tsx` | **NEW** — Auth context (login, logout, user state) |
| `constants/api.ts` | Added `API_BASE_URL` |
| `package.json` | Added: `expo-image-picker`, `@react-native-async-storage/async-storage` |

---

## 📋 STEP-BY-STEP SETUP

---

### STEP 1 — Copy Updated Files

Copy all updated files from this output into your project:

```
clinic-appointment-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js                  ← replace
│   │   ├── controllers/
│   │   │   ├── authController.js         ← NEW
│   │   │   └── doctorController.js       ← replace
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         ← NEW
│   │   │   ├── uploadMiddleware.js       ← NEW
│   │   │   └── validateRequest.js        ← replace
│   │   ├── models/
│   │   │   ├── Doctor.js                 ← replace
│   │   │   └── User.js                   ← NEW
│   │   ├── routes/
│   │   │   ├── authRoutes.js             ← NEW
│   │   │   └── doctorRoutes.js           ← replace
│   │   ├── validators/doctorValidators.js← replace
│   │   ├── app.js                        ← replace
│   │   └── server.js                     ← replace
│   ├── .env                              ← replace
│   └── package.json                      ← replace
│
└── mobile/
    ├── app/
    │   ├── _layout.tsx                   ← replace
    │   ├── login.tsx                     ← NEW
    │   ├── (tabs)/
    │   │   ├── _layout.tsx               ← replace
    │   │   └── index.tsx                 ← replace
    │   └── doctors/
    │       ├── index.tsx                 ← NEW
    │       ├── new.tsx                   ← NEW
    │       └── [id]/
    │           ├── index.tsx             ← NEW
    │           └── edit.tsx              ← NEW
    ├── components/
    │   └── DoctorForm.tsx                ← NEW
    ├── constants/api.ts                  ← replace
    ├── services/
    │   ├── doctors.ts                    ← replace
    │   └── auth-storage.ts              ← NEW
    ├── hooks/useAuth.tsx                 ← NEW
    └── package.json                      ← replace
```

---

### STEP 2 — Backend: Install New Packages

Open terminal in the `backend` folder:

```bash
cd backend
npm install bcryptjs jsonwebtoken multer
```

---

### STEP 3 — Backend: Update .env

Your `.env` already has MONGODB_URI. Just make sure `JWT_SECRET` is added:

```
MONGODB_URI=your_mongodb_uri_here
PORT=5000
JWT_SECRET=clinic_super_secret_jwt_key_2025
```

---

### STEP 4 — Backend: Start Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

---

### STEP 5 — Backend: Create Admin User (ONE TIME ONLY)

Open a browser or Postman and visit:

```
POST http://localhost:5000/api/auth/seed
```

Or using curl:
```bash
curl -X POST http://localhost:5000/api/auth/seed
```

Response:
```json
{ "success": true, "message": "Admin created: admin@clinic.com / admin123" }
```

✅ Now you have an admin account.

---

### STEP 6 — Mobile: Install New Packages

Open terminal in the `mobile` folder:

```bash
cd mobile
npx expo install expo-image-picker @react-native-async-storage/async-storage
```

---

### STEP 7 — Mobile: Update Your IP Address

Find your computer's local IP address:
- **Windows**: Run `ipconfig` → look for "IPv4 Address" (e.g. 192.168.1.5)
- **Mac/Linux**: Run `ifconfig` → look for inet address

Then update `mobile/constants/api.ts`:

```typescript
export const API_BASE_URL = "http://192.168.YOUR.IP:5000"; // ← change this
```

---

### STEP 8 — Mobile: Start Expo

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

### STEP 9 — Test the Full Flow

1. **Open the app** → You will be redirected to the **Login page**
2. **Login** with:
   - Email: `admin@clinic.com`
   - Password: `admin123`
3. You will land on the **Dashboard**
4. Tap **+ Add Doctor** to add a doctor with photo
5. Go to **View All** to see the doctor list
6. Tap a doctor to see their **Profile**
7. Tap **✏️ Edit** to update details or change photo
8. Tap **🗑️ Delete** to remove a doctor

---

## 🔑 API Endpoints Summary

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/auth/seed` | Create admin user (one time) | ❌ |
| POST | `/api/auth/login` | Login, get JWT token | ❌ |
| GET | `/api/doctors` | List all doctors | ✅ JWT |
| POST | `/api/doctors` | Create doctor + upload photo | ✅ JWT |
| GET | `/api/doctors/:id` | Get single doctor | ✅ JWT |
| PUT | `/api/doctors/:id` | Update doctor + photo | ✅ JWT |
| DELETE | `/api/doctors/:id` | Delete doctor | ✅ JWT |
| GET | `/uploads/:filename` | Serve doctor photo | ❌ |

---

## 🧩 Doctor Schema

```json
{
  "name": "John Smith",
  "specialization": "Cardiologist",
  "phone": "+1 234 567 890",
  "email": "john@clinic.com",
  "experience": 10,
  "fee": 95,
  "status": "active",
  "photo": "doctor_1234567890.jpg",
  "availability": [
    { "day": "Mon", "startTime": "09:00", "endTime": "17:00" },
    { "day": "Wed", "startTime": "10:00", "endTime": "15:00" }
  ]
}
```

---

## ❓ Troubleshooting

**"Network request failed"** → Check your IP in `constants/api.ts`

**"Unauthorized"** → Token expired, logout and login again

**Photo not showing** → Make sure backend `uploads/` folder exists and `/uploads` static route is working

**Login fails** → Make sure you ran the seed endpoint (Step 5)
