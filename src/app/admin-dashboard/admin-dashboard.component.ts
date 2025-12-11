import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FirestoreService } from "../services/firestore.service";
import { Participant, Assignment } from "../models/user.model";
import { Observable } from "rxjs";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-white mb-8 drop-shadow-md">Admin Dashboard</h1>

        <!-- Add Participant -->
        <div class="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow mb-8">
          <h2 class="text-xl font-semibold mb-4">Add Participant</h2>
          <div class="flex gap-4">
            <input [(ngModel)]="newEmail" placeholder="Gmail Address" class="flex-1 border p-2 rounded" />
            <input [(ngModel)]="newName" placeholder="Display Name" class="flex-1 border p-2 rounded" />
            <button (click)="add()" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Add</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end mb-4 gap-4">
          <button (click)="reset()" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 shadow-lg">Reset Exchange 🔄</button>
          <button (click)="generate()" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg">Start the exchange 🎲</button>
        </div>

        <!-- List -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exclusions</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Gifts</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let p of participants$ | async">
                <td class="px-6 py-4 whitespace-nowrap">{{ p.displayName }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ p.email }}</td>
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
        </div>

        <!-- Assignments List -->
        <div class="bg-white rounded-lg shadow overflow-hidden mt-8" *ngIf="(assignments$ | async)?.length">
          <h2 class="text-xl font-semibold p-6 border-b">Assignments</h2>
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giver</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let a of assignments$ | async">
                <td class="px-6 py-4 whitespace-nowrap">{{ a.giverEmail }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ a.receiverDisplayName }} ({{ a.receiverEmail }})</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button (click)="unassign(a.giverEmail)" class="text-red-600 hover:text-red-900">Unassign</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private firestore = inject(FirestoreService);

  participants$: Observable<Participant[]> = this.firestore.getParticipants();
  assignments$: Observable<Assignment[]> = this.firestore.getAllAssignments();
  newEmail = "";
  newName = "";

  async add() {
    if (!this.newEmail || !this.newName) return;
    try {
      await this.firestore.addParticipant(this.newEmail, this.newName);
      this.newEmail = "";
      this.newName = "";
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
}
