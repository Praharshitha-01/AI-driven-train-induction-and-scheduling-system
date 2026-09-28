import React, { useState } from 'react';
import {
  TicketBookingTelemetry,
  TrainTicketStatus,
  SystemRushLevel,
  TrainRushStatus,
  DepotConfig,
} from '../types';
import {
  Ticket,
  Users,
  Flame,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
  ShieldAlert,
  Bot,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Building2,
  Navigation,
  Info,
  QrCode,
  CreditCard,
  Layers,
  X,
  Radio,
} from 'lucide-react';

interface TicketBookingRushModuleProps {
  telemetry: TicketBookingTelemetry;
  selectedHour: number;
  depot: DepotConfig;
  onSimulateTicketSurge: (surgeBonus: number) => void;
  onOpenChatbotWithQuery: (query: string) => void;
}

export const TicketBookingRushModule: React.FC<TicketBookingRushModuleProps> = ({
  telemetry,
  selectedHour,
  depot,
  onSimulateTicketSurge,
  onOpenChatbotWithQuery,
}) => {
  const [selectedTrain, setSelectedTrain] = useState<TrainTicketStatus | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SURGE' | 'HEAVY' | 'COMFORT'>('ALL');
  const [sliderSurge, setSliderSurge] = useState<number>(0);

  // Helper for system rush badges in pastel tones
  const getSystemRushBadge = (rush: SystemRushLevel) => {
    switch (rush) {
      case 'CRITICAL_SURGE':
        return {
          label: 'Critical Ticket Surge (>100% Rush)',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500 animate-pulse',
          description: 'Passenger ticket bookings exceed safe comfortable seating capacity. Turnstiles experiencing heavy tap-in queues.',
          advice: 'Immediate induction of standby rake from siding track recommended by AI Service Agent.',
        };
      case 'HEAVY_RUSH':
        return {
          label: 'Heavy Peak Rush (High Demand)',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          description: 'High volume of mobile QR and smartcard bookings across business district stations.',
          advice: 'Line operating at upper comfort envelope. Headways compressed to minimum signaling safe distance.',
        };
      case 'MODERATE':
        return {
          label: 'Moderate Commute Flow',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          dotClass: 'bg-sky-500',
          description: 'Steady passenger ticketing across residential and interchange corridors. Adequate seating available.',
          advice: 'Standard scheduled timetable maintained with nominal turn-around times.',
        };
      default:
        return {
          label: 'Off-Peak Low Rush',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500',
          description: 'Light passenger volume. High seat availability across all active train carriages.',
          advice: 'Optimal time window for scheduled turnaround inspections and stabling.',
        };
    }
  };

  const currentRushBadge = getSystemRushBadge(telemetry.rushLevel);

  // Filter trains
  const filteredTrains = telemetry.trainBookings.filter((train) => {
    if (activeFilter === 'SURGE') return train.rushStatus === 'OVERCROWDED_SURGE';
    if (activeFilter === 'HEAVY') return train.rushStatus === 'CROWDED';
    if (activeFilter === 'COMFORT') return train.rushStatus === 'COMFORTABLE' || train.rushStatus === 'MODERATE_SEATING';
    return true;
  });

  return (
    <div className="rounded-2xl bg-white/95 border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/50 space-y-6">
      {/* Header & Ticket System Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 text-white flex items-center justify-center shadow-md shadow-sky-200">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Passenger Rush & Automated Ticket Booking Radar
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1.5 ${currentRushBadge.badgeClass}`}>
                  <span className={`h-2 w-2 rounded-full ${currentRushBadge.dotClass}`} />
                  {currentRushBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Determining real-time train rush from Automated Fare Collection (AFC), mobile QR bookings, and station turnstile ticket sales for Period {String(selectedHour).padStart(2, '0')}:00.
              </p>
            </div>
          </div>
        </div>

        {/* Quick AI & Simulation Controls in Pastel Tones */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            onClick={() => {
              onSimulateTicketSurge(1600);
              setSliderSurge(1600);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-xs transition flex items-center gap-1"
            title="Simulate sudden influx of +1,600 tickets"
          >
            <Flame className="h-3.5 w-3.5 text-rose-500" />
            <span>Simulate Surge (+1.6k)</span>
          </button>
          <button
            onClick={() => {
              onSimulateTicketSurge(0);
              setSliderSurge(0);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Normal Flow</span>
          </button>
          <button
            onClick={() =>
              onOpenChatbotWithQuery(
                `Confirm current passenger rush based on the ticket booking system for Period ${String(selectedHour).padStart(2, '0')}:00: Total tickets booked is ${telemetry.totalTicketsBookedCurrentHour.toLocaleString()} (${telemetry.systemOccupancyRate}% occupancy). Are any trains overcrowded?`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold shadow-xs transition"
          >
            <Bot className="h-4 w-4 text-purple-600" />
            <span>Ask Chatbot to Confirm Rush</span>
          </button>
        </div>
      </div>

      {/* Real-Time Formula & Concept Clarification Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50/50 border border-sky-100 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-sky-900">How Ticket Bookings Indicate Real-Time Train Rush: </span>
            <span>
              Each ticket booked maps to an AFC turnstile tap-in during the operational hour.
              <code className="mx-1 px-1.5 py-0.5 rounded bg-white font-mono text-[11px] text-sky-800 border border-sky-200">
                Train Rush % = (Tickets Booked &divide; Train Rated Passenger Capacity) &times; 100
              </code>
              When occupancy exceeds 85%, standing density increases; over 100% triggers an automated surge alert to deploy standby rakes.
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-sky-100">
          <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>AFC Gateway: Online</span>
        </div>
      </div>

      {/* KPI Tiles in Soft Pastel Hues */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Tickets */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-sky-800 font-medium mb-1">
            <span>Tickets Booked (This Hour)</span>
            <Ticket className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-950 font-mono">
            {telemetry.totalTicketsBookedCurrentHour.toLocaleString()}{' '}
            <span className="text-xs font-normal text-sky-700 font-sans">tickets</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-sky-700 mt-1">
            <span className="font-semibold">{telemetry.trainBookings.length}</span> trains carrying passengers
          </div>
        </div>

        {/* Metric 2: Ticketing Velocity */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50/30 border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-medium mb-1">
            <span>Ticketing Velocity</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 font-mono">
            {telemetry.ticketingVelocityPerMin}{' '}
            <span className="text-xs font-normal text-indigo-700 font-sans">tix / min</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-indigo-700 mt-1">
            <span>Turnstile tap-ins per 60s window</span>
          </div>
        </div>

        {/* Metric 3: Overall System Rush Load */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/30 border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-purple-800 font-medium mb-1">
            <span>System Rush Occupancy</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono">
            {telemetry.systemOccupancyRate}%{' '}
            <span className="text-xs font-normal text-purple-700 font-sans">capacity</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-700 mt-1">
            <span>Comfort target threshold &le; 85%</span>
          </div>
        </div>

        {/* Metric 4: Active Revenue Trains */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
            <span>Active Trains on Line</span>
            <Zap className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-mono">
            {telemetry.trainBookings.length}{' '}
            <span className="text-xs font-normal text-emerald-700 font-sans">train sets</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1">
            <span>Total carrying capacity: {(telemetry.trainBookings.length * depot.nominalTrainCapacity).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Interactive Ticket Surge Slider & Quick Scenario Simulator */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Interactive Ticket Rush Sensitivity Simulator
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Simulated Ticket Influx: <strong className="text-sky-800">+{sliderSurge.toLocaleString()} tickets</strong>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="4000"
            step="200"
            value={sliderSurge}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSliderSurge(val);
              onSimulateTicketSurge(val);
            }}
            className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Baseline (+0)</span>
            <span>Regular Commuter Peak (+1,000)</span>
            <span>High Festival Surge (+2,400)</span>
            <span>Critical Emergency Influx (+4,000)</span>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => {
              setSliderSurge(0);
              onSimulateTicketSurge(0);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              sliderSurge === 0
                ? 'bg-sky-100 text-sky-900 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Normal Timetable (0)
          </button>
          <button
            onClick={() => {
              setSliderSurge(800);
              onSimulateTicketSurge(800);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              sliderSurge === 800
                ? 'bg-sky-100 text-sky-900 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Morning Office Rush (+800)
          </button>
          <button
            onClick={() => {
              setSliderSurge(1800);
              onSimulateTicketSurge(1800);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              sliderSurge === 1800
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Rainy Weather Shift (+1,800)
          </button>
          <button
            onClick={() => {
              setSliderSurge(3200);
              onSimulateTicketSurge(3200);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              sliderSurge === 3200
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Stadium Event Spike (+3,200)
          </button>
        </div>
      </div>

      {/* Train-by-Train Live Ticket Rush Ledger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              <span>Present Ticket Load & Rush Status Per Dispatched Train Set</span>
            </h4>
            <p className="text-xs text-slate-500">
              Showing tickets booked against rated capacity during Period {String(selectedHour).padStart(2, '0')}:00. Click any card for coach-level passenger breakdown.
            </p>
          </div>

          {/* Filter Tabs in Pastel Styling */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'ALL'
                  ? 'bg-white text-sky-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({telemetry.trainBookings.length})
            </button>
            <button
              onClick={() => setActiveFilter('SURGE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'SURGE'
                  ? 'bg-rose-100 text-rose-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Surge ({telemetry.trainBookings.filter((t) => t.rushStatus === 'OVERCROWDED_SURGE').length})
            </button>
            <button
              onClick={() => setActiveFilter('HEAVY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'HEAVY'
                  ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heavy ({telemetry.trainBookings.filter((t) => t.rushStatus === 'CROWDED').length})
            </button>
            <button
              onClick={() => setActiveFilter('COMFORT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'COMFORT'
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comfort ({telemetry.trainBookings.filter((t) => t.rushStatus === 'COMFORTABLE' || t.rushStatus === 'MODERATE_SEATING').length})
            </button>
          </div>
        </div>

        {/* Train Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTrains.map((train) => {
            const isSurge = train.rushStatus === 'OVERCROWDED_SURGE';
            const isCrowded = train.rushStatus === 'CROWDED';

            return (
              <div
                key={train.trainId}
                onClick={() => setSelectedTrain(train)}
                className={`p-4 rounded-xl border transition flex flex-col justify-between cursor-pointer select-none relative group ${
                  isSurge
                    ? 'bg-rose-50/60 border-rose-200 shadow-xs hover:border-rose-400 hover:shadow-md'
                    : isCrowded
                    ? 'bg-amber-50/50 border-amber-200 shadow-xs hover:border-amber-400 hover:shadow-md'
                    : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Train ID & Rush Status Badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {train.trainId}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        <strong className="text-slate-900 font-mono">{train.ticketsBooked.toLocaleString()}</strong> tickets booked
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSurge
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : isCrowded
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isSurge ? 'Surge Rush (>100%)' : isCrowded ? 'Heavy Standing' : 'Comfort Seated'}
                    </span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Occupancy: <strong className="font-mono text-slate-900">{train.occupancyPercent}%</strong>
                      </span>
                      <span className="text-slate-400">Cap: {train.passengerCapacity} pax</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          train.occupancyPercent >= 100
                            ? 'bg-rose-500'
                            : train.occupancyPercent >= 80
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, train.occupancyPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Station Leg Info */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Station:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={train.originStation}>
                        {train.originStation}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Approaching:</span>
                      <span className="font-semibold text-sky-800 flex items-center gap-1 truncate max-w-[170px]" title={train.nextStop}>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        {train.nextStop}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Trend & Quick Chatbot Link */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    {train.crowdTrend === 'RISING' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span>Trend: <strong>{train.crowdTrend}</strong></span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChatbotWithQuery(
                        `Confirm passenger rush and ticket booking status for train ${train.trainId}: It has ${train.ticketsBooked} tickets booked (${train.occupancyPercent}% load). Origin: ${train.originStation}, Next stop: ${train.nextStop}. Is action needed?`
                      );
                    }}
                    className="text-sky-700 hover:text-sky-900 font-semibold underline text-[11px] flex items-center gap-1"
                  >
                    <span>Confirm with Bot</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station Turnstile Ticket Hotspots Strip */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Station Turnstile Ticket Booking Hotspots (Past 15 Minutes)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">Live AFC Tap-In Flow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {telemetry.stationHotspots.map((station, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-800 block truncate" title={station.stationName}>
                {station.stationName}
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs font-bold text-sky-900">{station.bookingsLast15Min}</span>
                <span className="text-[10px] text-slate-400">tix / 15m</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    station.congestionIndex >= 80
                      ? 'bg-rose-500'
                      : station.congestionIndex >= 50
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${station.congestionIndex}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Coach-Level Passenger Breakdown Modal */}
      {selectedTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-2xs p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-sky-100 shadow-2xl p-6 text-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-mono font-bold">
                  {selectedTrain.trainId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Train {selectedTrain.trainId} &bull; Detailed Ticket Rush Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedTrain.originStation} &rarr; {selectedTrain.nextStop} &bull; Period {String(selectedHour).padStart(2, '0')}:00
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrain(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Core Stats in Pastel Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                <span className="text-[11px] text-sky-700 block">Total Tickets Booked</span>
                <span className="text-xl font-bold font-mono text-sky-950">
                  {selectedTrain.ticketsBooked.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                <span className="text-[11px] text-indigo-700 block">Carriage Occupancy</span>
                <span className="text-xl font-bold font-mono text-indigo-950">
                  {selectedTrain.occupancyPercent}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                <span className="text-[11px] text-purple-700 block">Crowd Velocity</span>
                <span className="text-xl font-bold font-mono text-purple-950">
                  {selectedTrain.crowdTrend}
                </span>
              </div>
            </div>

            {/* Coach-by-Coach Density Breakdown (6-Car Rake) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-sky-600" />
                <span>Coach-by-Coach Passenger Distribution (6-Car EMU)</span>
              </h4>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {[1, 2, 3, 4, 5, 6].map((coachNum) => {
                  // Middle coaches (2,3,4) often carry higher rush
                  const coachMultiplier = coachNum === 1 || coachNum === 6 ? 0.85 : 1.08;
                  const coachCap = Math.round(selectedTrain.passengerCapacity / 6);
                  const coachPax = Math.round((selectedTrain.ticketsBooked / 6) * coachMultiplier);
                  const coachOcc = Math.min(130, Math.round((coachPax / coachCap) * 100));

                  return (
                    <div
                      key={coachNum}
                      className={`p-2.5 rounded-xl border ${
                        coachOcc >= 100
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : coachOcc >= 85
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <span className="font-bold block text-[11px]">Coach C{coachNum}</span>
                      <span className="font-mono text-xs font-bold block my-0.5">{coachPax} pax</span>
                      <span className="text-[10px] block opacity-80">{coachOcc}% cap</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fare Collection Channel Split */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Ticketing Method Channels:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-sky-600" />
                  <div>
                    <span className="block font-semibold">Mobile QR App</span>
                    <span className="text-[11px] text-slate-500 font-mono">54% (~{Math.round(selectedTrain.ticketsBooked * 0.54)} tix)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="block font-semibold">Transit Smartcard</span>
                    <span className="text-[11px] text-slate-500 font-mono">38% (~{Math.round(selectedTrain.ticketsBooked * 0.38)} tix)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="block font-semibold">Single Journey Token</span>
                    <span className="text-[11px] text-slate-500 font-mono">8% (~{Math.round(selectedTrain.ticketsBooked * 0.08)} tix)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTrain(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Close Window
              </button>
              <button
                onClick={() => {
                  const trainToQuery = selectedTrain;
                  setSelectedTrain(null);
                  onOpenChatbotWithQuery(
                    `Confirm rush management protocol for train ${trainToQuery.trainId}: Currently carrying ${trainToQuery.ticketsBooked} tickets (${trainToQuery.occupancyPercent}% load). Trend: ${trainToQuery.crowdTrend}. What are the AI dispatch instructions?`
                  );
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-200 transition flex items-center gap-1.5"
              >
                <Bot className="h-4 w-4" />
                <span>Confirm Protocol with AI Bot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
