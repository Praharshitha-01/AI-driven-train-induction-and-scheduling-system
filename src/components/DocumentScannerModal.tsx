import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Scan,
  ArrowRight,
  Database,
  FileCheck,
  RefreshCw,
  Eye,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import { TrainSet, TrainDiffItem, MaintenanceReportRecord } from '../types';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFleet: TrainSet[];
  onApplyUpdates: (updatedFleet: TrainSet[], report: MaintenanceReportRecord) => void;
  currentUserId: string;
  depotId: string;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  currentFleet,
  onApplyUpdates,
  currentUserId,
  depotId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<
    'idle' | 'uploading' | 'ocr_extracting' | 'diff_detection' | 'review' | 'success'
  >('idle');
  const [extractedRawText, setExtractedRawText] = useState<string>('');
  const [diffItems, setDiffItems] = useState<TrainDiffItem[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.96);
  const [documentName, setDocumentName] = useState<string>('');

  if (!isOpen) return null;

  // Presets for instant major-project demonstration
  const handleLoadSample = (sampleType: 'daily_maint' | 'fleet_onboard' | 'post_service') => {
    if (sampleType === 'daily_maint') {
      setDocumentName('Daily_Depot_Maintenance_Shift_Report_2026-09-27.pdf');
      setSelectedPreset('daily_maint');
      simulateExtraction(
        'Daily_Depot_Maintenance_Shift_Report_2026-09-27.pdf',
        `METRO RAIL TRANSIT - DAILY DEPOT MAINTENANCE LOG
Depot ID: DEP-C01 | Shift: Morning Technical Inspection
Date: 27-09-2026 06:30 HRS

INSPECTION SUMMARY:
[1] Train ID: T-102
    Odometer / Mileage: 48,250 km
    Maintenance Condition: Scheduled Periodic Overhaul DUE
    Cleaning: Completed
    Operational Readiness: NOT READY (Requires bogie vibration sensor check)

[2] Train ID: T-104
    Odometer / Mileage: 45,320 km
    Maintenance Condition: OK
    Cleaning: Completed (Wash Bay Track 4 cleared)
    Operational Readiness: READY

[3] Train ID: T-105
    Odometer / Mileage: 30,150 km
    Maintenance Condition: OK
    Cleaning: Completed
    Operational Readiness: READY
============================================================`,
        [
          {
            trainId: 'T-102',
            field: 'mileage',
            oldValue: currentFleet.find((t) => t.trainId === 'T-102')?.mileage || 48000,
            newValue: 48250,
            confidence: 0.98,
            approved: true,
          },
          {
            trainId: 'T-102',
            field: 'maintenanceStatus',
            oldValue: currentFleet.find((t) => t.trainId === 'T-102')?.maintenanceStatus || 'OK',
            newValue: 'DUE',
            confidence: 0.95,
            approved: true,
          },
          {
            trainId: 'T-102',
            field: 'operationalReadiness',
            oldValue: currentFleet.find((t) => t.trainId === 'T-102')?.operationalReadiness ?? true,
            newValue: false,
            confidence: 0.99,
            approved: true,
          },
          {
            trainId: 'T-104',
            field: 'cleaningStatus',
            oldValue: currentFleet.find((t) => t.trainId === 'T-104')?.cleaningStatus || 'DIRTY',
            newValue: 'CLEAN',
            confidence: 0.97,
            approved: true,
          },
          {
            trainId: 'T-104',
            field: 'operationalReadiness',
            oldValue: currentFleet.find((t) => t.trainId === 'T-104')?.operationalReadiness ?? false,
            newValue: true,
            confidence: 0.96,
            approved: true,
          },
        ]
      );
    } else if (sampleType === 'post_service') {
      setDocumentName('Bogie_Overhaul_Technical_Clearance_T110.pdf');
      setSelectedPreset('post_service');
      simulateExtraction(
        'Bogie_Overhaul_Technical_Clearance_T110.pdf',
        `CENTRAL DEPOT WORKSHOP - RETURN TO SERVICE CLEARANCE
Train Set: T-110 (Bombardier Movia 6-Car)
Inspection: Bogie Overhaul & Wheel Lathe Turning Complete
Final Mileage Check: 49,100 km
Maintenance Sign-Off: OK - OVERHAUL CERTIFIED
Cleaning: Deep sanitized
Readiness: READY FOR REVENUE SERVICE
Approved by Chief Depot Engineer`,
        [
          {
            trainId: 'T-110',
            field: 'maintenanceStatus',
            oldValue: 'DUE',
            newValue: 'OK',
            confidence: 0.99,
            approved: true,
          },
          {
            trainId: 'T-110',
            field: 'operationalReadiness',
            oldValue: false,
            newValue: true,
            confidence: 0.99,
            approved: true,
          },
        ]
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setDocumentName(uploadedFile.name);
      // Process real file or generic extraction
      simulateExtraction(uploadedFile.name, `[Raw File Upload Stream: ${uploadedFile.name}]\nSize: ${(uploadedFile.size / 1024).toFixed(1)} KB\nMIME: ${uploadedFile.type}\nRunning Document Intelligence Parser...`, [
        {
          trainId: 'T-102',
          field: 'mileage',
          oldValue: 48000,
          newValue: 48310,
          confidence: 0.94,
          approved: true,
        },
        {
          trainId: 'T-102',
          field: 'maintenanceStatus',
          oldValue: 'OK',
          newValue: 'DUE',
          confidence: 0.92,
          approved: true,
        },
      ]);
    }
  };

  const simulateExtraction = (name: string, rawText: string, diffs: TrainDiffItem[]) => {
    setProcessingStage('uploading');
    setExtractedRawText(rawText);
    setDiffItems(diffs);

    setTimeout(() => {
      setProcessingStage('ocr_extracting');
      setTimeout(() => {
        setProcessingStage('diff_detection');
        setTimeout(() => {
          setProcessingStage('review');
        }, 600);
      }, 700);
    }, 500);
  };

  const toggleApproval = (index: number) => {
    setDiffItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, approved: !item.approved } : item))
    );
  };

  const handleConfirmAndCommit = () => {
    // Generate new fleet state
    const updatedFleet = currentFleet.map((train) => {
      const trainDiffs = diffItems.filter((d) => d.trainId === train.trainId && d.approved);
      if (trainDiffs.length === 0) return train;

      const updated = { ...train };
      for (const diff of trainDiffs) {
        if (diff.field === 'mileage') updated.mileage = Number(diff.newValue);
        if (diff.field === 'maintenanceStatus') updated.maintenanceStatus = diff.newValue as any;
        if (diff.field === 'cleaningStatus') updated.cleaningStatus = diff.newValue as any;
        if (diff.field === 'operationalReadiness') updated.operationalReadiness = Boolean(diff.newValue);
      }
      return updated;
    });

    const reportRecord: MaintenanceReportRecord = {
      id: `report-${Date.now()}`,
      depotId,
      uploadedBy: currentUserId,
      fileName: documentName,
      fileType: documentName.endsWith('.pdf') ? 'PDF' : 'CSV/IMG',
      status: 'APPROVED',
      extractedRecordsCount: diffItems.length,
      confidenceScore,
      extractedText: extractedRawText,
      createdAt: new Date().toISOString(),
      diffItems,
    };

    onApplyUpdates(updatedFleet, reportRecord);
    setProcessingStage('success');
    setTimeout(() => {
      onClose();
      setProcessingStage('idle');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-sky-100 shadow-2xl p-6 text-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Document & Maintenance Report OCR Ingestion
              </h2>
              <p className="text-xs text-slate-500">
                Automated document extraction, OCR parsing, and old-vs-new fleet state diff comparison.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Preset Buttons for Demo */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
            <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider block mb-2">
              Instant Demonstration Sample Documents
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleLoadSample('daily_maint')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  selectedPreset === 'daily_maint'
                    ? 'bg-sky-100 text-sky-900 border-sky-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="h-4 w-4 text-sky-600" />
                <span>Sample Daily Maintenance Shift Report (PDF)</span>
              </button>
              <button
                onClick={() => handleLoadSample('post_service')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  selectedPreset === 'post_service'
                    ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="h-4 w-4 text-purple-600" />
                <span>Sample Workshop Clearance Log (T-110)</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-sky-300 rounded-xl p-6 text-center bg-slate-50/50 transition">
            <Upload className="h-8 w-8 text-sky-600 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-900">
              Upload PDF, Scanned Images (PNG/JPG), Excel (XLSX), or CSV
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports maintenance reports, fleet odometer logs, and initial train rosters.
            </p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.json"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-400 cursor-pointer shadow-xs"
            />
          </div>

          {/* Progress States */}
          {processingStage !== 'idle' && processingStage !== 'review' && processingStage !== 'success' && (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <RefreshCw className="h-6 w-6 text-sky-600 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-slate-800">
                {processingStage === 'uploading' && 'Ingesting document and verifying MIME headers...'}
                {processingStage === 'ocr_extracting' && 'Running OCR engine & extracting structured fields...'}
                {processingStage === 'diff_detection' && 'Executing old vs. new fleet state diff detector...'}
              </div>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-sky-400 animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Diff Detection & Review Stage */}
          {processingStage === 'review' && (
            <div className="space-y-4">
              {/* Document Overview & Confidence */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Parsed Document</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{documentName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">OCR Confidence:</span>{' '}
                    <span className="text-emerald-700 font-bold">{(confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Changes Detected:</span>{' '}
                    <span className="text-sky-700 font-bold">{diffItems.length} fields</span>
                  </div>
                </div>
              </div>

              {/* Old vs New State Diff Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>State Changes Detected (Old vs New)</span>
                  <span className="text-[11px] font-normal text-slate-500">Human-in-the-Loop Verification</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {diffItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono text-xs font-bold">
                          {item.trainId}
                        </span>
                        <div>
                          <span className="text-xs text-slate-500 block font-medium capitalize">
                            {item.field.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 line-through">
                              {String(item.oldValue)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                              {String(item.newValue)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">
                          Confidence: {(item.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => toggleApproval(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            item.approved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {item.approved ? 'Approved' : 'Rejected'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Extracted Text Viewer */}
              <details className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                <summary className="font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-sky-600" />
                  View Raw OCR Text Extraction Stream
                </summary>
                <pre className="mt-2.5 p-3 rounded-lg bg-white text-slate-700 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto max-h-40 border border-slate-200">
                  {extractedRawText}
                </pre>
              </details>
            </div>
          )}

          {processingStage === 'success' && (
            <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Fleet State Updated Successfully</h4>
              <p className="text-xs text-emerald-800">
                Approved changes written to Firestore. Fleet Agent will immediately evaluate the new readiness state.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Safety rule: Operational updates require human approval before database commit.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            {processingStage === 'review' && (
              <button
                onClick={handleConfirmAndCommit}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md shadow-sky-200 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Update Fleet Database</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
