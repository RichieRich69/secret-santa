import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Assignment } from "../models/user.model";
import confetti from "canvas-confetti";

@Component({
  selector: "app-assignment-reveal",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center p-8 bg-white rounded-xl shadow-2xl max-w-2xl mx-auto mt-10 border-4 border-green-600">
      <h2 class="text-2xl text-gray-600 mb-4">You are the Secret Santa for...</h2>

      <div class="py-8">
        <h1 class="text-5xl font-bold text-red-600 mb-2 animate-bounce">
          {{ assignment.receiverDisplayName }}
        </h1>
        <p class="text-gray-500">{{ assignment.receiverEmail }}</p>
      </div>

      <div class="mt-8 p-4 bg-yellow-50 rounded border border-yellow-200">
        <p class="text-yellow-800 italic">"Keep it secret, keep it safe." 🤫</p>
      </div>
    </div>
  `,
})
export class AssignmentRevealComponent implements OnInit {
  @Input({ required: true }) assignment!: Assignment;

  ngOnInit() {
    this.fireConfetti();
  }

  fireConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
}
