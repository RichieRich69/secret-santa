import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { BackgroundComponent } from "./components/background/background.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, BackgroundComponent],
  template: `
    <app-background></app-background>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
