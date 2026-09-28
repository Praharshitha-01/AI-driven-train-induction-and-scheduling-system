import React, { useState } from 'react';
import { TrainSet, DepotConfig } from '../types';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles,
  Bot,
  Sliders,
  AlertOctagon,
  ChevronRight,
  Info,
  Calendar,
  Flame,
  Check,
} from 'lucide-react';

interface HighMileageModuleProps {
  fleet: TrainSet[];
  depot: DepotConfig;
  onUpdateTrainState: (train: TrainSet) => void;
  onOpenChatbotWithQuery: (query: string) => void;
}

export const HighMileageModule: React.FC<HighMileageModuleProps> = ({
  fleet,
  depot,
  onUpdateTrainState,
  onOpenChatbotWithQuery,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'approaching' | 'due'>('approaching');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const MAINTENANCE_LIMIT_KM = 50000;
  const CRITICAL_THRESHOLD_KM = 48000;
  const APPROACHING_THRESHOLD_KM = 42000;

  // Calculate urgency score:
  // Combines mileage ratio, maintenance due status, and days since maintenance
  const scoredFleet = fleet.map((train) => {
    const kmTo50k = MAINTENANCE_LIMIT_KM - train.mileage;
    const mileageRatio = train.mileage / MAINTENANCE_LIMIT_KM;
    const isOverdue = train.mileage >= MAINTENANCE_LIMIT_KM || train.maintenanceStatus === 'DUE';
    const isCritical = train.mileage >= CRITICAL_THRESHOLD_KM;
    const isApproaching = train.mileage >= APPROACHING_THRESHOLD_KM;

    // Days since last maintenance estimation
    const lastDate = train.lastMaintenanceDate ? new Date(train.lastMaintenanceDate) : new Date(2026, 7, 1);
    const today = new Date(2026, 8, 27);
    const diffDays = Math.max(1, Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));

    // Urgency weight: higher = more urgent service required
    let urgencyScore = mileageRatio * 100;
    if (train.maintenanceStatus === 'DUE') urgencyScore += 50;
    if (!train.operationalReadiness) urgencyScore += 25;
    if (diffDays > 45) urgencyScore += 15;

    // Component degradation approximations for realistic physical telemetry
    const bogieWearPercent = Math.min(100, Math.round((train.mileage / MAINTENANCE_LIMIT_KM) * 100));
    const brakePadThicknessMm = Math.max(8, Math.round(35 - (train.mileage / MAINTENANCE_LIMIT_KM) * 23));

    let priorityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' = 'NORMAL';
    if (isOverdue || train.mileage >= 48500) priorityLevel = 'CRITICAL';
    else if (train.mileage >= 45000) priorityLevel = 'HIGH';
    else if (train.mileage >= 40000) priorityLevel = 'MODERATE';

    return {
      ...train,
      kmTo50k,
      mileageRatio,
      isOverdue,
      isCritical,
      isApproaching,
      diffDays,
      urgencyScore,
      bogieWearPercent,
      brakePadThicknessMm,
      priorityLevel,
    };
  });

  // Sort prioritized 'needs-service' list by urgency score descending
  const prioritizedList = [...scoredFleet].sort((a, b) => b.urgencyScore - a.urgencyScore);

  // Filter based on selected view
  const filteredList = prioritizedList.filter((train) => {
    if (filterMode === 'critical') return train.priorityLevel === 'CRITICAL' || train.mileage >= CRITICAL_THRESHOLD_KM;
    if (filterMode === 'approaching') return train.priorityLevel === 'CRITICAL' || train.priorityLevel === 'HIGH' || train.mileage >= APPROACHING_THRESHOLD_KM;
    if (filterMode === 'due') return train.maintenanceStatus === 'DUE' || !train.operationalReadiness;
    return true;
  });

  // Aggregate statistics
  const criticalCount = scoredFleet.filter((t) => t.priorityLevel === 'CRITICAL' || t.mileage >= CRITICAL_THRESHOLD_KM).length;
  const approachingCount = scoredFleet.filter((t) => t.mileage >= APPROACHING_THRESHOLD_KM && t.mileage < CRITICAL_THRESHOLD_KM).length;
  const avgMileage = Math.round(fleet.reduce((acc, t) => acc + t.mileage, 0) / (fleet.length || 1));
  const closestTo50k = [...scoredFleet].sort((a, b) => a.kmTo50k - b.kmTo50k)[0];

  const handleScheduleOverhaul = (train: TrainSet) => {
    const updated: TrainSet = {
      ...train,
      maintenanceStatus: 'DUE',
      operationalReadiness: false,
      currentStatus: 'MAINTENANCE',
      updatedAt: new Date().toISOString(),
    };
    onUpdateTrainState(updated);
    setActionSuccessMessage(`Scheduled immediate 50,000 km workshop overhaul for ${train.trainId}. Routed to maintenance bay.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleClearMaintenance = (train: TrainSet) => {
    const updated: TrainSet = {
      ...train,
      maintenanceStatus: 'OK',
      cleaningStatus: 'CLEAN',
      operationalReadiness: true,
      currentStatus: 'STANDBY',
      lastMaintenanceDate: '2026-09-27',
      updatedAt: new Date().toISOString(),
    };
    onUpdateTrainState(updated);
    setActionSuccessMessage(`Technical inspection cleared for ${train.trainId}! Ready for reserve standby.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <div className="rounded-2xl bg-white/95 border border-amber-200/90 p-5 sm:p-6 shadow-sm shadow-amber-100/50 space-y-6">
      {/* Header & Metric Context in warm pastel tones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-100/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-300 to-amber-200 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Wrench className="h-5 w-5 text-amber-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  50,000 km Maintenance Interval & Prioritized Needs-Service Radar
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase tracking-wider">
                  Preventive Health
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Monitors rolling stock degradation nearing the mandatory 50,000 km bogie & traction motor overhaul ceiling. Prioritized by physical risk score.
              </p>
            </div>
          </div>
        </div>

        {/* Ask Chatbot Quick Action */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            onClick={() =>
              onOpenChatbotWithQuery(
                `Can you explain the 50,000 km maintenance interval rules and which trains are currently critical?`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold shadow-xs transition"
            title="Ask AI Chatbot to verify 50,000 km maintenance policy"
          >
            <Bot className="h-4 w-4 text-amber-700" />
            <span>Ask Chatbot to Confirm Rules</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* KPI Summary Tiles in Pastel Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
          <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
            <span>Critical (&ge; 48k km)</span>
            <Flame className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 font-mono">
            {criticalCount}{' '}
            <span className="text-xs font-normal text-rose-700 font-sans">
              sets need overhaul
            </span>
          </div>
          <span className="text-[10px] text-rose-700 block mt-0.5">
            Excluded from active mainline service
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
            <span>Approaching (&ge; 42k km)</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {approachingCount}{' '}
            <span className="text-xs font-normal text-amber-700 font-sans">
              sets in watch window
            </span>
          </div>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            Planned for phased workshop holding
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
          <div className="flex items-center justify-between text-xs text-purple-800 font-medium mb-1">
            <span>Depot Average Mileage</span>
            <Gauge className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 font-mono">
            {avgMileage.toLocaleString()}{' '}
            <span className="text-xs font-normal text-purple-700 font-sans">km / set</span>
          </div>
          <span className="text-[10px] text-purple-700 block mt-0.5">
            Threshold ceiling: 50,000 km
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200">
          <div className="flex items-center justify-between text-xs text-sky-800 font-medium mb-1">
            <span>Closest to Overhaul</span>
            <ShieldAlert className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-black text-sky-900 font-mono">
            {closestTo50k?.trainId || 'N/A'}{' '}
            <span className="text-xs font-normal text-sky-700 font-sans">
              ({closestTo50k ? (closestTo50k.kmTo50k <= 0 ? 'Exceeded' : `${closestTo50k.kmTo50k.toLocaleString()} km left`) : ''})
            </span>
          </div>
          <span className="text-[10px] text-sky-700 block mt-0.5">
            Track #{closestTo50k?.trackNumber} &bull; {closestTo50k?.maintenanceStatus}
          </span>
        </div>
      </div>

      {/* Filter and View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setFilterMode('approaching')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'approaching'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Near 50,000 km ({scoredFleet.filter((t) => t.mileage >= APPROACHING_THRESHOLD_KM).length})
          </button>
          <button
            onClick={() => setFilterMode('critical')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'critical'
                ? 'bg-white text-rose-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical Only (&ge; 48k km)
          </button>
          <button
            onClick={() => setFilterMode('due')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'due'
                ? 'bg-white text-purple-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Maintenance DUE ({scoredFleet.filter((t) => t.maintenanceStatus === 'DUE').length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Fleet ({fleet.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-amber-600" />
          <span>Prioritized by calculated wear index and overhaul urgency.</span>
        </div>
      </div>

      {/* Prioritized 'Needs-Service' Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No train sets matching this filter criteria.
          </div>
        ) : (
          filteredList.map((train, index) => {
            const percentFilled = Math.min(100, Math.round((train.mileage / MAINTENANCE_LIMIT_KM) * 100));

            return (
              <div
                key={train.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  train.priorityLevel === 'CRITICAL'
                    ? 'bg-rose-50/50 border-rose-200/90 hover:border-rose-300'
                    : train.priorityLevel === 'HIGH'
                    ? 'bg-amber-50/50 border-amber-200/90 hover:border-amber-300'
                    : 'bg-white border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Left: Rank, Train Identifier & Priority Badge */}
                <div className="flex items-start gap-3 min-w-[240px]">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      train.priorityLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : train.priorityLevel === 'HIGH'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {train.trainId}
                      </span>
                      <span className="text-xs text-slate-500">
                        Track #{train.trackNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          train.priorityLevel === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : train.priorityLevel === 'HIGH'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {train.priorityLevel === 'CRITICAL'
                          ? 'Immediate Service Required'
                          : train.priorityLevel === 'HIGH'
                          ? 'Approaching 50k km Limit'
                          : 'Routine Monitoring'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{train.trainType}</span>
                      <span>&bull;</span>
                      <span>Status: <strong className="text-slate-800">{train.currentStatus}</strong></span>
                      <span>&bull;</span>
                      <span>
                        Maint: <strong className={train.maintenanceStatus === 'OK' ? 'text-emerald-700' : 'text-rose-700'}>{train.maintenanceStatus}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: 50,000 km Visual Progress Bar & Remaining Distance */}
                <div className="flex-1 max-w-md space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Accumulated Odometer: <strong className="font-mono text-slate-900">{train.mileage.toLocaleString()} km</strong>
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        train.kmTo50k <= 1000
                          ? 'text-rose-700'
                          : train.kmTo50k <= 3000
                          ? 'text-amber-800'
                          : 'text-slate-600'
                      }`}
                    >
                      {train.kmTo50k <= 0 ? (
                        <span className="text-rose-700">Limit Exceeded by {Math.abs(train.kmTo50k).toLocaleString()} km!</span>
                      ) : (
                        `${train.kmTo50k.toLocaleString()} km until 50k km overhaul`
                      )}
                    </span>
                  </div>

                  {/* Progress Bar with pastel gradient */}
                  <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentFilled >= 96
                          ? 'bg-rose-500'
                          : percentFilled >= 88
                          ? 'bg-amber-400'
                          : percentFilled >= 75
                          ? 'bg-sky-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percentFilled}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Baseline 0 km</span>
                    <span className="font-bold text-slate-700">50,000 km Major Overhaul Cap ({percentFilled}%)</span>
                  </div>
                </div>

                {/* Right: Component Wear Specs & Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                  <div className="text-right text-[11px] text-slate-600 space-y-0.5 hidden xl:block min-w-[130px]">
                    <div>
                      Bogie Wear: <strong className="text-slate-800">{train.bogieWearPercent}%</strong>
                    </div>
                    <div>
                      Brake Pad: <strong className="text-slate-800">{train.brakePadThicknessMm} mm</strong>
                    </div>
                    <div>
                      Last Service: <strong className="text-slate-800">{train.diffDays}d ago</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {train.maintenanceStatus === 'DUE' ? (
                      <button
                        onClick={() => handleClearMaintenance(train)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs transition"
                        title="Mark overhaul completed and certify train"
                      >
                        <Check className="h-3.5 w-3.5 inline mr-1" />
                        Certify Overhaul
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScheduleOverhaul(train)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 shadow-xs transition"
                        title="Route train set to depot holding workshop"
                      >
                        <Wrench className="h-3.5 w-3.5 inline mr-1 text-rose-600" />
                        Hold for Overhaul
                      </button>
                    )}

                    <button
                      onClick={() =>
                        onOpenChatbotWithQuery(
                          `Please confirm the current status and 50,000 km maintenance recommendation for train ${train.trainId} (current mileage: ${train.mileage.toLocaleString()} km).`
                        )
                      }
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                      title="Ask chatbot about this train"
                    >
                      <Bot className="h-4 w-4 text-sky-700" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Regulatory Directive Footer Notice in Pastel Styling */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Depot Safety Standard Directive 50K-M:</strong> Any train reaching 50,000 km requires mandatory bogie suspension inspection, ultrasonic axle non-destructive testing, and wheel reprofiling before passenger service clearance.
          </span>
        </div>
        <button
          onClick={() =>
            onOpenChatbotWithQuery(
              'Confirm why trains approaching 50,000 km are not dispatched during morning peak rush hours.'
            )
          }
          className="text-amber-800 hover:underline font-semibold flex-shrink-0 flex items-center gap-1"
        >
          <span>Ask Chatbot for Confirmation</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
