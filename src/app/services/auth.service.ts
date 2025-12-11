import { Injectable, inject } from "@angular/core";
import { Auth, GoogleAuthProvider, signInWithPopup, user, signOut } from "@angular/fire/auth";
import { Firestore, doc, docSnapshots } from "@angular/fire/firestore";
import { Observable, from, of, map } from "rxjs";
import { Settings } from "../models/user.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private firestore = inject(Firestore);

  user$ = user(this.firebaseAuth);

  constructor() {}

  login() {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.firebaseAuth, provider));
  }

  logout() {
    return from(signOut(this.firebaseAuth));
  }

  isAdmin(email: string | null): Observable<boolean> {
    if (!email) return of(false);
    const settingsRef = doc(this.firestore, "settings/global");
    return docSnapshots(settingsRef).pipe(
      map((snapshot) => {
        const data = snapshot.data() as Settings;
        return data?.adminEmails?.includes(email) ?? false;
      })
    );
  }
}
