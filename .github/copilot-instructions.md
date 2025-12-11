# Secret Santa Project Instructions

## Project Context

- **Stack**: Angular 18 (Standalone Components), Firebase (Authentication, Firestore, Hosting, Functions), Tailwind CSS.
- **Purpose**: A web application for managing Secret Santa exchanges.
- **Key Features**: Google Login, Admin Dashboard (manage participants, generate matches), Participant View (reveal assignment), Automated Reminders (Cloud Functions).

## Architecture & Patterns

### Angular

- **Standalone Components**: All components are standalone. Do not use `NgModule`.
- **Dependency Injection**: Use `inject()` function instead of constructor injection.
  ```typescript
  // Preferred
  private firestore = inject(Firestore);
  // Avoid
  constructor(private firestore: Firestore) {}
  ```
- **State Management**: The codebase heavily uses `Observable` (AngularFire). Use `AsyncPipe` in templates to subscribe/unsubscribe automatically.

### Firebase & Data Model

- **Collections**:
  - `participants`: Documents keyed by **email**. Stores user profile, status, and exclusions.
  - `assignments`: Documents keyed by **giverEmail**. Stores the match result.
  - `settings`: Singleton document `settings/global`. Stores `adminEmails` array, `exchangeDate`, and app state (`isAssignmentsGenerated`).
  - `notificationTokens`: Stores FCM tokens for reminders.
- **Security Rules (`firestore.rules`)**:
  - **Admin Access**: Determined by checking if `request.auth.token.email` exists in `settings/global.adminEmails`.
  - **Assignments**:
    - Readable by all authenticated users (to check availability/prevent duplicates).
    - Create/Update restricted to Admin (generation) or User (drawing their own, updating `isRevealed`).
- **Cloud Functions**:
  - `sendReminders`: Scheduled function (every 24h) that checks `exchangeDate` and sends notifications 3 days prior.

### Styling

- **Tailwind CSS**: Use utility classes for all styling. Avoid custom CSS in `styles.css` unless necessary for global resets or complex animations (e.g., `canvas-confetti`).

## Critical Workflows

### Assignment Logic (`FirestoreService`)

- **Batch Generation (`generateAssignments`)**: Admin-triggered. Performs a client-side shuffle (derangement) and writes all assignments in a single batch. Updates `settings/global` flag `isAssignmentsGenerated`.
- **Individual Draw (`drawAssignment`)**: User-triggered (if enabled). Uses a **Firestore Transaction** to:
  1. Read all participants and existing assignments.
  2. Filter candidates (exclude self, existing receivers, and specific exclusions).
  3. Prevent deadlocks (e.g., forcing a pick if only 2 people remain).
  4. Write the new assignment.

### Authentication & Routing

- **AuthService**: Wraps Firebase Auth (Google Sign-In).
- **Guards (`app.routes.config.ts`)**:
  - `authGuard`: Protects `/participant`.
  - `adminGuard`: Protects `/admin`. _Note: Currently performs a simple auth check; robust admin validation should happen in the component or be enhanced._

## Development & Build

- **Run Locally**: `npm start` (serves on port 4200).
- **Build**: `npm run build` (outputs to `dist/secret-santa`).
- **Deploy**: `npx firebase-tools deploy` (deploys Hosting, Firestore Rules, and Functions).

## Common Tasks

- **Adding a Participant Field**: Update `Participant` interface in `user.model.ts` and `FirestoreService` methods.
- **Updating Rules**: Modify `firestore.rules`. Always test complex logic (like `isAdmin` or assignment validation) in the Firebase Console simulator before deploying.
- **Debugging Functions**: Use `firebase functions:log` to view logs for `sendReminders`.
