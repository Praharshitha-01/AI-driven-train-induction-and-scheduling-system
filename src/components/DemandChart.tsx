import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HourlyDemandCycle } from '../types';
import { Users, Train, Zap, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface DemandChartProps {
  data: HourlyDemandCycle[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

export const DemandChart: React.FC<DemandChartProps> = ({
  data,
  selectedHour,
  onSelectHour,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'peaks' | 'day'>('all');

  const filteredData = data.filter((d) => {
    if (filterMode === 'peaks') return d.isPeak;
    if (filterMode === 'day') return d.hour >= 6 && d.hour <= 22;
    return true;
  });

  const peakDemand = Math.max(...data.map((d) => d.predictedDemand));
  const maxRequiredTrains = Math.max(...data.map((d) => d.requiredTrains));
  const avgSatisfaction = Math.round(
    data.reduce((acc, curr) => acc + curr.satisfactionRate, 0) / data.length
  );

  return (
    <div className="rounded-2xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/50 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              24-Hour Passenger Demand vs. Train Induction Cycles
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            XGBoost passenger demand forecasting paired with Service Agent active induction quota and Fleet Agent capacity.
          </p>
        </div>

        {/* Filter controls in pastel style */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-white text-sky-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setFilterMode('peaks')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filterMode === 'peaks'
                ? 'bg-white text-sky-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peak Windows
          </button>
          <button
            onClick={() => setFilterMode('day')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filterMode === 'day'
                ? 'bg-white text-sky-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            06:00 - 22:00
          </button>
        </div>
      </div>

      {/* Metrics Row in pastel tints */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
          <div className="flex items-center gap-1.5 text-xs text-sky-800 mb-1 font-medium">
            <Users className="h-3.5 w-3.5 text-sky-600" />
            <span>Peak Demand</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 font-mono">
            {peakDemand.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">pax/hr</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 mb-1 font-medium">
            <Train className="h-3.5 w-3.5 text-emerald-600" />
            <span>Max Active Induction</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono">
            {maxRequiredTrains} <span className="text-xs font-normal text-slate-500 font-sans">train sets</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 mb-1 font-medium">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Avg Demand Met</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-800 font-mono">
            {avgSatisfaction}% <span className="text-xs font-normal text-slate-500 font-sans">capacity ratio</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
          <div className="flex items-center gap-1.5 text-xs text-purple-800 mb-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-purple-600" />
            <span>Selected Period</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-900 font-mono">
            {String(selectedHour).padStart(2, '0')}:00
            <span className="text-xs font-normal text-slate-500 block sm:inline sm:ml-1 font-sans">
              {data[selectedHour]?.isPeak ? '(Peak)' : '(Normal)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Chart with Pastel Aesthetics */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const hour = state.activePayload[0].payload.hour;
                onSelectHour(hour);
              }
            }}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pastelDemandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="pastelActualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            {/* X Axis */}
            <XAxis
              dataKey="timeLabel"
              stroke="#cbd5e1"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: '#e2e8f0' }}
            />

            {/* Left Y Axis: Passenger Demand */}
            <YAxis
              yAxisId="left"
              stroke="#cbd5e1"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            {/* Right Y Axis: Train Sets Count */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#86efac"
              domain={[0, 16]}
              tick={{ fill: '#059669', fontSize: 11 }}
              tickLine={{ stroke: '#a7f3d0' }}
              tickFormatter={(val) => `${val} T`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as HourlyDemandCycle;
                  return (
                    <div className="bg-white/95 border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-800 text-sm">
                          Period {d.timeLabel}
                        </span>
                        {d.isPeak ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                            Rush Peak
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Off-Peak
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sky-700 font-medium">
                          <span>Predicted Demand:</span>
                          <span className="font-bold font-mono">{d.predictedDemand.toLocaleString()} pax</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 font-medium">
                          <span>Actual Demand:</span>
                          <span className="font-bold font-mono">{d.actualDemand.toLocaleString()} pax</span>
                        </div>
                        <div className="flex justify-between text-amber-700 font-medium pt-1 border-t border-slate-100">
                          <span>Required Trains (Quota):</span>
                          <span className="font-bold font-mono">{d.requiredTrains} sets</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Inducted (Active):</span>
                          <span className="font-bold font-mono">{d.deployedTrains} sets</span>
                        </div>
                        <div className="flex justify-between text-purple-700 font-medium">
                          <span>Standby Reserve:</span>
                          <span className="font-bold font-mono">{d.standbyTrains} sets</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Capacity Provision:</span>
                          <span className="font-bold font-mono">{d.carryingCapacity.toLocaleString()} seats</span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex justify-between text-slate-700 font-semibold">
                        <span>Demand Met:</span>
                        <span className="text-emerald-600 font-bold">{d.satisfactionRate}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic text-center pt-1">
                        Click period to sync induction dispatch view
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#475569' }}
              iconType="circle"
            />

            {/* Demand Area with pastel sky blue */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="predictedDemand"
              name="Predicted Demand (Pax)"
              stroke="#0284c7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#pastelDemandGrad)"
            />

            {/* Actual Demand Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="actualDemand"
              name="Actual Demand (Pax)"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Required Trains Line */}
            <Line
              yAxisId="right"
              type="stepAfter"
              dataKey="requiredTrains"
              name="Required Trains (Service Agent)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f59e0b' }}
            />

            {/* Deployed Trains Bar in pastel mint */}
            <Bar
              yAxisId="right"
              dataKey="deployedTrains"
              name="Inducted Active Trains"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
              fillOpacity={0.85}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-sky-600" />
          <span>Interactive timeline: Click any period bar on the chart to inspect and sync AI Train Induction dispatch.</span>
        </div>
        <div>
          Effective Capacity: <span className="text-slate-800 font-semibold">850 pax/train</span> (85% comfort load factor)
        </div>
      </div>
    </div>
  );
};
