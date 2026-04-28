# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## App architecture (frontend)

This mobile app follows the flow:

UI (screens) → Services (API calls) → Backend Controllers → MongoDB → Response → UI

### Key folders

- **app/**
  - File-based routes (screens) powered by Expo Router.
  - Example:
    - `app/(auth)/login.tsx` (UI)
    - `app/(auth)/complete-profile.tsx` (UI)

- **components/**
  - Reusable building blocks.
  - `components/ui/*` contains shared UI components (buttons, inputs, logo, cards, etc.).

- **services/**
  - Central place for all HTTP calls.
  - Examples:
    - `services/auth.ts` calls `/api/auth/*`
    - `services/patients.ts` calls `/api/patients/*`

- **types/**
  - TypeScript types used by UI + services.
  - Examples:
    - `types/auth.ts`
    - `types/patient.ts`

## Patient registration + login (Option A + Option 2)

### Registration (patient only)

- UI: `app/(auth)/register.tsx`
- Service: `services/auth.ts` (`registerPatient`)
- Backend: `POST /api/auth/register`

The frontend always sends `role: "patient"` during registration, so any user created via the mobile app is automatically a patient.

After successful registration, the user is redirected to the login screen.

### Login + profile check (Option A)

- UI: `app/(auth)/login.tsx`
- Service: `services/auth.ts` (`login`)
- Backend: `POST /api/auth/login`

After login, the app immediately calls:

- Service: `services/patients.ts` (`getPatientProfile`)
- Backend: `GET /api/patients/profile`

Routing rules:

- If `GET /api/patients/profile` returns **200** → redirect to `/(tabs)`.
- If it returns **404** → redirect to `/(auth)/complete-profile` so the patient can create their profile.

### Complete profile

- UI: `app/(auth)/complete-profile.tsx`
- Service: `services/patients.ts` (`createPatientProfile`)
- Backend: `POST /api/patients/profile`

After profile creation succeeds, the user is redirected to `/(tabs)`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
