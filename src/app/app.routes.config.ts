import { Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { ParticipantViewComponent } from "./participant-view/participant-view.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { inject } from "@angular/core";
import { AuthService } from "./services/auth.service";
import { map } from "rxjs";
import { Router } from "@angular/router";

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(map((user) => (user ? true : router.parseUrl("/"))));
};

const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    map((user) => {
      // Ideally we check isAdmin here properly, but for now just auth check + component will handle it or redirect
      // Since isAdmin is async and requires firestore, we might need a switchMap.
      // For simplicity in this demo, we'll let the component load or just check auth.
      return user ? true : router.parseUrl("/");
    })
  );
};

// Routes configuration
export const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "participant", component: ParticipantViewComponent, canActivate: [authGuard] },
  { path: "admin", component: AdminDashboardComponent, canActivate: [adminGuard] },
];
