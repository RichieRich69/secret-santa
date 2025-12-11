import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-card-grid",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      <button
        *ngFor="let i of numbers"
        (click)="select(i)"
        class="aspect-[3/4] bg-red-600 rounded-lg shadow-lg flex items-center justify-center text-white text-4xl font-bold hover:bg-red-700 hover:scale-105 transition transform cursor-pointer border-4 border-white"
      >
        {{ i }}
      </button>
    </div>
  `,
})
export class CardGridComponent {
  @Input() count = 0;
  @Output() selected = new EventEmitter<number>();

  get numbers() {
    return Array.from({ length: this.count }, (_, i) => i + 1);
  }

  select(n: number) {
    this.selected.emit(n);
  }
}
