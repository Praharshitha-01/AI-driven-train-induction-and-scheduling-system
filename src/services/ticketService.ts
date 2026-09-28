import {
  TicketBookingTelemetry,
  TrainTicketStatus,
  StationBookingHotspot,
  SystemRushLevel,
  TrainSet,
  DepotConfig,
} from '../types';

export const METRO_STATIONS = [
  'Central Railway Terminal',
  'City Financial Center',
  'Silicon Tech Park',
  'Metro University Hub',
  'National Stadium Gate',
  'International Airport Exchange',
];

export function computeTicketRushTelemetry(
  deployedTrainIds: string[],
  fleet: TrainSet[],
  hour: number,
  baseDemand: number,
  manualSurgeBonus: number = 0,
  depot: DepotConfig
): TicketBookingTelemetry {
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  
  // Total tickets booked in this operational window
  const rawTickets = Math.round(baseDemand * (0.92 + Math.random() * 0.12)) + manualSurgeBonus;
  const totalTicketsBookedCurrentHour = Math.max(300, rawTickets);

  // Tickets booked per minute velocity
  const ticketingVelocityPerMin = Math.round(totalTicketsBookedCurrentHour / 60);

  // Calculate system capacity based on deployed trains
  const effectiveCapacityPerTrain = Math.round(depot.nominalTrainCapacity * depot.comfortFactor);
  const totalActiveCarryingCapacity = Math.max(1, deployedTrainIds.length * effectiveCapacityPerTrain);
  const systemOccupancyRate = Math.min(130, Math.round((totalTicketsBookedCurrentHour / totalActiveCarryingCapacity) * 100));

  // Determine overall system rush level
  let rushLevel: SystemRushLevel = 'LOW';
  if (systemOccupancyRate >= 105 || (isPeak && ticketingVelocityPerMin > 140)) {
    rushLevel = 'CRITICAL_SURGE';
  } else if (systemOccupancyRate >= 85 || isPeak) {
    rushLevel = 'HEAVY_RUSH';
  } else if (systemOccupancyRate >= 50) {
    rushLevel = 'MODERATE';
  }

  // Station booking hotspots
  const stationHotspots: StationBookingHotspot[] = METRO_STATIONS.map((stationName, idx) => {
    const weight = idx === 1 || idx === 2 ? 1.4 : idx === 4 && manualSurgeBonus > 500 ? 2.1 : 0.85;
    const bookingsLast15Min = Math.round((ticketingVelocityPerMin * 15 * weight) / METRO_STATIONS.length);
    const congestionIndex = Math.min(100, Math.round((bookingsLast15Min / 450) * 100));
    const flowDirection = hour < 12 ? 'INBOUND' : 'OUTBOUND';

    return {
      stationName,
      bookingsLast15Min,
      flowDirection,
      congestionIndex,
    };
  });

  // Calculate per-train ticket allocation for all active deployed sets
  const trainBookings: TrainTicketStatus[] = deployedTrainIds.map((trainId, i) => {
    const trainInfo = fleet.find((t) => t.trainId === trainId);
    const capacity = trainInfo?.passengerCapacity || depot.nominalTrainCapacity;

    // Distribute tickets with slight variation across trains on line
    const shareRatio = (1 / deployedTrainIds.length) * (0.88 + (i % 3) * 0.12);
    const ticketsBooked = Math.round(totalTicketsBookedCurrentHour * shareRatio);
    const occupancyPercent = Math.min(140, Math.round((ticketsBooked / capacity) * 100));

    let rushStatus: 'COMFORTABLE' | 'MODERATE_SEATING' | 'CROWDED' | 'OVERCROWDED_SURGE' = 'COMFORTABLE';
    if (occupancyPercent >= 105) rushStatus = 'OVERCROWDED_SURGE';
    else if (occupancyPercent >= 85) rushStatus = 'CROWDED';
    else if (occupancyPercent >= 55) rushStatus = 'MODERATE_SEATING';

    const originStation = METRO_STATIONS[i % METRO_STATIONS.length];
    const nextStop = METRO_STATIONS[(i + 1) % METRO_STATIONS.length];
    const crowdTrend = isPeak ? (i % 2 === 0 ? 'RISING' : 'STABLE') : 'FALLING';

    return {
      trainId,
      ticketsBooked,
      passengerCapacity: capacity,
      occupancyPercent,
      rushStatus,
      originStation,
      nextStop,
      crowdTrend,
    };
  });

  return {
    totalTicketsBookedCurrentHour,
    ticketingVelocityPerMin,
    rushLevel,
    systemOccupancyRate,
    trainBookings,
    stationHotspots,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
