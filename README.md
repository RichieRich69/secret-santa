# Secret Santa App 🎅

A production-ready Secret Santa web app built with Angular 18, Firebase, and Tailwind CSS.

## Home Page
![Home Page](https://raw.githubusercontent.com/RichieRich69/secret-santa/refs/heads/main/.readme-media/home-page.gif)

## Prerequisites

- Node.js (v18+)
- Firebase Account

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**
    - Create a `.env` file in the root directory.
    - Add your Firebase configuration keys:
      ```env
      FIREBASE_API_KEY=your_api_key
      FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
      FIREBASE_PROJECT_ID=your_project_id
      FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
      FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      FIREBASE_APP_ID=your_app_id
      FIREBASE_MEASUREMENT_ID=your_measurement_id
      ```
    - The application will automatically generate the environment files when you run `npm start` or `npm run build`.

3.  **Set Admin**
    - In Firestore, create a collection `settings` and a document `global`.
    - Add a field `adminEmails` (array) and add your Gmail address.
    - Add `isAssignmentsGenerated` (boolean) set to `false`.

4.  **Deploy Security Rules**
    - Copy the contents of `firestore.rules` to your Firebase Console Rules tab, or deploy using CLI:
    ```bash
    npx firebase-tools deploy --only firestore:rules
    ```

## Run Locally

```bash
npm start
```
Navigate to `http://localhost:4200`.

## Build for Production

```bash
npm run build
```
The output will be in `dist/secret-santa`.

## Cloud Functions (Optional)

To enable push notifications:
1.  Navigate to `functions` folder.
2.  Run `npm install`.
3.  Deploy functions:
    ```bash
    npx firebase-tools deploy --only functions
    ```
