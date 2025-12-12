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

2.  **Configure Firebase**
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Create a new project.
    - Enable **Authentication** (Google Sign-In).
    - Enable **Firestore Database**.
    - Copy your web app configuration.
    - Update `src/environments/environment.ts` with your keys.

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
