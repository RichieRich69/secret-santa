import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { FirestoreService } from "../services/firestore.service";
import { switchMap, map, tap, startWith } from "rxjs/operators";
import { combineLatest, of } from "rxjs";
import { User } from "@angular/fire/auth";
import { CardGridComponent } from "./card-grid.component";
import { AssignmentRevealComponent } from "./assignment-reveal.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-participant-view",
  standalone: true,
  imports: [CommonModule, CardGridComponent, AssignmentRevealComponent, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-4">
      <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center mb-8">
          <div class="flex items-center gap-4">
            <img [src]="(user$ | async)?.photoURL || 'assets/placeholder-user.png'" (error)="handleImageError($event)" class="w-10 h-10 rounded-full bg-gray-300" alt="User Avatar" />
            <span class="font-bold text-gray-700">{{ (user$ | async)?.displayName }}</span>
          </div>
          <button (click)="logout()" class="text-sm text-gray-500 hover:text-red-600">Sign Out</button>
        </header>

        <div *ngIf="vm$ | async as vm">
          <!-- Admin Link -->
          <div *ngIf="vm.isAdmin" class="mb-6 text-right">
            <a routerLink="/admin" class="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"> Go to Admin Dashboard 🛠️ </a>
          </div>

          <!-- Case 1: Not Generated Yet -->
          <div *ngIf="!vm.settings?.isAssignmentsGenerated" class="text-center mt-20">
            <h2 class="text-2xl font-bold text-gray-600">Hold your reindeer! 🦌</h2>
            <p class="text-gray-500 mt-2">The admin hasn't generated the assignments yet.</p>
          </div>

          <!-- Case 2: Generated -->
          <ng-container *ngIf="vm.settings?.isAssignmentsGenerated">
            <!-- Case 2a: Assignment Exists (Revealed) -->
            <app-assignment-reveal *ngIf="vm.assignment" [assignment]="vm.assignment!"> </app-assignment-reveal>

            <!-- Case 2b: No Assignment Yet (Pick a Card) -->
            <div *ngIf="!vm.assignment">
              <h2 class="text-center text-2xl font-bold text-red-600 mb-6">Pick a Card to Draw your Match!</h2>
              <app-card-grid [count]="vm.participantCount" (selected)="onCardSelected(vm.user.email!)"> </app-card-grid>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class ParticipantViewComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);

  user$ = this.auth.user$;

  // View Model
  vm$ = this.user$.pipe(
    tap((user: User | null) => console.log("User:", user)),
    switchMap((user: User | null) => {
      if (!user?.email) return of({ user: null, settings: null, assignment: null, participantCount: 0, isAdmin: false });

      return combineLatest({
        user: of(user),
        settings: this.firestore.getSettings().pipe(
          tap((s: any) => console.log("Settings:", s)),
          startWith(null)
        ),
        assignment: this.firestore.getAssignment(user.email).pipe(
          tap((a: any) => console.log("Assignment:", a)),
          startWith(null)
        ),
        participants: this.firestore.getParticipants().pipe(
          tap((p: any) => console.log("Participants:", p?.length)),
          startWith([])
        ),
        isAdmin: this.auth.isAdmin(user.email).pipe(startWith(false)),
      }).pipe(
        map((data: any) => ({
          ...data,
          participantCount: data.participants?.length || 0,
        })),
        tap((vm: any) => console.log("VM:", vm))
      );
    })
  );

  logout() {
    this.auth.logout();
  }

  handleImageError(event: any) {
    event.target.src = "https://ui-avatars.com/api/?name=User&background=random";
  }

  async onCardSelected(email: string) {
    try {
      await this.firestore.drawAssignment(email);
    } catch (error: any) {
      console.error("Error drawing assignment:", error);
      alert(error.message);
    }
  }
}
