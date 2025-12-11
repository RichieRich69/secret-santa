import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { FirestoreService } from "../services/firestore.service";
import { switchMap, map, tap, startWith } from "rxjs/operators";
import { combineLatest, of, interval, Observable } from "rxjs";
import { User } from "@angular/fire/auth";
import { CardGridComponent } from "./card-grid.component";
import { AssignmentRevealComponent } from "./assignment-reveal.component";
import { RouterModule, Router } from "@angular/router";
import { Participant } from "../models/user.model";

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: "app-participant-view",
  standalone: true,
  imports: [CommonModule, CardGridComponent, AssignmentRevealComponent, RouterModule],
  template: `
    <div class="min-h-screen p-4">
      <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm" *ngIf="user$ | async as user">
          <div class="flex items-center gap-4">
            <img [src]="user.photoURL || getAvatarUrl(user.displayName)" (error)="handleImageError($event, user.displayName)" class="w-10 h-10 rounded-full bg-gray-300" alt="User Avatar" />
            <span class="font-bold text-gray-700">{{ user.displayName }}</span>
          </div>
          <button (click)="logout()" class="text-sm text-gray-500 hover:text-red-600">Sign Out</button>
        </header>

        <div *ngIf="vm$ | async as vm">
          <!-- Admin Link -->
          <div *ngIf="vm.isAdmin" class="mb-6 text-right">
            <a routerLink="/admin" class="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"> Go to Admin Dashboard 🛠️ </a>
          </div>

          <!-- Case 1: Not Generated Yet -->
          <div *ngIf="!vm.settings?.isAssignmentsGenerated" class="text-center mt-20 bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-gray-800">Hold your reindeer! 🦌</h2>
            <p class="text-gray-600 mt-2">The admin hasn't generated the assignments yet.</p>
          </div>

          <!-- Case 2: Generated -->
          <ng-container *ngIf="vm.settings?.isAssignmentsGenerated">
            <!-- Progress Bar -->
            <div class="mb-8 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm max-w-md mx-auto">
              <div class="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>Secret Santa Progress</span>
                <span>{{ vm.allocatedCount }} / {{ vm.participantCount }} allocated</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-red-600 h-2.5 rounded-full transition-all duration-500" [style.width.%]="vm.allocationPercentage"></div>
              </div>
            </div>

            <!-- Case 2a: Assignment Exists (Revealed) -->
            <app-assignment-reveal *ngIf="vm.assignment" [assignment]="vm.assignment!" [receiver]="vm.receiverParticipant"> </app-assignment-reveal>

            <!-- Case 2b: No Assignment Yet (Pick a Card) -->
            <div *ngIf="!vm.assignment">
              <div class="text-center mb-8">
                <h2 class="inline-block text-3xl font-bold text-red-600 bg-white/95 backdrop-blur-sm px-8 py-4 rounded-full shadow-xl border-2 border-red-100">Pick a Card to Draw your Match!</h2>
              </div>
              <app-card-grid [count]="vm.participantCount" (selected)="onCardSelected(vm.user.email!)"> </app-card-grid>
            </div>
          </ng-container>

          <!-- Countdown Timer -->
          <div class="bg-white p-6 rounded-lg shadow-md mb-6 max-w-md mx-auto" *ngIf="vm.timeRemaining$ | async as timeRemaining">
            <h3 class="text-xl font-bold text-gray-700 mb-4">Time Remaining ⏳</h3>
            <div *ngIf="timeRemaining; else exchangeNotActive" class="text-center">
              <div class="text-4xl font-extrabold text-red-600">
                {{ $any(timeRemaining).days }}d {{ $any(timeRemaining).hours }}h {{ $any(timeRemaining).minutes }}m {{ $any(timeRemaining).seconds }}s
              </div>
              <p class="text-gray-500 text-sm mt-2">Hurry up! The exchange is about to happen!</p>
            </div>
            <ng-template #exchangeNotActive>
              <p class="text-gray-500 text-center text-sm">The exchange date is not set or has passed.</p>
            </ng-template>
          </div>

          <!-- Preferred Gifts Section -->
          <div class="bg-white p-6 rounded-lg shadow-md mb-6" *ngIf="vm.currentParticipant">
            <h3 class="text-xl font-bold text-gray-700 mb-4">My Wishlist 🎁</h3>
            <p class="text-gray-500 mb-4 text-sm">Add up to 5 items you'd love to receive!</p>

            <div class="mb-4" *ngIf="(vm.currentParticipant.preferredGifts?.length || 0) < 5">
              <div class="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  #giftInput
                  type="text"
                  placeholder="e.g. Funny socks"
                  class="w-full sm:flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  (keyup.enter)="addGift(vm.currentParticipant, giftInput.value); giftInput.value = ''"
                />
                <button (click)="addGift(vm.currentParticipant, giftInput.value); giftInput.value = ''" class="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                  Add
                </button>
              </div>
              <button (click)="suggestGift(giftInput)" class="text-sm text-blue-600 hover:underline">Need inspiration? Suggest a gift idea 💡</button>
            </div>

            <ul class="space-y-2">
              <li *ngFor="let gift of vm.currentParticipant.preferredGifts; let i = index" class="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span class="break-words mr-2">{{ gift }}</span>
                <button (click)="removeGift(vm.currentParticipant, i)" class="text-red-500 hover:text-red-700 shrink-0 p-1">✕</button>
              </li>
              <li *ngIf="!vm.currentParticipant.preferredGifts?.length" class="text-gray-400 italic">No gifts added yet.</li>
            </ul>
          </div>

          <!-- Naughty or Nice Badge -->
          <div class="bg-white p-8 rounded-xl shadow-lg text-center mt-6 transform hover:scale-105 transition-transform duration-300" *ngIf="vm.currentParticipant">
            <h3 class="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">Official Status</h3>
            <div class="inline-block">
              <span
                class="text-4xl font-black rounded-full py-4 px-10 shadow-sm border-4"
                [ngClass]="vm.naughtyOrNice.includes('naughty') ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'"
              >
                {{ vm.naughtyOrNice }}
              </span>
            </div>
            <p class="mt-6 text-gray-500 italic text-sm max-w-xs mx-auto">There is a prize to be won for the one that can sniff out one of the two Naughty characters! 🕵️</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ParticipantViewComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);

  readonly giftIdeas = [
    "Cozy Socks 🧦",
    "Scented Candle 🕯️",
    "Gourmet Chocolate 🍫",
    "Coffee Mug ☕",
    "Board Game 🎲",
    "Desk Plant 🌱",
    "Bestseller Book 📚",
    "Portable Charger 🔋",
    "Funky Puzzle 🧩",
    "Snack Box 🍿",
    "Movie Tickets 🎟️",
    "Warm Blanket 🧣",
    "Bluetooth Speaker 🔊",
  ];

  naughtyOrNice = Math.random() > 0.9 ? "Naughty 😈" : "Nice 😇";

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
        allAssignments: this.firestore.getAllAssignments().pipe(startWith([])),
        isAdmin: this.auth.isAdmin(user.email).pipe(startWith(false)),
      }).pipe(
        map((data: any) => ({
          ...data,
          naughtyOrNice: this.naughtyOrNice,
          participantCount: data.participants?.length || 0,
          allocatedCount: data.allAssignments?.length || 0,
          allocationPercentage: data.participants?.length ? ((data.allAssignments?.length || 0) / data.participants.length) * 100 : 0,
          currentParticipant: data.participants?.find((p: Participant) => p.email === data.user.email),
          receiverParticipant: data.assignment ? data.participants?.find((p: Participant) => p.email === data.assignment.receiverEmail) : null,
          timeRemaining$: this.createCountdown(data.settings?.exchangeDate),
        })),
        tap((vm: any) => console.log("VM:", vm))
      );
    })
  );

  createCountdown(exchangeDate: any): Observable<TimeRemaining | null> {
    if (!exchangeDate) return of(null);

    const targetDate = exchangeDate.toDate ? exchangeDate.toDate() : new Date(exchangeDate);

    return interval(1000).pipe(
      startWith(0),
      map(() => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) return null;

        return {
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        };
      })
    );
  }

  suggestGift(input: HTMLInputElement) {
    const randomGift = this.giftIdeas[Math.floor(Math.random() * this.giftIdeas.length)];
    input.value = randomGift;
    input.focus();
  }

  async addGift(participant: Participant, gift: string) {
    if (!gift.trim()) return;
    const currentGifts = participant.preferredGifts || [];
    if (currentGifts.length >= 5) return;

    const newGifts = [...currentGifts, gift.trim()];
    await this.firestore.updateParticipant(participant.email, { preferredGifts: newGifts });
  }

  async removeGift(participant: Participant, index: number) {
    const currentGifts = participant.preferredGifts || [];
    const newGifts = currentGifts.filter((_, i) => i !== index);
    await this.firestore.updateParticipant(participant.email, { preferredGifts: newGifts });
  }

  getAvatarUrl(name: string | null | undefined): string {
    return `https://ui-avatars.com/api/?name=${name || "User"}&background=random`;
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(["/"]);
    });
  }

  handleImageError(event: any, name?: string | null) {
    event.target.src = this.getAvatarUrl(name);
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
