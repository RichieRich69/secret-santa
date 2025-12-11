import { Timestamp } from "@angular/fire/firestore";

export interface Participant {
  uid?: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  isActive: boolean;
  exclusions?: string[]; // List of emails this participant cannot pick
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
