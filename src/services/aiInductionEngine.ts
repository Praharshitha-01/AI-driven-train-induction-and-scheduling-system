import { TrainSet, HourlyDemandCycle, InductionDecisionPlan, DepotConfig } from '../types';

export const DEFAULT_DEPOT: DepotConfig = {
  id: 'depot-central-01',
  code: 'DEP-C01',
  name: 'Central Metro Operations Depot',
  location: 'Line 1 Corridor, Sector 12',
  totalTracks: 16,
  totalCapacity: 24,
  nominalTrainCapacity: 1000,
  comfortFactor: 0.85, // 850 effective pax per train set
  minStandbyBuffer: 2,
};

// Generates 24-hour demand curve with realistic twin peaks (08:00 morning rush, 18:00 evening rush)
export function generate24HourCycles(fleet: TrainSet[], depot: DepotConfig = DEFAULT_DEPOT): HourlyDemandCycle[] {
  const effectiveCapacity = Math.round(depot.nominalTrainCapacity * depot.comfortFactor);
  const totalFleetSize = fleet.length;

  return Array.from({ length: 24 }, (_, hour) => {
    let base = 1200;
    // Morning peak (07:00 - 10:00, peaking at 08:00)
    if (hour >= 7 && hour <= 10) {
      const peakFactor = 1 - Math.abs(hour - 8.5) * 0.4;
      base = 7500 + peakFactor * 5200;
    }
    // Midday moderate (11:00 - 16:00)
    else if (hour > 10 && hour < 17) {
      base = 3800 + Math.sin(hour) * 600;
    }
    // Evening peak (17:00 - 20:00, peaking at 18:00)
    else if (hour >= 17 && hour <= 20) {
      const peakFactor = 1 - Math.abs(hour - 18) * 0.35;
      base = 8200 + peakFactor * 5400;
    }
    // Late evening (21:00 - 23:00)
    else if (hour >= 21) {
      base = 2400 - (hour - 21) * 700;
    }
    // Night depot hours (00:00 - 05:00)
    else {
      base = 400 + Math.random() * 200;
    }

    const predictedDemand = Math.round(base);
    const actualDemand = Math.round(predictedDemand * (0.96 + Math.random() * 0.08));
    const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);

    // Service Agent required trains quota
    const rawRequired = Math.ceil(predictedDemand / effectiveCapacity);
    const requiredTrains = Math.min(rawRequired, totalFleetSize - depot.minStandbyBuffer);

    // Fleet Agent eligible active trains simulation
    const eligibleTrainsCount = fleet.filter(
      (t) => t.operationalReadiness && t.maintenanceStatus !== 'DUE' && t.cleaningStatus !== 'DIRTY'
    ).length;

    const deployedTrains = Math.min(requiredTrains, eligibleTrainsCount);
    const remainingEligible = eligibleTrainsCount - deployedTrains;
    const standbyTrains = Math.min(remainingEligible, depot.minStandbyBuffer + 1);
    const maintenanceTrains = totalFleetSize - deployedTrains - standbyTrains;

    const carryingCapacity = deployedTrains * effectiveCapacity;
    const satisfactionRate = Math.min(100, Math.round((carryingCapacity / actualDemand) * 100));

    return {
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:00`,
      predictedDemand,
      actualDemand,
      requiredTrains,
      deployedTrains,
      standbyTrains,
      maintenanceTrains,
      carryingCapacity,
      isPeak,
      satisfactionRate,
    };
  });
}

// Executes One-Step Look-Ahead Reinforcement Learning Induction Algorithm
export function executeInductionPlanning(
  fleet: TrainSet[],
  hour: number,
  depot: DepotConfig = DEFAULT_DEPOT
): InductionDecisionPlan {
  const effectiveCapacity = Math.round(depot.nominalTrainCapacity * depot.comfortFactor);
  const cycles = generate24HourCycles(fleet, depot);
  const currentCycle = cycles[hour] || cycles[8]; // default 08:00 morning peak
  const nextCycle = cycles[(hour + 1) % 24]; // period t+1

  const requiredActive = currentCycle.requiredTrains;
  const deployedTrainIds: string[] = [];
  const standbyTrainIds: string[] = [];
  const maintenanceTrainIds: string[] = [];
  const rationale: Record<string, string> = {};

  // Sort candidate trains: lower mileage preferred to balance fleet wear
  const sortedFleet = [...fleet].sort((a, b) => a.mileage - b.mileage);

  for (const train of sortedFleet) {
    // Hard constraint 1: Maintenance Due
    if (train.maintenanceStatus === 'DUE') {
      maintenanceTrainIds.push(train.trainId);
      rationale[train.trainId] = `Scheduled maintenance overdue (Mileage: ${train.mileage.toLocaleString()} km). Disqualified from active line deployment.`;
      continue;
    }

    // Hard constraint 2: Operational readiness / defect
    if (!train.operationalReadiness) {
      maintenanceTrainIds.push(train.trainId);
      rationale[train.trainId] = 'Operational readiness flag is False (Awaiting technical sign-off).';
      continue;
    }

    // Hard constraint 3: Cleaning requirement
    if (train.cleaningStatus === 'DIRTY') {
      maintenanceTrainIds.push(train.trainId);
      rationale[train.trainId] = 'Sanitation cycle pending. Directed to depot wash bay.';
      continue;
    }

    // Allocation logic: Fill active deployment quota first
    if (deployedTrainIds.length < requiredActive) {
      deployedTrainIds.push(train.trainId);
      rationale[train.trainId] = `Selected for DEPLOYMENT. Healthy readiness, favorable mileage index (${train.mileage.toLocaleString()} km), assigned to active revenue service.`;
    }
    // Standby reserve buffer
    else if (standbyTrainIds.length < depot.minStandbyBuffer) {
      standbyTrainIds.push(train.trainId);
      rationale[train.trainId] = `Designated as HOT STANDBY reserve. Ready for immediate line injection within 4 minutes.`;
    }
    // Remaining healthy trains stationary in depot
    else {
      standbyTrainIds.push(train.trainId);
      rationale[train.trainId] = `Held as secondary depot reserve. Low mileage preservation.`;
    }
  }

  // One-step lookahead evaluation for period t+1
  const projectedActiveNeeded_t1 = nextCycle.requiredTrains;
  const healthyRemainingAfterT = standbyTrainIds.length;
  const projectedDeficit = Math.max(0, projectedActiveNeeded_t1 - (deployedTrainIds.length + healthyRemainingAfterT));

  let lookaheadScore = 100;
  if (projectedDeficit > 0) {
    lookaheadScore = Math.max(30, Math.round(100 - (projectedDeficit / projectedActiveNeeded_t1) * 80));
  } else {
    lookaheadScore = Math.min(100, 85 + healthyRemainingAfterT * 3);
  }

  // Multi-objective reward calculation
  const serviceReward = deployedTrainIds.length >= requiredActive ? 50 : -60 * (requiredActive - deployedTrainIds.length);
  const maintenanceComplianceReward = maintenanceTrainIds.length * 10;
  const lookaheadPenalty = projectedDeficit * 25;
  const reward = serviceReward + maintenanceComplianceReward - lookaheadPenalty;

  return {
    id: `decision-${Date.now()}`,
    depotId: depot.id,
    timePeriod: `${currentCycle.timeLabel} - ${String((hour + 1) % 24).padStart(2, '0')}:00`,
    timestamp: new Date().toISOString(),
    predictedDemand: currentCycle.predictedDemand,
    requiredTrains: requiredActive,
    deployedTrainIds,
    standbyTrainIds,
    maintenanceTrainIds,
    lookaheadScore,
    lookaheadProjectedDeficit: projectedDeficit,
    futureReserveMargin: Math.max(0, healthyRemainingAfterT),
    reward,
    rationale,
  };
}

// Initial realistic fleet for demo seed
export const INITIAL_DEMO_FLEET: TrainSet[] = [
  {
    id: 't-101',
    trainId: 'T-101',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 38400,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 1,
    lastMaintenanceDate: '2026-09-15',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-102',
    trainId: 'T-102',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 48250,
    maintenanceStatus: 'DUE',
    cleaningStatus: 'CLEAN',
    operationalReadiness: false,
    currentStatus: 'MAINTENANCE',
    trackNumber: 2,
    lastMaintenanceDate: '2026-08-10',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-103',
    trainId: 'T-103',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 32100,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 3,
    lastMaintenanceDate: '2026-09-20',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-104',
    trainId: 'T-104',
    depotId: 'depot-central-01',
    trainType: 'Bombardier Movia 6-Car',
    passengerCapacity: 1000,
    mileage: 45200,
    maintenanceStatus: 'OK',
    cleaningStatus: 'DIRTY',
    operationalReadiness: false,
    currentStatus: 'MAINTENANCE',
    trackNumber: 4,
    lastMaintenanceDate: '2026-09-02',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-105',
    trainId: 'T-105',
    depotId: 'depot-central-01',
    trainType: 'Bombardier Movia 6-Car',
    passengerCapacity: 1000,
    mileage: 29800,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'STANDBY',
    trackNumber: 5,
    lastMaintenanceDate: '2026-09-18',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-106',
    trainId: 'T-106',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 35600,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 6,
    lastMaintenanceDate: '2026-09-10',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-107',
    trainId: 'T-107',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 41200,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 7,
    lastMaintenanceDate: '2026-09-12',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-108',
    trainId: 'T-108',
    depotId: 'depot-central-01',
    trainType: 'Bombardier Movia 6-Car',
    passengerCapacity: 1000,
    mileage: 27500,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'STANDBY',
    trackNumber: 8,
    lastMaintenanceDate: '2026-09-22',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-109',
    trainId: 'T-109',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 39900,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 9,
    lastMaintenanceDate: '2026-09-14',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-110',
    trainId: 'T-110',
    depotId: 'depot-central-01',
    trainType: 'Bombardier Movia 6-Car',
    passengerCapacity: 1000,
    mileage: 49100,
    maintenanceStatus: 'DUE',
    cleaningStatus: 'CLEAN',
    operationalReadiness: false,
    currentStatus: 'MAINTENANCE',
    trackNumber: 10,
    lastMaintenanceDate: '2026-08-01',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-111',
    trainId: 'T-111',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 31400,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 11,
    lastMaintenanceDate: '2026-09-19',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-112',
    trainId: 'T-112',
    depotId: 'depot-central-01',
    trainType: 'Alstom Metropolis 6-Car',
    passengerCapacity: 1000,
    mileage: 33200,
    maintenanceStatus: 'OK',
    cleaningStatus: 'CLEAN',
    operationalReadiness: true,
    currentStatus: 'DEPLOYED',
    trackNumber: 12,
    lastMaintenanceDate: '2026-09-17',
    updatedAt: new Date().toISOString(),
  },
];
