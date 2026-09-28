import React, { useState } from 'react';
import { TrainSet, HourlyDemandCycle, InductionDecisionPlan, DepotConfig } from '../types';
import {
  Activity,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Percent,
  Sliders,
  Layers,
  AlertOctagon,
  Info,
  HelpCircle,
  X,
  Calculator,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PerformanceMetricsProps {
  fleet: TrainSet[];
  demandCycles: HourlyDemandCycle[];
  decision: InductionDecisionPlan;
  depot: DepotConfig;
  selectedHour: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  fleet,
  demandCycles,
  decision,
  depot,
  selectedHour,
}) => {
  // Selected metric for detailed expanded breakdown
  const [activeBreakdown, setActiveBreakdown] = useState<
    'active' | 'mileage' | 'satisfaction' | 'readiness' | null
  >(null);

  // Hovered card for quick inline tooltip preview
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Interactive "What-If" simulator state inside calculation breakdown
  const [simComfortFactor, setSimComfortFactor] = useState<number>(depot.comfortFactor);
  const [simSimulatedOutages, setSimSimulatedOutages] = useState<number>(0);

  // 1. Total Active (Deployed) Trains & Fleet Allocation
  const totalFleetCount = fleet.length;
  const activeDeployedCount = decision.deployedTrainIds.length;
  const standbyCount = decision.standbyTrainIds.length;
  const maintenanceCount = decision.maintenanceTrainIds.length;
  const activeUtilizationRate =
    totalFleetCount > 0 ? Math.round((activeDeployedCount / totalFleetCount) * 100) : 0;

  // 2. System Mileage Analytics
  const totalSystemMileage = fleet.reduce((acc, t) => acc + t.mileage, 0);
  const avgSystemMileage =
    totalFleetCount > 0 ? Math.round(totalSystemMileage / totalFleetCount) : 0;
  const minMileage = fleet.length > 0 ? Math.min(...fleet.map((t) => t.mileage)) : 0;
  const maxMileage = fleet.length > 0 ? Math.max(...fleet.map((t) => t.mileage)) : 0;
  const mileageSpread = maxMileage - minMileage;

  // Variance calculation to show wear balance
  const mileageVariance =
    totalFleetCount > 0
      ? Math.sqrt(
          fleet.reduce((acc, t) => acc + Math.pow(t.mileage - avgSystemMileage, 2), 0) /
            totalFleetCount
        )
      : 0;

  // 3. Operational Capacity & Fleet Availability
  const effectiveCapacity = Math.round(depot.nominalTrainCapacity * depot.comfortFactor);
  const availableHealthyTrains = fleet.filter(
    (t) => t.operationalReadiness && t.maintenanceStatus !== 'DUE' && t.cleaningStatus !== 'DIRTY'
  );
  const availableHealthyCount = availableHealthyTrains.length;
  const maxSimultaneousCapacity = availableHealthyCount * effectiveCapacity;

  // Peak demand calculation
  const peakPredictedDemand = Math.max(...demandCycles.map((c) => c.predictedDemand), 1);
  const requiredTrainsForPeak = Math.ceil(peakPredictedDemand / effectiveCapacity);

  // Projected Demand Satisfaction Rate under Peak & Future periods based on current available fleet
  const projectedPeakSatisfactionRate = Math.min(
    100,
    Math.round((maxSimultaneousCapacity / peakPredictedDemand) * 100)
  );

  const nextHour = (selectedHour + 1) % 24;
  const nextHourCycle = demandCycles[nextHour] || demandCycles[0];
  const projectedNextHourSatisfaction = Math.min(
    100,
    Math.round((maxSimultaneousCapacity / (nextHourCycle.predictedDemand || 1)) * 100)
  );

  // 90% SLA Threshold check based on current fleet availability
  const isProjectedBelow90 =
    projectedPeakSatisfactionRate < 90 || projectedNextHourSatisfaction < 90;
  const deficitTrains = Math.max(0, requiredTrainsForPeak - availableHealthyCount);

  // 4. Daily Demand Satisfaction Rate (Historical + Projected Aggregate)
  const totalDailyPredictedDemand = demandCycles.reduce((acc, c) => acc + c.predictedDemand, 0);
  const totalDailyCarryingCapacity = demandCycles.reduce((acc, c) => acc + c.carryingCapacity, 0);
  const dailyDemandSatisfactionRate =
    totalDailyPredictedDemand > 0
      ? Math.min(100, Math.round((totalDailyCarryingCapacity / totalDailyPredictedDemand) * 100))
      : 0;

  const currentHourCycle = demandCycles[selectedHour] || demandCycles[0];
  const peakCycles = demandCycles.filter((c) => c.isPeak);
  const peakSatisfactionAvg =
    peakCycles.length > 0
      ? Math.round(
          peakCycles.reduce((acc, c) => acc + c.satisfactionRate, 0) / peakCycles.length
        )
      : 0;

  // 5. Fleet Readiness & Health Compliance
  const healthyReadyCount = fleet.filter(
    (t) => t.operationalReadiness && t.maintenanceStatus === 'OK'
  ).length;
  const readinessPercent =
    totalFleetCount > 0 ? Math.round((healthyReadyCount / totalFleetCount) * 100) : 0;

  // Interactive calculation simulation helpers
  const simEffectiveCap = Math.round(depot.nominalTrainCapacity * simComfortFactor);
  const simHealthyTrains = Math.max(0, availableHealthyCount - simSimulatedOutages);
  const simTotalCapacity = simHealthyTrains * simEffectiveCap;
  const simSatisfactionRate = Math.min(
    100,
    Math.round((simTotalCapacity / peakPredictedDemand) * 100)
  );

  return (
    <div className="rounded-2xl bg-white/95 border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/60 space-y-5">
      {/* Component Title & System Summary in gentle pastel tones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 via-sky-300 to-indigo-300 text-white flex items-center justify-center shadow-md shadow-sky-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Operational Performance Metrics
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Live State
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive fleet utilization, wear equalization, and passenger demand fulfillment. Click or hover any card for detailed formula breakdown.
            </p>
          </div>
        </div>

        {/* Aggregate Status Indicator in pastel tints */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50/90 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          {isProjectedBelow90 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-slate-600 font-medium">Capacity Alert:</span>
              <span className="text-amber-800 font-bold">Projected Satisfaction &lt; 90%</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600 font-medium">System State:</span>
              <span className="text-emerald-800 font-bold">Optimal Capacity (SLA &ge; 90%)</span>
            </>
          )}
        </div>
      </div>

      {/* Warning Banner: When Projected Satisfaction Drops Below 90% */}
      {isProjectedBelow90 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Operational Alert: Projected Demand Satisfaction Below 90% Target
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold">
                  {projectedPeakSatisfactionRate}% Projected
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Based on current fleet availability ({availableHealthyCount} healthy trains ready),
                projected carrying capacity ({maxSimultaneousCapacity.toLocaleString()} seats) cannot fully cover peak demand ({peakPredictedDemand.toLocaleString()} pax), creating a projected deficit of <strong>{deficitTrains} train set{deficitTrains > 1 ? 's' : ''}</strong> below the 90% SLA threshold.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 self-end sm:self-center">
            <button
              onClick={() => setActiveBreakdown('satisfaction')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold transition"
            >
              <TrendingDown className="h-3.5 w-3.5 text-amber-700" />
              <span>Inspect Calculation &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Primary Metric Cards in Pastel Hues with Interactive Hover & Click Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active / Deployed Trains (Pastel Sky) */}
        <div
          onMouseEnter={() => setHoveredCard('active')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => setActiveBreakdown(activeBreakdown === 'active' ? null : 'active')}
          className={`p-4 rounded-xl border relative overflow-hidden transition cursor-pointer select-none ${
            activeBreakdown === 'active'
              ? 'bg-sky-100/90 border-sky-300 ring-2 ring-sky-200 shadow-md'
              : 'bg-sky-50/70 border-sky-200 hover:border-sky-300 hover:bg-sky-50/90 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-800">
              Total Active Trains
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center hover:bg-sky-200 transition"
                title="View Calculation Formula"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
              <div className="h-6 w-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-700">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {activeDeployedCount}
            </span>
            <span className="text-xs text-slate-500 font-sans">
              / {totalFleetCount} train sets
            </span>
          </div>

          {/* Utilization Bar */}
          <div className="space-y-1">
            <div className="w-full bg-sky-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${activeUtilizationRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>Utilization: <strong className="text-sky-800 font-bold">{activeUtilizationRate}%</strong></span>
              <span>Quota: <strong className="text-slate-800">{decision.requiredTrains} sets</strong></span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-sky-200/50 flex items-center justify-between text-[10px] text-sky-800 font-medium">
            <span>Standby: {standbyCount} &bull; Maint: {maintenanceCount}</span>
            <span className="text-sky-700 font-semibold underline">
              {activeBreakdown === 'active' ? 'Close formula ▲' : 'Breakdown formula ▼'}
            </span>
          </div>

          {/* Hover Quick Preview Pill */}
          {hoveredCard === 'active' && activeBreakdown !== 'active' && (
            <div className="absolute inset-x-2 bottom-12 p-2 rounded-lg bg-white/95 border border-sky-300 shadow-md text-[10px] text-slate-700 backdrop-blur-xs animate-in fade-in duration-100 z-10">
              <div className="font-bold text-sky-800">Formula: (Active / Total) &times; 100</div>
              <div>= ({activeDeployedCount} / {totalFleetCount}) &times; 100 = <strong>{activeUtilizationRate}%</strong>. Click for full calculator.</div>
            </div>
          )}
        </div>

        {/* Metric 2: Average System Mileage (Pastel Purple/Lavender) */}
        <div
          onMouseEnter={() => setHoveredCard('mileage')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => setActiveBreakdown(activeBreakdown === 'mileage' ? null : 'mileage')}
          className={`p-4 rounded-xl border relative overflow-hidden transition cursor-pointer select-none ${
            activeBreakdown === 'mileage'
              ? 'bg-purple-100/90 border-purple-300 ring-2 ring-purple-200 shadow-md'
              : 'bg-purple-50/70 border-purple-200 hover:border-purple-300 hover:bg-purple-50/90 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-purple-800">
              Avg System Mileage
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center hover:bg-purple-200 transition"
                title="View Calculation Formula"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
              <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
                <Gauge className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {avgSystemMileage.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-sans">km / set</span>
          </div>

          {/* Mileage spread and variance info */}
          <div className="space-y-1">
            <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((avgSystemMileage / 50000) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>Spread: <strong className="text-slate-800">{mileageSpread.toLocaleString()} km</strong></span>
              <span>&sigma;: <strong className="text-purple-800 font-bold">&plusmn;{Math.round(mileageVariance)} km</strong></span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-purple-200/50 flex items-center justify-between text-[10px] text-purple-800 font-medium">
            <span>Limit: 48,000 km</span>
            <span className="text-purple-700 font-semibold underline">
              {activeBreakdown === 'mileage' ? 'Close formula ▲' : 'Breakdown formula ▼'}
            </span>
          </div>

          {/* Hover Quick Preview Pill */}
          {hoveredCard === 'mileage' && activeBreakdown !== 'mileage' && (
            <div className="absolute inset-x-2 bottom-12 p-2 rounded-lg bg-white/95 border border-purple-300 shadow-md text-[10px] text-slate-700 backdrop-blur-xs animate-in fade-in duration-100 z-10">
              <div className="font-bold text-purple-800">Formula: &mu; = &sum; Mileage / N</div>
              <div>= {totalSystemMileage.toLocaleString()} km / {totalFleetCount} = <strong>{avgSystemMileage.toLocaleString()} km</strong>. Click for details.</div>
            </div>
          )}
        </div>

        {/* Metric 3: Daily Demand Satisfaction Rate (Pastel Emerald or Pastel Amber) */}
        <div
          onMouseEnter={() => setHoveredCard('satisfaction')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => setActiveBreakdown(activeBreakdown === 'satisfaction' ? null : 'satisfaction')}
          className={`p-4 rounded-xl border relative overflow-hidden transition cursor-pointer select-none ${
            isProjectedBelow90
              ? activeBreakdown === 'satisfaction'
                ? 'bg-amber-100/90 border-amber-300 ring-2 ring-amber-200 shadow-md'
                : 'bg-amber-50/80 border-amber-200 hover:border-amber-300 hover:bg-amber-100/80 hover:shadow-sm'
              : activeBreakdown === 'satisfaction'
              ? 'bg-emerald-100/90 border-emerald-300 ring-2 ring-emerald-200 shadow-md'
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/90 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span
              className={`font-semibold uppercase tracking-wider text-[11px] ${
                isProjectedBelow90 ? 'text-amber-900' : 'text-emerald-800'
              }`}
            >
              Demand Satisfaction
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`h-5 w-5 rounded-full flex items-center justify-center transition ${
                  isProjectedBelow90 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
                title="View Calculation Formula"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
              <div
                className={`h-6 w-6 rounded-md flex items-center justify-center ${
                  isProjectedBelow90 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isProjectedBelow90 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  dailyDemandSatisfactionRate < 90 ? 'text-amber-900' : 'text-emerald-800'
                }`}
              >
                {dailyDemandSatisfactionRate}%
              </span>
              <span className="text-xs text-slate-500 font-sans">24h aggregate</span>
            </div>

            {/* Projected Trend Badge Alert */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isProjectedBelow90
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {isProjectedBelow90 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-amber-700" />
                  <span>Proj: {projectedPeakSatisfactionRate}% &lt; 90%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-emerald-700" />
                  <span>Proj: {projectedPeakSatisfactionRate}% &ge; 90%</span>
                </>
              )}
            </div>
          </div>

          {/* Demand Met Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyDemandSatisfactionRate < 90 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${dailyDemandSatisfactionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>Peak: <strong className="text-slate-800">{peakSatisfactionAvg}%</strong></span>
              <span>
                Target SLA:{' '}
                <strong className={isProjectedBelow90 ? 'text-amber-900' : 'text-emerald-800'}>
                  &ge; 90%
                </strong>
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600 font-medium">
            <span>Current: {currentHourCycle.satisfactionRate}%</span>
            <span className="font-semibold underline">
              {activeBreakdown === 'satisfaction' ? 'Close formula ▲' : 'Breakdown formula ▼'}
            </span>
          </div>

          {/* Hover Quick Preview Pill */}
          {hoveredCard === 'satisfaction' && activeBreakdown !== 'satisfaction' && (
            <div className="absolute inset-x-2 bottom-12 p-2 rounded-lg bg-white/95 border border-emerald-300 shadow-md text-[10px] text-slate-700 backdrop-blur-xs animate-in fade-in duration-100 z-10">
              <div className="font-bold text-emerald-800">Formula: min(100%, (Capacity / Demand) &times; 100)</div>
              <div>Current 24h: <strong>{dailyDemandSatisfactionRate}%</strong> | Peak projection: <strong>{projectedPeakSatisfactionRate}%</strong>. Click for details.</div>
            </div>
          )}
        </div>

        {/* Metric 4: Fleet Operational Readiness & Reserve Buffer (Pastel Rose/Blush) */}
        <div
          onMouseEnter={() => setHoveredCard('readiness')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => setActiveBreakdown(activeBreakdown === 'readiness' ? null : 'readiness')}
          className={`p-4 rounded-xl border relative overflow-hidden transition cursor-pointer select-none ${
            activeBreakdown === 'readiness'
              ? 'bg-rose-100/90 border-rose-300 ring-2 ring-rose-200 shadow-md'
              : 'bg-rose-50/70 border-rose-200 hover:border-rose-300 hover:bg-rose-50/90 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-rose-800">
              Fleet Readiness & Buffer
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-5 w-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center hover:bg-rose-200 transition"
                title="View Calculation Formula"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
              <div className="h-6 w-6 rounded-md bg-rose-100 flex items-center justify-center text-rose-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {readinessPercent}%
            </span>
            <span className="text-xs text-slate-500 font-sans">
              ({healthyReadyCount} healthy sets)
            </span>
          </div>

          {/* Readiness Bar */}
          <div className="space-y-1">
            <div className="w-full bg-rose-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>Hot Standby: <strong className="text-slate-800">{standbyCount} sets</strong></span>
              <span>In Maint: <strong className="text-rose-800 font-bold">{maintenanceCount} sets</strong></span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-rose-200/50 flex items-center justify-between text-[10px] text-rose-800 font-medium">
            <span>Target: &ge; {depot.minStandbyBuffer} sets</span>
            <span className="text-rose-700 font-semibold underline">
              {activeBreakdown === 'readiness' ? 'Close formula ▲' : 'Breakdown formula ▼'}
            </span>
          </div>

          {/* Hover Quick Preview Pill */}
          {hoveredCard === 'readiness' && activeBreakdown !== 'readiness' && (
            <div className="absolute inset-x-2 bottom-12 p-2 rounded-lg bg-white/95 border border-rose-300 shadow-md text-[10px] text-slate-700 backdrop-blur-xs animate-in fade-in duration-100 z-10">
              <div className="font-bold text-rose-800">Formula: (Ready Trains / Total Fleet) &times; 100</div>
              <div>= ({healthyReadyCount} / {totalFleetCount}) &times; 100 = <strong>{readinessPercent}%</strong>. Click for full breakdown.</div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Tooltip Breakdown Modal / Popover with Live Current Fleet Values */}
      {activeBreakdown && (
        <div className="relative rounded-2xl bg-white border-2 border-sky-200 p-5 sm:p-6 shadow-xl shadow-sky-100/70 animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={() => setActiveBreakdown(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close breakdown"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-400 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-sky-200">
              <Calculator className="h-5 w-5" />
            </div>

            <div className="space-y-4 w-full pr-6">
              {/* Tooltip Content 1: Active Trains */}
              {activeBreakdown === 'active' && (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                        Interactive Metric Breakdown
                      </span>
                      <span className="text-xs text-slate-400">&bull; Live Fleet Evaluation</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Total Active Trains & Fleet Utilization Calculation
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Determines how many rolling stock sets are actively inducted into revenue service to meet passenger demand, while holding reserve sets in standby.
                    </p>
                  </div>

                  {/* Mathematical Formulation */}
                  <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold text-sky-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                      <span>Formal Operational Formulation:</span>
                    </div>
                    <div className="font-mono bg-white/80 p-2.5 rounded-lg border border-sky-100 space-y-1">
                      <div>Required Induction Quota: <span className="text-sky-800 font-bold">K_req = &lceil; Demand_t / (C_nominal &times; &eta;_comfort) &rceil;</span></div>
                      <div>= &lceil; {currentHourCycle.predictedDemand.toLocaleString()} / ({depot.nominalTrainCapacity} &times; {depot.comfortFactor}) &rceil; = <strong>{decision.requiredTrains} train sets</strong></div>
                      <div className="pt-1">Active Utilization Rate: <span className="text-sky-800 font-bold">Utilization = ( Deployed_Trains / N_fleet ) &times; 100%</span></div>
                      <div>= ({activeDeployedCount} / {totalFleetCount}) &times; 100% = <strong className="text-sky-900">{activeUtilizationRate}%</strong></div>
                    </div>
                  </div>

                  {/* Real State Breakdown Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Total Depot Fleet (N)</span>
                      <strong className="text-slate-800 text-sm font-mono">{totalFleetCount} train sets</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Physical depot rolling stock</span>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                      <span className="text-[11px] text-sky-800 block">Active Deployed (K)</span>
                      <strong className="text-sky-900 text-sm font-mono">{activeDeployedCount} train sets</strong>
                      <span className="text-[10px] text-sky-700 block mt-0.5">Assigned to mainline revenue tracks</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] text-amber-800 block">Hot Standby Buffer (S)</span>
                      <strong className="text-amber-900 text-sm font-mono">{standbyCount} train sets</strong>
                      <span className="text-[10px] text-amber-700 block mt-0.5">Stabled on siding tracks for t+1 reserve</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[11px] text-rose-800 block">Under Maintenance (M)</span>
                      <strong className="text-rose-900 text-sm font-mono">{maintenanceCount} train sets</strong>
                      <span className="text-[10px] text-rose-700 block mt-0.5">In inspection bay or overhaul holding</span>
                    </div>
                  </div>

                  {/* Real active train list breakdown */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
                    <span className="text-slate-600 font-semibold block mb-1">Current Active Trains Dispatched by Reinforcement Learning Policy:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {decision.deployedTrainIds.map((tid) => (
                        <span key={tid} className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-300 font-mono text-[11px] font-bold">
                          {tid}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tooltip Content 2: Mileage */}
              {activeBreakdown === 'mileage' && (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                        Interactive Metric Breakdown
                      </span>
                      <span className="text-xs text-slate-400">&bull; Live Wear Balance</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Average System Mileage & Rolling Stock Wear Balance Calculation
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tracks rolling stock degradation across the fleet to balance wear, reduce variance, and prevent multiple sets requiring simultaneous major overhaul.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      <span>Mathematical Formulation:</span>
                    </div>
                    <div className="font-mono bg-white/80 p-2.5 rounded-lg border border-purple-100 space-y-1">
                      <div>Mean Fleet Mileage: <span className="text-purple-800 font-bold">&mu; = ( &sum; Mileage_i ) / N_fleet</span></div>
                      <div>= {totalSystemMileage.toLocaleString()} km / {totalFleetCount} = <strong className="text-purple-900">{avgSystemMileage.toLocaleString()} km / train</strong></div>
                      <div className="pt-1">Standard Deviation (Wear Variance): <span className="text-purple-800 font-bold">&sigma; = &radic;( (1/N) &sum; (Mileage_i - &mu;)&sup2; )</span></div>
                      <div>= <strong className="text-purple-900">&plusmn;{Math.round(mileageVariance).toLocaleString()} km</strong> across rolling stock</div>
                      <div className="pt-1">Mileage Spread: <span className="text-purple-800 font-bold">Spread = Max_Mileage - Min_Mileage</span></div>
                      <div>= {maxMileage.toLocaleString()} km ({fleet.find((t) => t.mileage === maxMileage)?.trainId}) - {minMileage.toLocaleString()} km ({fleet.find((t) => t.mileage === minMileage)?.trainId}) = <strong className="text-purple-900">{mileageSpread.toLocaleString()} km</strong></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Overhaul Threshold Governance (48,000 km Limit):</span>
                      <span className="text-[11px] font-mono text-purple-700 font-bold">
                        {fleet.filter((t) => t.mileage >= 45000).length} sets nearing threshold
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      The AI Scheduling Policy applies a heavy wear penalty when inducting train sets above 45,000 km, prioritizing lower-mileage rolling stock to equalize overall fleet wear.
                    </p>
                  </div>
                </>
              )}

              {/* Tooltip Content 3: Satisfaction */}
              {activeBreakdown === 'satisfaction' && (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                        Interactive Metric Breakdown
                      </span>
                      <span className="text-xs text-slate-400">&bull; SLA Trend Analysis</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Demand Satisfaction Rate & Proactive SLA Alert Logic
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Evaluates whether current train capacity fulfills passenger flow without overcrowding. Alerts depot managers when projected rates drop below the 90% SLA threshold.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mathematical Formulation:</span>
                    </div>
                    <div className="font-mono bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-1">
                      <div>Hourly Satisfaction: <span className="text-emerald-800 font-bold">Satisfaction_t = min( 100%, ( Carrying_Capacity_t / Actual_Demand_t ) &times; 100% )</span></div>
                      <div>Carrying Capacity_t = <span className="text-emerald-800 font-bold">Deployed_Trains &times; ( Nominal_Capacity &times; Comfort_Factor )</span></div>
                      <div>= {activeDeployedCount} &times; ({depot.nominalTrainCapacity} &times; {depot.comfortFactor}) = <strong>{currentHourCycle.carryingCapacity.toLocaleString()} passengers / hour</strong></div>
                      <div className="pt-1">Peak Projected Satisfaction = <span className="text-emerald-800 font-bold">( Healthy_Trains &times; Capacity ) / Peak_Demand</span></div>
                      <div>= ({availableHealthyCount} &times; {effectiveCapacity}) / {peakPredictedDemand.toLocaleString()} = <strong className={isProjectedBelow90 ? 'text-amber-800' : 'text-emerald-800'}>{projectedPeakSatisfactionRate}%</strong></div>
                    </div>
                  </div>

                  {/* Interactive What-If Simulator for Satisfaction */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-sky-600" />
                        Interactive &ldquo;What-If&rdquo; Sensitivity Simulator:
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold">
                        Simulated: {simSatisfactionRate}% Satisfaction
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                          <span>Adjust Comfort Factor (&eta;):</span>
                          <strong className="font-mono text-slate-800">{simComfortFactor.toFixed(2)}x</strong>
                        </div>
                        <input
                          type="range"
                          min="0.70"
                          max="1.30"
                          step="0.05"
                          value={simComfortFactor}
                          onChange={(e) => setSimComfortFactor(parseFloat(e.target.value))}
                          className="w-full accent-sky-500 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Higher comfort = fewer passengers per train set</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                          <span>Simulate Unplanned Train Outages:</span>
                          <strong className="font-mono text-slate-800">{simSimulatedOutages} sets</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={simSimulatedOutages}
                          onChange={(e) => setSimSimulatedOutages(parseInt(e.target.value, 10))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Tests system resilience if reserve buffers drop</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tooltip Content 4: Readiness */}
              {activeBreakdown === 'readiness' && (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                        Interactive Metric Breakdown
                      </span>
                      <span className="text-xs text-slate-400">&bull; Operational Clearance</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Fleet Operational Readiness & Hot Standby Reserve Buffer Calculation
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Evaluates rolling stock technically certified for revenue dispatch, ensuring depot maintains minimum standby reserves for downstream transitions.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-rose-600" />
                      <span>Mathematical Formulation:</span>
                    </div>
                    <div className="font-mono bg-white/80 p-2.5 rounded-lg border border-rose-100 space-y-1">
                      <div>Healthy Ready Train Sets = <span className="text-rose-800 font-bold">Count( Readiness == TRUE &and; Maint == OK &and; Clean == CLEAN )</span></div>
                      <div>= <strong className="text-rose-900">{healthyReadyCount} of {totalFleetCount} train sets</strong> cleared for passenger service</div>
                      <div className="pt-1">Readiness Ratio = <span className="text-rose-800 font-bold">( Healthy_Trains / Total_Fleet ) &times; 100%</span></div>
                      <div>= ({healthyReadyCount} / {totalFleetCount}) &times; 100% = <strong className="text-rose-900">{readinessPercent}%</strong></div>
                      <div className="pt-1">One-Step Look-Ahead Reserve Constraint: <span className="text-rose-800 font-bold">Standby_Buffer &ge; {depot.minStandbyBuffer} sets</span></div>
                      <div>Current hot standby = <strong className="text-slate-900">{standbyCount} sets</strong> ({standbyCount >= depot.minStandbyBuffer ? 'Satisfied ✓' : 'Below Buffer ⚠'})</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800 block">Why One-Step Look-Ahead Matters:</span>
                    <p className="text-slate-600 leading-relaxed">
                      A greedy scheduler might deploy all available trains in period <em>t</em> to maximize current satisfaction, but this leaves zero reserve margin for sudden passenger surges or breakdowns in period <em>t+1</em>. The RL policy prevents this state depletion by guaranteeing hot standby margins.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-strip: Operational context info in pastel styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400"></span>
          <span>
            Current Period ({currentHourCycle.timeLabel}):{' '}
            <strong className="text-slate-700">{currentHourCycle.predictedDemand.toLocaleString()} pax demand</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400"></span>
          <span>
            Available Fleet Capacity:{' '}
            <strong className="text-slate-700">{maxSimultaneousCapacity.toLocaleString()} seats ({availableHealthyCount} trains)</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isProjectedBelow90 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span>
            Projected Trend Status:{' '}
            <strong className={isProjectedBelow90 ? 'text-amber-800 font-bold' : 'text-emerald-800 font-bold'}>
              {isProjectedBelow90 ? 'SLA Risk (< 90% Target)' : 'Compliant (>= 90% Target)'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
