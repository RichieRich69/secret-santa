import { Timestamp } from "@angular/fire/firestore";

export interface Participant {
  uid?: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  isActive: boolean;
  naughtyOrNice?: "naughty" | "nice";
  exclusions?: string[]; // List of emails this participant cannot pick
  preferredGifts?: string[]; // List of preferred gifts (max 5)
  guesses?: string[]; // List of emails this participant has accused
  correctGuesses?: number; // Number of correct accusations
}

export interface Assignment {
  giverEmail: string;
  receiverEmail: string;
  receiverDisplayName: string;
  createdAt: Timestamp;
  isRevealed?: boolean;
}

export interface Settings {
  adminEmails: string[];
  exchangeDate?: Timestamp;
  isAssignmentsGenerated: boolean;
}
