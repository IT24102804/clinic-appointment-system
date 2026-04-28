# Clinic Appointment System - Backend

## Patient auth + profile flow

This backend supports the following flow used by the mobile app:

UI → API Route → Controller → MongoDB (Mongoose) → JSON Response → UI

### Routes

- `POST /api/auth/register`
  - Controller: `src/controllers/authController.js` (`register`)
  - Creates a `User` and returns `{ token, user }`

- `POST /api/auth/login`
  - Controller: `src/controllers/authController.js` (`login`)
  - Validates credentials and returns `{ token, user }`

- `GET /api/patients/profile`
  - Route: `src/routes/patientRoutes.js`
  - Controller: `src/controllers/patientContoller.js` (`getProfile`)
  - Requires JWT (`protect` middleware)
  - Returns 404 if patient profile does not exist

- `POST /api/patients/profile`
  - Route: `src/routes/patientRoutes.js`
  - Controller: `src/controllers/patientContoller.js` (`createProfile`)
  - Requires JWT (`protect` middleware)
  - Creates the `Patient` document linked to the logged-in `User`

### Patient profile fields

On profile creation, the controller expects:

- `NIC`
- `phone`
- `dateOfBirth`
- `gender`
- `addressLine1`
- `addressLine2` (optional)
- `city`

The patient schema is defined in `src/models/Patient.js`.

### Authentication

JWT payload contains:

- `userId`
- `role`

Tokens are signed with `JWT_SECRET` and expire in 7 days.
