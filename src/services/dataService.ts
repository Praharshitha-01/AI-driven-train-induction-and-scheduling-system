import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TrainSet, MaintenanceReportRecord, InductionDecisionPlan, AuditLogEntry, DepotConfig } from '../types';
import { DEFAULT_DEPOT, INITIAL_DEMO_FLEET } from './aiInductionEngine';

const LOCAL_STORAGE_FLEET_KEY = 'metro_fleet_cache';

// Helper to seed initial depot and fleet into Firestore
export async function seedInitialDepotData(depotId: string = DEFAULT_DEPOT.id): Promise<void> {
  try {
    // 1. Seed Depot
    const depotRef = doc(db, 'depots', depotId);
    await setDoc(depotRef, DEFAULT_DEPOT, { merge: true });

    // 2. Check if trains already exist
    const trainsCollection = collection(db, 'depots', depotId, 'trains');
    const existingSnap = await getDocs(trainsCollection);

    if (existingSnap.empty) {
      console.log('Seeding initial fleet trains to Firestore...');
      for (const train of INITIAL_DEMO_FLEET) {
        await setDoc(doc(db, 'depots', depotId, 'trains', train.id), train);
      }
    }
  } catch (error) {
    console.warn('Firestore seeding encountered error, utilizing local cache fallback:', error);
    if (!localStorage.getItem(LOCAL_STORAGE_FLEET_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_FLEET_KEY, JSON.stringify(INITIAL_DEMO_FLEET));
    }
  }
}

// Fetch all trains for a depot with real-time listener
export function subscribeToFleet(
  depotId: string,
  onUpdate: (trains: TrainSet[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `depots/${depotId}/trains`;
  try {
    const q = collection(db, 'depots', depotId, 'trains');
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const trains: TrainSet[] = [];
          snapshot.forEach((docSnap) => {
            trains.push(docSnap.data() as TrainSet);
          });
          trains.sort((a, b) => a.trainId.localeCompare(b.trainId));
          localStorage.setItem(LOCAL_STORAGE_FLEET_KEY, JSON.stringify(trains));
          onUpdate(trains);
        } else {
          // If empty, return initial demo fleet
          const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
          onUpdate(cached ? JSON.parse(cached) : INITIAL_DEMO_FLEET);
        }
      },
      (error) => {
        console.warn('Realtime subscription error, using local cached fleet:', error);
        const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
        onUpdate(cached ? JSON.parse(cached) : INITIAL_DEMO_FLEET);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
    onUpdate(cached ? JSON.parse(cached) : INITIAL_DEMO_FLEET);
    return () => {};
  }
}

// Update single train state in Firestore
export async function updateTrainState(depotId: string, train: TrainSet): Promise<void> {
  const path = `depots/${depotId}/trains/${train.id}`;
  try {
    const trainRef = doc(db, 'depots', depotId, 'trains', train.id);
    await setDoc(trainRef, { ...train, updatedAt: new Date().toISOString() }, { merge: true });

    // Update local cache
    const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
    if (cached) {
      const fleet: TrainSet[] = JSON.parse(cached);
      const updated = fleet.map((t) => (t.id === train.id ? train : t));
      localStorage.setItem(LOCAL_STORAGE_FLEET_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Batch apply maintenance diff changes to trains
export async function applyTrainDiffUpdates(
  depotId: string,
  updatedTrains: TrainSet[],
  userId: string,
  fileName: string
): Promise<void> {
  for (const train of updatedTrains) {
    await updateTrainState(depotId, train);
  }

  // Record audit log
  await recordAuditLog({
    id: `audit-${Date.now()}`,
    userId,
    depotId,
    action: 'MAINTENANCE_DIFF_APPROVED',
    details: `Applied verified OCR maintenance report changes from document: ${fileName} across ${updatedTrains.length} train sets.`,
    timestamp: new Date().toISOString(),
  });
}

// Save Maintenance Report to Firestore
export async function saveMaintenanceReport(
  depotId: string,
  report: MaintenanceReportRecord
): Promise<void> {
  const path = `depots/${depotId}/reports/${report.id}`;
  try {
    const reportRef = doc(db, 'depots', depotId, 'reports', report.id);
    await setDoc(reportRef, report);
  } catch (error) {
    console.warn('Could not persist report to Firestore:', error);
  }
}

// Save Induction Decision
export async function saveInductionDecision(
  depotId: string,
  decision: InductionDecisionPlan,
  userId: string
): Promise<void> {
  const path = `depots/${depotId}/decisions/${decision.id}`;
  try {
    const decisionRef = doc(db, 'depots', depotId, 'decisions', decision.id);
    await setDoc(decisionRef, decision);

    await recordAuditLog({
      id: `audit-${Date.now()}`,
      userId,
      depotId,
      action: 'INDUCTION_DECISION_EXECUTED',
      details: `Dispatched AI Induction Plan for period ${decision.timePeriod}: ${decision.deployedTrainIds.length} Deployed, ${decision.standbyTrainIds.length} Standby, ${decision.maintenanceTrainIds.length} Maintenance. Lookahead: ${decision.lookaheadScore}%`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Decision storage fallback:', error);
  }
}

// Record an Audit Log
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const logRef = doc(db, 'auditLogs', entry.id);
    await setDoc(logRef, entry);
  } catch (error) {
    console.warn('Audit log write error:', error);
  }
}
