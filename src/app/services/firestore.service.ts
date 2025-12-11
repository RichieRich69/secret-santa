import { Injectable, inject } from "@angular/core";
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc, writeBatch, Timestamp, docSnapshots, runTransaction, getDocs } from "@angular/fire/firestore";
import { Observable, map } from "rxjs";
import { Participant, Assignment, Settings } from "../models/user.model";

@Injectable({
  providedIn: "root",
})
export class FirestoreService {
  private firestore = inject(Firestore);

  getParticipants(): Observable<Participant[]> {
    const participantsRef = collection(this.firestore, "participants");
    return collectionData(participantsRef, { idField: "uid" }) as Observable<Participant[]>;
  }

  getAllAssignments(): Observable<Assignment[]> {
    const assignmentsRef = collection(this.firestore, "assignments");
    return collectionData(assignmentsRef) as Observable<Assignment[]>;
  }

  async addParticipant(email: string, displayName: string) {
    // Use email as ID for simplicity or auto-id.
    // The prompt says "doc ID: participant UID or email".
    // Since we add by email before they login, we might not have UID.
    // Let's use email as ID to ensure uniqueness easily.
    const docRef = doc(this.firestore, "participants", email);
    const participant: Participant = {
      email,
      displayName,
      createdAt: Timestamp.now(),
      isActive: true,
    };
    return setDoc(docRef, participant);
  }

  async removeParticipant(email: string) {
    return deleteDoc(doc(this.firestore, "participants", email));
  }

  async updateParticipant(email: string, data: Partial<Participant>) {
    return setDoc(doc(this.firestore, "participants", email), data, { merge: true });
  }

  getSettings(): Observable<Settings | null> {
    const ref = doc(this.firestore, "settings/global");
    return docSnapshots(ref).pipe(map((s) => (s.exists() ? (s.data() as Settings) : null)));
  }

  async startExchange() {
    const batch = writeBatch(this.firestore);
    const settingsRef = doc(this.firestore, "settings/global");
    batch.update(settingsRef, { isAssignmentsGenerated: true });
    return batch.commit();
  }

  async drawAssignment(giverEmail: string): Promise<void> {
    return runTransaction(this.firestore, async (transaction) => {
      // 1. Get all participants
      const participantsRef = collection(this.firestore, "participants");
      const participantsSnap = await getDocs(participantsRef);
      const participants = participantsSnap.docs.map((d) => d.data() as Participant);
      const activeParticipants = participants.filter((p) => p.isActive);

      // 2. Get all existing assignments
      const assignmentsRef = collection(this.firestore, "assignments");
      const assignmentsSnap = await getDocs(assignmentsRef);
      const assignments = assignmentsSnap.docs.map((d) => d.data() as Assignment);

      // 3. Check if user already has an assignment
      if (assignments.find((a) => a.giverEmail === giverEmail)) {
        throw new Error("You already have an assignment!");
      }

      // 4. Determine available receivers
      const takenReceiverEmails = new Set(assignments.map((a) => a.receiverEmail));
      const pendingGivers = activeParticipants.filter((p) => !assignments.find((a) => a.giverEmail === p.email));

      // Candidates are those who haven't been assigned as a receiver yet
      let candidates = activeParticipants.filter((p) => !takenReceiverEmails.has(p.email));

      // Exclude self
      candidates = candidates.filter((p) => p.email !== giverEmail);

      // Exclude explicit exclusions (e.g. spouses, previous year matches)
      const currentGiver = activeParticipants.find((p) => p.email === giverEmail);
      if (currentGiver?.exclusions && currentGiver.exclusions.length > 0) {
        candidates = candidates.filter((p) => !currentGiver.exclusions!.includes(p.email));
      }

      if (candidates.length === 0) {
        throw new Error("No candidates available! (This might be due to strict exclusions or being the last person with no valid options)");
      }

      // 5. Deadlock Prevention
      // If we are down to 2 pending givers (Me + 1 other), we must ensure the other person isn't left with themselves.
      if (pendingGivers.length === 2) {
        const otherGiver = pendingGivers.find((p) => p.email !== giverEmail);
        if (otherGiver) {
          // If the other giver is also a candidate (meaning they haven't received a gift yet),
          // we MUST pick them. Otherwise, if we pick someone else, they will be the only one left
          // and the only candidate left will be themselves.
          const isOtherGiverAvailable = candidates.find((c) => c.email === otherGiver.email);
          if (isOtherGiverAvailable) {
            console.log("Deadlock prevention triggered: Forcing pick of last remaining participant.");
            candidates = [isOtherGiverAvailable];
          }
        }
      }

      // 6. Pick Random
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const selectedReceiver = candidates[randomIndex];

      // 7. Save Assignment
      const assignmentRef = doc(this.firestore, "assignments", giverEmail);
      const assignment: Assignment = {
        giverEmail: giverEmail,
        receiverEmail: selectedReceiver.email,
        receiverDisplayName: selectedReceiver.displayName,
        createdAt: Timestamp.now(),
        isRevealed: true, // Reveal immediately upon drawing
      };

      transaction.set(assignmentRef, assignment);
    });
  }

  async revealAssignment(email: string) {
    const ref = doc(this.firestore, "assignments", email);
    return setDoc(ref, { isRevealed: true }, { merge: true });
  }

  getAssignment(email: string): Observable<Assignment | null> {
    const ref = doc(this.firestore, "assignments", email);
    return docSnapshots(ref).pipe(map((s) => (s.exists() ? (s.data() as Assignment) : null)));
  }

  private shuffle(array: any[]) {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }
}
