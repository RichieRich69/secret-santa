import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { FirestoreService } from "../services/firestore.service";
import { Participant, Assignment } from "../models/user.model";
import { Observable, tap, combineLatest, map } from "rxjs";
import { Timestamp } from "@angular/fire/firestore";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen p-4 md:p-8" *ngIf="vm$ | async as vm">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <h1 class="text-2xl md:text-3xl font-bold text-white drop-shadow-md">Admin Dashboard</h1>
          <button (click)="goBack()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded backdrop-blur-sm transition-colors text-sm font-medium">← Back to Participant View</button>
        </div>

        <!-- Add Participant -->
        <div class="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 class="text-xl font-semibold mb-4">Add Participant</h2>
          <div class="flex flex-col md:flex-row gap-4">
            <input [(ngModel)]="newEmail" placeholder="Gmail Address" class="flex-1 border p-2 rounded w-full" />
            <input [(ngModel)]="newName" placeholder="Display Name" class="flex-1 border p-2 rounded w-full" />
            <select [(ngModel)]="newNaughtyOrNice" class="border p-2 rounded bg-white">
              <option value="nice">Nice 😇</option>
              <option value="naughty">Naughty 😈</option>
            </select>
            <button (click)="add()" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full md:w-auto">Add</button>
          </div>
        </div>

        <!-- Settings -->
        <div class="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 class="text-xl font-semibold mb-4">Exchange Settings</h2>
          <div class="flex flex-col md:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <label class="block text-sm font-medium text-gray-700 mb-1">Exchange Date</label>
              <input type="datetime-local" [ngModel]="exchangeDate" (ngModelChange)="updateDate($event)" class="border p-2 rounded w-full" />
            </div>
            <div class="text-sm text-gray-500 pb-2">Setting this date will enable the countdown timer for participants.</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col md:flex-row justify-end mb-4 gap-4">
          <button (click)="reset()" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 shadow-lg w-full md:w-auto">Reset Exchange 🔄</button>
          <button (click)="generate()" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg w-full md:w-auto">Start the exchange 🎲</button>
        </div>

        <!-- Detective Game Results -->
        <div class="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 class="text-xl font-semibold mb-4">Detective Game Results 🕵️‍♂️</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th class="px-4 py-2">Detective</th>
                  <th class="px-4 py-2">Guesses</th>
                  <th class="px-4 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let result of getDetectiveResults(vm.participants)" class="border-b">
                  <td class="px-4 py-2 font-medium">{{ result.name }}</td>
                  <td class="px-4 py-2">
                    <span
                      *ngFor="let guess of result.guesses"
                      class="mr-2 px-2 py-1 rounded text-xs"
                      [ngClass]="result.naughtyEmails.includes(guess) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ getParticipantName(guess, vm.participants) }}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-bold" [class.text-green-600]="result.correctCount > 0">{{ result.correctCount }} found</td>
                </tr>
                <tr *ngIf="getDetectiveResults(vm.participants).length === 0">
                  <td colspan="3" class="px-4 py-2 text-center text-gray-500">No accusations yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- List -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <!-- Desktop Table -->
          <table class="w-full hidden md:table">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exclusions</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Gifts</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let p of vm.participants" [class.bg-yellow-50]="!p.isAllocated">
                <td class="px-6 py-4 whitespace-nowrap">{{ p.displayName }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ p.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    (click)="toggleNaughtyOrNice(p)"
                    [class.text-green-600]="p.naughtyOrNice !== 'naughty'"
                    [class.text-red-600]="p.naughtyOrNice === 'naughty'"
                    class="font-medium hover:underline"
                  >
                    {{ p.naughtyOrNice === "naughty" ? "Naughty 😈" : "Nice 😇" }}
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ p.exclusions?.join(", ") || "None" }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ p.preferredGifts?.join(", ") || "None" }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button (click)="updateExclusions(p)" class="text-blue-600 hover:text-blue-900 mr-4">Rules</button>
                  <button (click)="remove(p.email)" class="text-red-600 hover:text-red-900">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile Cards -->
          <div class="md:hidden divide-y divide-gray-200">
            <div *ngFor="let p of vm.participants" class="p-4 space-y-2" [class.bg-yellow-50]="!p.isAllocated">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium text-gray-900">{{ p.displayName }}</div>
                  <div class="text-sm text-gray-500">{{ p.email }}</div>
                </div>
                <div class="flex gap-2">
                  <button (click)="toggleNaughtyOrNice(p)" class="p-1 text-xl" [attr.aria-label]="p.naughtyOrNice === 'naughty' ? 'Set to Nice' : 'Set to Naughty'">
                    {{ p.naughtyOrNice === "naughty" ? "😈" : "😇" }}
                  </button>
                  <button (click)="updateExclusions(p)" class="text-blue-600 p-1" aria-label="Rules">
                    <span class="text-xl">📋</span>
                  </button>
                  <button (click)="remove(p.email)" class="text-red-600 p-1" aria-label="Remove">
                    <span class="text-xl">🗑️</span>
                  </button>
                </div>
              </div>
              <div class="text-sm">
                <span class="text-gray-500">Exclusions: </span>
                <span class="text-gray-700">{{ p.exclusions?.join(", ") || "None" }}</span>
              </div>
              <div class="text-sm">
                <span class="text-gray-500">Wants: </span>
                <span class="text-gray-700">{{ p.preferredGifts?.join(", ") || "None" }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignments List -->
        <div class="bg-white rounded-lg shadow overflow-hidden mt-8" *ngIf="vm.assignments.length">
          <h2 class="text-xl font-semibold p-6 border-b">Assignments</h2>

          <!-- Desktop Table -->
          <table class="w-full hidden md:table">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giver</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let a of vm.assignments">
                <td class="px-6 py-4 whitespace-nowrap">{{ a.giverEmail }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ a.receiverDisplayName }} ({{ a.receiverEmail }})</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button (click)="unassign(a.giverEmail)" class="text-red-600 hover:text-red-900">Unassign</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile Cards -->
          <div class="md:hidden divide-y divide-gray-200">
            <div *ngFor="let a of vm.assignments" class="p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-medium text-gray-500 uppercase">Giver</span>
                <button (click)="unassign(a.giverEmail)" class="text-red-600 text-sm">Unassign</button>
              </div>
              <div class="mb-4 text-gray-900">{{ a.giverEmail }}</div>

              <div class="text-xs font-medium text-gray-500 uppercase mb-1">Receiver</div>
              <div class="text-gray-900">{{ a.receiverDisplayName }}</div>
              <div class="text-sm text-gray-500">{{ a.receiverEmail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private firestore = inject(FirestoreService);
  private router = inject(Router);

  participants$: Observable<Participant[]> = this.firestore.getParticipants();
  assignments$: Observable<Assignment[]> = this.firestore.getAllAssignments();

  vm$ = combineLatest([this.participants$, this.assignments$]).pipe(
    map(([participants, assignments]) => {
      const allocatedEmails = new Set(assignments.map((a) => a.giverEmail));
      return {
        participants: participants.map((p) => ({
          ...p,
          isAllocated: allocatedEmails.has(p.email),
        })),
        assignments,
      };
    })
  );

  exchangeDate: string = "";

  constructor() {
    this.firestore
      .getSettings()
      .pipe(
        tap((settings) => {
          if (settings?.exchangeDate) {
            const date = settings.exchangeDate.toDate();
            // Format for datetime-local input: YYYY-MM-DDThh:mm
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
            this.exchangeDate = localISOTime;
          }
        })
      )
      .subscribe();
  }

  newEmail = "";
  newName = "";
  newNaughtyOrNice: "naughty" | "nice" = "nice";

  async updateDate(dateStr: string) {
    this.exchangeDate = dateStr;
    if (!dateStr) return;

    const date = new Date(dateStr);
    try {
      await this.firestore.updateSettings({
        exchangeDate: Timestamp.fromDate(date),
      });
    } catch (error: any) {
      console.error("Error updating date:", error);
      alert(`Failed to update date: ${error.message}`);
    }
  }

  async add() {
    if (!this.newEmail || !this.newName) return;
    try {
      await this.firestore.addParticipant(this.newEmail, this.newName, this.newNaughtyOrNice);
      this.newEmail = "";
      this.newName = "";
      this.newNaughtyOrNice = "nice";
    } catch (error: any) {
      console.error("Error adding participant:", error);
      alert(`Failed to add participant: ${error.message}\n\nMake sure you are an admin (your email is in settings/global).`);
    }
  }

  async remove(email: string) {
    if (confirm("Are you sure?")) {
      try {
        await this.firestore.removeParticipant(email);
      } catch (error: any) {
        console.error("Error removing participant:", error);
        alert(`Failed to remove participant: ${error.message}`);
      }
    }
  }

  async updateExclusions(p: Participant) {
    const current = p.exclusions?.join(", ") || "";
    const input = prompt(`Enter emails that ${p.displayName} CANNOT pick (comma separated):`, current);
    if (input !== null) {
      const exclusions = input
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);
      try {
        await this.firestore.updateParticipant(p.email, { exclusions });
      } catch (error: any) {
        alert(error.message);
      }
    }
  }

  async toggleNaughtyOrNice(p: Participant) {
    const newStatus = p.naughtyOrNice === "naughty" ? "nice" : "naughty";
    try {
      await this.firestore.updateParticipant(p.email, { naughtyOrNice: newStatus });
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    }
  }

  async generate() {
    if (confirm("This will lock the list and start the exchange. Participants can then pick their match. Continue?")) {
      try {
        await this.firestore.startExchange();
        alert("Exchange started! Participants can now pick their matches.");
      } catch (e: any) {
        alert(e.message);
      }
    }
  }

  async reset() {
    if (confirm("Are you sure you want to RESET the exchange? This will delete ALL assignments and stop the exchange.")) {
      try {
        await this.firestore.resetExchange();
        alert("Exchange has been reset.");
      } catch (e: any) {
        alert(e.message);
      }
    }
  }

  async unassign(giverEmail: string) {
    if (confirm(`Are you sure you want to unassign ${giverEmail}?`)) {
      try {
        await this.firestore.unassign(giverEmail);
      } catch (e: any) {
        alert(e.message);
      }
    }
  }

  getParticipantName(email: string, participants: Participant[]): string {
    return participants.find((p) => p.email === email)?.displayName || email;
  }

  getDetectiveResults(participants: Participant[]) {
    const naughtyEmails = participants.filter((p) => p.naughtyOrNice === "naughty").map((p) => p.email);

    return participants
      .filter((p) => p.guesses && p.guesses.length > 0)
      .map((p) => {
        const correctGuesses = p.guesses!.filter((g) => naughtyEmails.includes(g)).length;
        return {
          name: p.displayName,
          guesses: p.guesses,
          correctCount: correctGuesses,
          naughtyEmails: naughtyEmails,
        };
      })
      .sort((a, b) => b.correctCount - a.correctCount);
  }

  goBack() {
    this.router.navigate(["/participant"]);
  }
}
