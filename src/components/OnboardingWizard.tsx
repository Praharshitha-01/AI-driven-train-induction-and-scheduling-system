import React, { useState } from 'react';
import {
  Building2,
  Train,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import { DepotConfig, TrainSet } from '../types';
import { DEFAULT_DEPOT, INITIAL_DEMO_FLEET } from '../services/aiInductionEngine';

interface OnboardingWizardProps {
  onComplete: (depot: DepotConfig, fleet: TrainSet[]) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [depot, setDepot] = useState<DepotConfig>(DEFAULT_DEPOT);
  const [fleet, setFleet] = useState<TrainSet[]>(INITIAL_DEMO_FLEET);
  const [ingestionMethod, setIngestionMethod] = useState<'manual' | 'document'>('document');
  const [docUploaded, setDocUploaded] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(depot, fleet);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 text-slate-800">
      {/* Wizard Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
          <span>First-Time Depot Manager Onboarding</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Initialize Depot Operations & Fleet Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Configure your assigned metro rail facility, tracks, passenger demand thresholds, and fleet baseline.
        </p>

        {/* Stepper in pastel design */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {[
            { num: 1, label: 'Depot Topology' },
            { num: 2, label: 'Fleet Ingestion' },
            { num: 3, label: 'Review & Activate' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s.num
                    ? 'bg-sky-500 text-white ring-4 ring-sky-100 shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === s.num ? 'text-sky-800 font-bold' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="h-0.5 w-8 bg-slate-200 hidden sm:block"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content in white card with pastel border */}
      <div className="rounded-2xl bg-white border border-sky-100 p-6 sm:p-8 shadow-sm shadow-sky-100/50 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-sky-600" />
              Depot Configuration & Track Capacity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Depot Code</label>
                <input
                  type="text"
                  value={depot.code}
                  onChange={(e) => setDepot({ ...depot, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Depot Facility Name</label>
                <input
                  type="text"
                  value={depot.name}
                  onChange={(e) => setDepot({ ...depot, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Total Stabling Tracks</label>
                <input
                  type="number"
                  value={depot.totalTracks}
                  onChange={(e) => setDepot({ ...depot, totalTracks: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Standby Emergency Reserve</label>
                <input
                  type="number"
                  value={depot.minStandbyBuffer}
                  onChange={(e) => setDepot({ ...depot, minStandbyBuffer: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Train className="h-5 w-5 text-sky-600" />
              Train Fleet Ingestion & Baseline Registry
            </h3>

            {/* Ingestion choice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIngestionMethod('document')}
                className={`p-4 rounded-xl border text-left transition ${
                  ingestionMethod === 'document'
                    ? 'bg-sky-50 border-sky-300 text-slate-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-5 w-5 text-sky-600 mb-2" />
                <span className="text-xs font-bold block text-slate-800">Document Ingestion (OCR / PDF)</span>
                <span className="text-[11px] text-slate-500">Extract train roster automatically from report</span>
              </button>

              <button
                onClick={() => setIngestionMethod('manual')}
                className={`p-4 rounded-xl border text-left transition ${
                  ingestionMethod === 'manual'
                    ? 'bg-sky-50 border-sky-300 text-slate-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="h-5 w-5 text-sky-600 mb-2" />
                <span className="text-xs font-bold block text-slate-800">Manual Fleet Table Setup</span>
                <span className="text-[11px] text-slate-500">Configure train sets via structured matrix</span>
              </button>
            </div>

            {ingestionMethod === 'document' ? (
              <div className="border-2 border-dashed border-sky-200 rounded-xl p-6 text-center bg-sky-50/40">
                <Upload className="h-8 w-8 text-sky-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">
                  {docUploaded ? 'Depot_Fleet_Master_Roster.pdf successfully loaded' : 'Upload Depot Initial Fleet Document (PDF/CSV)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Extracts Train IDs, mileages, initial track berths, and operational status.
                </p>
                <button
                  onClick={() => setDocUploaded(true)}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white transition shadow-sm"
                >
                  {docUploaded ? 'Parsed 12 Train Sets' : 'Load Standard Fleet Master Roster (12 Sets)'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span>Default baseline initialized with 12 Metro train sets across tracks 1 to 12.</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Confirmation & Activation
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Assigned Depot:</span>
                <span className="font-bold text-slate-800">{depot.name} ({depot.code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Stabling Capacity:</span>
                <span className="font-bold text-slate-800">{depot.totalTracks} Tracks ({fleet.length} active trains)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Emergency Standby Buffer:</span>
                <span className="font-bold text-emerald-700">{depot.minStandbyBuffer} train sets</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Cloud Storage Sync:</span>
                <span className="font-bold text-sky-700">Cloud Firestore persistent collections</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-200 transition"
          >
            <span>{step === 3 ? 'Activate Depot Dashboard' : 'Next Step'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
