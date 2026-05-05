# Appointment Scheduling Module

This is the standalone appointment scheduling part of the Clinic Appointment System.

## Structure

```
appointment-scheduling/
├── backend/
│   ├── src/
│   │   ├── app.js                        # Express app entry
│   │   ├── server.js                     # Server startup
│   │   ├── config/
│   │   │   └── db.js                     # MongoDB connection
│   │   ├── controllers/
│   │   │   └── appointmentController.js  # Core appointment logic
│   │   ├── middleware/
│   │   │   ├── auth.js                   # Auth middleware
│   │   │   └── validateRequest.js        # Request validation
│   │   ├── models/
│   │   │   ├── Appointment.js            # Appointment schema
│   │   │   ├── Doctor.js                 # Referenced model
│   │   │   ├── Patient.js                # Referenced model
│   │   │   └── User.js                   # Referenced model
│   │   ├── routes/
│   │   │   └── appointmentRoutes.js      # API routes
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   ├── crudController.js
│   │   │   ├── referenceId.js
│   │   │   └── validationPatterns.js
│   │   └── validators/
│   │       ├── appointmentValidators.js
│   │       └── sharedValidators.js
│   ├── .env.example
│   └── package.json
│
└── mobile/
    ├── app/
    │   ├── (tabs)/appointments.tsx        # Tab entry point
    │   ├── appointments/                  # Admin appointment screens
    │   │   ├── [id].tsx
    │   │   ├── [id]/edit.tsx
    │   │   └── new.tsx
    │   ├── patient/                       # Patient-facing screens
    │   │   ├── appointments.tsx
    │   │   ├── appointments/[id].tsx
    │   │   └── book.tsx                   # Book appointment screen
    │   └── doctor/appointments/           # Doctor-facing screens
    │       └── [id].tsx
    ├── services/
    │   └── appointments.ts               # API calls
    ├── components/, constants/, context/, hooks/, types/, utils/
    ├── .env.example
    └── package.json
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in MONGODB_URI and JWT_SECRET
node src/server.js
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env   # Fill in API_URL
npx expo start
```

## API Endpoints
- `GET    /api/appointments`       - List all appointments
- `POST   /api/appointments`       - Create appointment
- `GET    /api/appointments/:id`   - Get appointment details
- `PUT    /api/appointments/:id`   - Update appointment
- `DELETE /api/appointments/:id`   - Delete appointment
