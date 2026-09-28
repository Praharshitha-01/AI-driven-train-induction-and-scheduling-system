export type UserRole = 'ROLE_ADMIN' | 'ROLE_DEPOT_MANAGER';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  depotId: string;
  firstLogin: boolean;
  createdAt: string;
}

export interface DepotConfig {
  id: string;
  code: string;
  name: string;
  location: string;
  totalTracks: number;
  totalCapacity: number;
  nominalTrainCapacity: number; // e.g. 1000 passengers
  comfortFactor: number; // e.g. 0.85
  minStandbyBuffer: number; // e.g. 2 trains
}

export type TrainMaintenanceStatus = 'OK' | 'DUE' | 'IN_PROGRESS';
export type TrainCleaningStatus = 'CLEAN' | 'DIRTY' | 'IN_PROGRESS';
export type TrainOperationalStatus = 'DEPLOYED' | 'STANDBY' | 'MAINTENANCE' | 'DEPOT_STATIONARY';

export interface TrainSet {
  id: string;
  trainId: string; // e.g. "T-101"
  depotId: string;
  trainType: string; // e.g. "Alstom Metropolis 6-Car"
  passengerCapacity: number;
  mileage: number; // km
  maintenanceStatus: TrainMaintenanceStatus;
  cleaningStatus: TrainCleaningStatus;
  operationalReadiness: boolean;
  currentStatus: TrainOperationalStatus;
  trackNumber: number;
  lastMaintenanceDate: string;
  updatedAt: string;
}

export interface HourlyDemandCycle {
  hour: number;
  timeLabel: string; // "00:00", "01:00", ...
  predictedDemand: number; // in passengers
  actualDemand: number;
  requiredTrains: number; // K_req calculated by Service Agent
  deployedTrains: number; // Deployed by Fleet Agent RL
  standbyTrains: number;
  maintenanceTrains: number;
  carryingCapacity: number; // deployedTrains * effectiveCapacity
  isPeak: boolean;
  satisfactionRate: number; // % of demand met
}

export interface MaintenanceReportRecord {
  id: string;
  depotId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  extractedRecordsCount: number;
  confidenceScore: number;
  extractedText: string;
  createdAt: string;
  diffItems: TrainDiffItem[];
}

export interface TrainDiffItem {
  trainId: string;
  field: 'mileage' | 'maintenanceStatus' | 'cleaningStatus' | 'operationalReadiness';
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
  confidence: number;
  approved: boolean;
}

export interface InductionDecisionPlan {
  id: string;
  depotId: string;
  timePeriod: string;
  timestamp: string;
  predictedDemand: number;
  requiredTrains: number;
  deployedTrainIds: string[];
  standbyTrainIds: string[];
  maintenanceTrainIds: string[];
  lookaheadScore: number; // 0 to 100
  lookaheadProjectedDeficit: number;
  futureReserveMargin: number;
  reward: number;
  rationale: Record<string, string>; // e.g. "T-102": "Excluded due to mileage exceeding 48,000 km threshold"
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  depotId: string;
  action: string;
  details: string;
  timestamp: string;
}

export type SystemRushLevel = 'LOW' | 'MODERATE' | 'HEAVY_RUSH' | 'CRITICAL_SURGE';
export type TrainRushStatus = 'COMFORTABLE' | 'MODERATE_SEATING' | 'CROWDED' | 'OVERCROWDED_SURGE';

export interface TrainTicketStatus {
  trainId: string;
  ticketsBooked: number;
  passengerCapacity: number;
  occupancyPercent: number;
  rushStatus: TrainRushStatus;
  originStation: string;
  nextStop: string;
  crowdTrend: 'RISING' | 'STABLE' | 'FALLING';
}

export interface StationBookingHotspot {
  stationName: string;
  bookingsLast15Min: number;
  flowDirection: 'INBOUND' | 'OUTBOUND';
  congestionIndex: number; // 0 to 100
}

export interface TicketBookingTelemetry {
  totalTicketsBookedCurrentHour: number;
  ticketingVelocityPerMin: number;
  rushLevel: SystemRushLevel;
  systemOccupancyRate: number;
  trainBookings: TrainTicketStatus[];
  stationHotspots: StationBookingHotspot[];
  lastUpdated: string;
}

