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
        style="background-image: url('assets/media/card.jpg')"
        class="aspect-[3/4] bg-gray-200 bg-cover bg-center rounded-lg shadow-lg flex items-center justify-center text-white text-4xl font-bold hover:scale-105 transition transform cursor-pointer border-4 border-white relative overflow-hidden group"
      >
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
        <span class="relative z-10 drop-shadow-lg">{{ i }}</span>
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
