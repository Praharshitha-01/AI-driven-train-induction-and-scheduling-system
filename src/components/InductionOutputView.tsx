import React from 'react';
import {
  TrainSet,
  InductionDecisionPlan,
  HourlyDemandCycle,
} from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Compass,
  Layers,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface InductionOutputViewProps {
  decision: InductionDecisionPlan;
  currentCycle: HourlyDemandCycle;
  fleet: TrainSet[];
  onExecuteNextPeriod: () => void;
  onSimulateScenario: (scenario: 'surge' | 'breakdown' | 'normal') => void;
  isSimulating?: boolean;
  onOpenReports?: () => void;
}

export const InductionOutputView: React.FC<InductionOutputViewProps> = ({
  decision,
  currentCycle,
  fleet,
  onExecuteNextPeriod,
  onSimulateScenario,
  isSimulating,
  onOpenReports,
}) => {
  const deployedTrains = fleet.filter((t) => decision.deployedTrainIds.includes(t.trainId));
  const standbyTrains = fleet.filter((t) => decision.standbyTrainIds.includes(t.trainId));
  const maintenanceTrains = fleet.filter((t) => decision.maintenanceTrainIds.includes(t.trainId));

  return (
    <div className="space-y-6">
      {/* Primary Output Banner with soft pastel gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 border border-sky-200/80 p-5 sm:p-6 shadow-sm shadow-sky-100/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-semibold shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>AI Induction Decision Output &bull; Period {decision.timePeriod}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Reinforcement Learning Fleet Dispatch Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Synthesized by the Service Agent quota and Fleet Agent condition filters with integrated One-Step Look-Ahead feasibility scoring.
            </p>
          </div>

          {/* Quick Scenario Controls in pastel styling */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSimulateScenario('normal')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition"
            >
              Normal Schedule
            </button>
            <button
              onClick={() => onSimulateScenario('surge')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition"
            >
              Demand Surge (+30%)
            </button>
            <button
              onClick={() => onSimulateScenario('breakdown')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition"
            >
              Simulate Failure (T-101)
            </button>
            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition"
                title="Open Administrative Reports & Export PDF"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <span>Export Report PDF</span>
              </button>
            )}
            <button
              onClick={onExecuteNextPeriod}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-200 transition disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isSimulating ? 'Computing RL...' : 'Next Cycle'}</span>
            </button>
          </div>
        </div>

        {/* 3 Pillar Summary Counters in pastel tones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                1. DEPLOY (Revenue Service)
              </span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {deployedTrains.length}{' '}
                <span className="text-xs font-normal text-emerald-700">
                  / {decision.requiredTrains} required sets
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                2. STANDBY (Hot Reserve)
              </span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {standbyTrains.length}{' '}
                <span className="text-xs font-normal text-amber-700">trains ready for dispatch</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Zap className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                3. MAINTENANCE / WORKSHOP
              </span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {maintenanceTrains.length}{' '}
                <span className="text-xs font-normal text-rose-700">trains in depot bays</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* One-Step Look-Ahead Impact Card in crisp white with pastel accents */}
      <div className="rounded-2xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-800">One-Step Look-Ahead Feasibility Analysis</h3>
          </div>
          <span className="text-xs text-slate-500">
            Downstream Projection for Period <span className="text-sky-700 font-mono font-bold">t+1</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
            <span className="text-xs text-slate-500 block mb-1">Future Fleet Readiness Score</span>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black text-sky-800 font-mono">{decision.lookaheadScore}%</div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-sky-800 border border-sky-200 font-semibold">
                {decision.lookaheadScore >= 80 ? 'Optimal Reserve' : 'Deficit Risk'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs text-slate-500 block mb-1">Healthy Reserve Margin</span>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              +{decision.futureReserveMargin}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">spare sets</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Projected Downstream Deficit</span>
            <div className="text-2xl font-black text-slate-800 font-mono">
              {decision.lookaheadProjectedDeficit === 0 ? (
                <span className="text-emerald-700 font-bold">None (0 sets)</span>
              ) : (
                <span className="text-rose-700 font-bold">-{decision.lookaheadProjectedDeficit} sets</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-xs text-slate-500 block mb-1">RL Multi-Objective Reward</span>
            <div className="text-2xl font-black text-purple-800 font-mono">
              {decision.reward > 0 ? `+${decision.reward}` : decision.reward} pts
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Layers className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-800">Look-Ahead Guarantee:</strong> Before finalizing the current action, the system projected the post-induction state into period t+1. Since {decision.futureReserveMargin} healthy train sets remain uncommitted, the depot maintains sufficient resilience to buffer unforeseen morning demand spikes.
          </p>
        </div>
      </div>

      {/* Train-by-Train Allocation & Rationale Grid */}
      <div className="rounded-2xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/50 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-600" />
            Train Set Allocation Breakdown & Decision Explanations
          </h3>
          <span className="text-xs text-slate-500 font-medium">Total Fleet: {fleet.length} Train Sets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {fleet.map((train) => {
            let actionType: 'DEPLOY' | 'STANDBY' | 'MAINTENANCE' = 'STANDBY';
            if (decision.deployedTrainIds.includes(train.trainId)) actionType = 'DEPLOY';
            else if (decision.maintenanceTrainIds.includes(train.trainId)) actionType = 'MAINTENANCE';

            const reason = decision.rationale[train.trainId] || 'Assigned per operational schedule.';

            return (
              <div
                key={train.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  actionType === 'DEPLOY'
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    : actionType === 'STANDBY'
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-800">{train.trainId}</span>
                      <span className="text-xs text-slate-500">Track #{train.trackNumber}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        actionType === 'DEPLOY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : actionType === 'STANDBY'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {actionType}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span>Mileage Index:</span>
                      <span className="font-mono text-slate-800 font-semibold">{train.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance:</span>
                      <span
                        className={`font-semibold ${
                          train.maintenanceStatus === 'OK' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {train.maintenanceStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning State:</span>
                      <span
                        className={`font-semibold ${
                          train.cleaningStatus === 'CLEAN' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {train.cleaningStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
