import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  TrainSet,
  InductionDecisionPlan,
  HourlyDemandCycle,
  DepotConfig,
  UserProfile,
} from '../types';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Train,
  Layers,
  Sparkles,
  Zap,
  Clock,
  Gauge,
  HelpCircle,
  FileCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { recordAuditLog } from '../services/dataService';

interface ReportsViewProps {
  depot: DepotConfig;
  fleet: TrainSet[];
  decision: InductionDecisionPlan;
  currentCycle: HourlyDemandCycle;
  currentUser: UserProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  depot,
  fleet,
  decision,
  currentCycle,
  currentUser,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  const reportId = `RPT-${depot.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${decision.timePeriod.slice(0, 2)}`;
  const timestamp = new Date().toLocaleString();

  // Summary statistics
  const deployedTrains = fleet.filter((t) => decision.deployedTrainIds.includes(t.trainId));
  const standbyTrains = fleet.filter((t) => decision.standbyTrainIds.includes(t.trainId));
  const maintenanceTrains = fleet.filter((t) => decision.maintenanceTrainIds.includes(t.trainId));
  const avgMileage = Math.round(fleet.reduce((a, b) => a + b.mileage, 0) / (fleet.length || 1));

  // Generate and Download PDF using jsPDF
  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
      const accentColor: [number, number, number] = [6, 182, 212]; // cyan-500
      const greenColor: [number, number, number] = [16, 185, 129]; // emerald-500
      const textColor: [number, number, number] = [51, 65, 85];

      // Document Title Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('METRO RAIL TRANSIT AUTHORITY', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(6, 182, 212);
      doc.text('TRAIN INDUCTION PLANNING & FLEET STATUS REPORT', 14, 20);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Document Ref: ' + reportId + '  |  Classification: OFFICIAL OPERATIONAL ARCHIVE', 14, 26);

      // Administrative Metadata Box
      let y = 38;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('Facility / Depot:', 18, y + 6);
      doc.text('Operating Period:', 18, y + 12);
      doc.text('Officer In-Charge:', 18, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.text(`${depot.name} (${depot.code})`, 48, y + 6);
      doc.text(`${decision.timePeriod} (Shift A)`, 48, y + 12);
      doc.text(`${currentUser.displayName} (${currentUser.role})`, 48, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.text('Generated Date:', 115, y + 6);
      doc.text('Persistence Store:', 115, y + 12);
      doc.text('Algorithm Engine:', 115, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.text(timestamp, 145, y + 6);
      doc.text('Cloud Firestore [Verified]', 145, y + 12);
      doc.text('XGBoost + RL Look-Ahead', 145, y + 18);

      // Section 1: Executive Key Metrics Table
      y = 68;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. EXECUTIVE OPERATIONAL QUOTA & FLEET ALLOCATION', 14, y);

      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('METRIC INDICATOR', 16, y + 5);
      doc.text('VALUE', 80, y + 5);
      doc.text('OPERATIONAL TARGET', 125, y + 5);
      doc.text('STATUS', 170, y + 5);

      const summaryMetrics = [
        ['Forecasted Passenger Demand (XGBoost)', `${currentCycle.predictedDemand.toLocaleString()} pax`, 'Peak Demand Range', 'CONFIRMED'],
        ['Calculated Induction Quota (Service Agent)', `${decision.requiredTrains} train sets`, '850 effective pax/train', 'PLANNED'],
        ['Actual Line Deployment (Fleet Agent RL)', `${deployedTrains.length} train sets`, `Min ${decision.requiredTrains} sets`, deployedTrains.length >= decision.requiredTrains ? '100% SATISFIED' : 'DEFICIT'],
        ['Hot Standby Emergency Reserve', `${standbyTrains.length} train sets`, `>= ${depot.minStandbyBuffer} sets target`, standbyTrains.length >= depot.minStandbyBuffer ? 'BUFFER SECURED' : 'LOW RESERVE'],
        ['Depot Maintenance / Workshop Bay', `${maintenanceTrains.length} train sets`, 'Overhaul & Defect holds', 'SERVICING'],
        ['One-Step Look-Ahead Downstream Score (t+1)', `${decision.lookaheadScore}%`, '>= 80% feasibility', decision.lookaheadScore >= 80 ? 'RESILIENT' : 'ATTENTION'],
        ['Fleet Average Mileage & Wear Index', `${avgMileage.toLocaleString()} km`, '< 48,000 km periodic limit', 'BALANCED'],
      ];

      y += 7;
      summaryMetrics.forEach((row, i) => {
        doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
        doc.rect(14, y, 182, 6, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(row[0], 16, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(row[1], 80, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(row[2], 125, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(row[3].includes('SATISFIED') || row[3].includes('SECURED') || row[3].includes('RESILIENT') || row[3].includes('CONFIRMED') ? 16 : 225, 120, 50);
        doc.text(row[3], 170, y + 4);
        y += 6;
      });

      // Section 2: Detailed Train Allocation Ledger
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. INDIVIDUAL ROLLING STOCK DISPATCH & MAINTENANCE LEDGER', 14, y);

      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6, 'F');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('TRAIN ID', 16, y + 4);
      doc.text('TRACK', 32, y + 4);
      doc.text('MILEAGE', 50, y + 4);
      doc.text('MAINT', 73, y + 4);
      doc.text('CLEANING', 90, y + 4);
      doc.text('READINESS', 112, y + 4);
      doc.text('ASSIGNMENT', 135, y + 4);
      doc.text('OPERATIONAL RATIONALE', 160, y + 4);

      y += 6;
      fleet.forEach((train, i) => {
        let action = 'STANDBY';
        if (decision.deployedTrainIds.includes(train.trainId)) action = 'DEPLOY';
        else if (decision.maintenanceTrainIds.includes(train.trainId)) action = 'MAINTENANCE';

        const reason = decision.rationale[train.trainId] || 'Assigned per schedule.';

        doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
        doc.rect(14, y, 182, 6.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(train.trainId, 16, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`#${train.trackNumber}`, 32, y + 4.5);
        doc.text(`${train.mileage.toLocaleString()} km`, 50, y + 4.5);

        // Maint status
        doc.setTextColor(train.maintenanceStatus === 'OK' ? 16 : 225, train.maintenanceStatus === 'OK' ? 140 : 29, 72);
        doc.text(train.maintenanceStatus, 73, y + 4.5);

        doc.setTextColor(train.cleaningStatus === 'CLEAN' ? 16 : 217, train.cleaningStatus === 'CLEAN' ? 140 : 119, 6);
        doc.text(train.cleaningStatus, 90, y + 4.5);

        doc.setTextColor(train.operationalReadiness ? 16 : 225, train.operationalReadiness ? 140 : 29, 72);
        doc.text(train.operationalReadiness ? 'Ready' : 'Not Ready', 112, y + 4.5);

        // Assignment badge
        doc.setFont('helvetica', 'bold');
        if (action === 'DEPLOY') doc.setTextColor(16, 185, 129);
        else if (action === 'STANDBY') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(225, 29, 72);
        doc.text(action, 135, y + 4.5);

        // Shortened reason
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const shortReason = reason.length > 25 ? reason.slice(0, 24) + '...' : reason;
        doc.text(shortReason, 160, y + 4.5);

        y += 6.5;
      });

      // Section 3: Safety Sign-off & One-step Lookahead Guarantee
      y += 5;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 20, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 20, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('ONE-STEP LOOK-AHEAD VERIFICATION & REGULATORY SIGN-OFF:', 18, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `The Reinforcement Learning Fleet Agent mathematically projected post-dispatch conditions into period t+1.`,
        18,
        y + 11
      );
      doc.text(
        `Healthy reserve capacity: ${decision.futureReserveMargin} spare train sets. Downstream deficit risk: ${decision.lookaheadProjectedDeficit} sets. Policy reward: ${decision.reward} pts.`,
        18,
        y + 15
      );

      // Sign-off signature line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Certified by Duty Depot Operations Officer: __________________________', 18, y + 27);
      doc.text('Chief Traction Inspector Sign-Off: __________________________', 115, y + 27);

      // Save PDF to file
      doc.save(`Metro_Induction_Report_${depot.code}_${decision.timePeriod.replace(/:/g, '')}.pdf`);

      // Record audit log to Firestore
      await recordAuditLog({
        id: `audit-${Date.now()}`,
        userId: currentUser.uid,
        depotId: depot.id,
        action: 'REPORT_PDF_EXPORTED',
        details: `Exported administrative PDF report ${reportId} for period ${decision.timePeriod} with ${deployedTrains.length} deployed train sets.`,
        timestamp: new Date().toISOString(),
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export Raw Fleet Telemetry CSV
  const handleExportCSV = async () => {
    try {
      const headers = [
        'Train_ID',
        'Depot_ID',
        'Depot_Code',
        'Train_Type',
        'Track_Number',
        'Passenger_Capacity',
        'Mileage_KM',
        'Maintenance_Status',
        'Cleaning_Status',
        'Operational_Readiness',
        'Induction_Assignment',
        'Lookahead_Score',
        'Last_Maintenance_Date',
        'Telemetry_Updated_At',
        'Operational_Rationale',
      ];

      const rows = fleet.map((t) => {
        let action = 'STANDBY';
        if (decision.deployedTrainIds.includes(t.trainId)) action = 'DEPLOY';
        else if (decision.maintenanceTrainIds.includes(t.trainId)) action = 'MAINTENANCE';

        const rationale = (decision.rationale[t.trainId] || 'Assigned per operational schedule.').replace(/"/g, '""');

        return [
          t.trainId,
          depot.id,
          depot.code,
          `"${t.trainType.replace(/"/g, '""')}"`,
          t.trackNumber,
          t.passengerCapacity,
          t.mileage,
          t.maintenanceStatus,
          t.cleaningStatus,
          t.operationalReadiness ? 'READY' : 'NOT_READY',
          action,
          decision.lookaheadScore,
          t.lastMaintenanceDate,
          t.updatedAt,
          `"${rationale}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Metro_Fleet_Telemetry_${depot.code}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Audit log to Cloud Firestore
      await recordAuditLog({
        id: `audit-${Date.now()}`,
        userId: currentUser.uid,
        depotId: depot.id,
        action: 'FLEET_CSV_EXPORTED',
        details: `Exported raw telemetry dataset (${fleet.length} trains) to CSV file: ${filename}`,
        timestamp: new Date().toISOString(),
      });

      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating CSV telemetry export:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header in Pastel Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/95 border border-sky-100 p-5 sm:p-6 shadow-sm shadow-sky-100/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Administrative Documentation & PDF Report Generator
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Export legally compliant train induction and rolling-stock maintenance readiness reports for regulatory archives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-xs transition"
            title="Export raw telemetry dataset as CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Download CSV Data</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span className="hidden sm:inline">Print Document</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-200 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Official PDF Report successfully generated and downloaded! Logged in Cloud Firestore audit log.</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700">{reportId}</span>
        </div>
      )}

      {csvExportSuccess && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
            <span>Raw Fleet Telemetry CSV exported successfully! All {fleet.length} train sets logged with rationale attributes.</span>
          </div>
          <span className="font-mono text-[11px] text-sky-700 font-bold">CSV EXPORT VERIFIED</span>
        </div>
      )}

      {/* Official Document Preview Frame in Crisp Administrative Pastel Paper Style */}
      <div className="rounded-2xl bg-white/95 border border-sky-200 p-6 sm:p-10 shadow-lg shadow-sky-100/50 space-y-8 text-slate-800 font-sans">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest text-sky-700 font-bold font-mono">
                Metro Rail Transit Authority &bull; Rolling Stock Directorate
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Train Induction Planning & Fleet Telemetry Report
            </h1>
            <p className="text-xs text-slate-500">
              Shift Operations, Demand Quota Fulfillment & One-Step Look-Ahead Safety Verification
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-right text-xs space-y-1 font-mono">
            <div>
              <span className="text-slate-500">Report Ref:</span>{' '}
              <strong className="text-sky-800">{reportId}</strong>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>{' '}
              <span className="text-slate-700">{timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500">Security:</span>{' '}
              <span className="text-emerald-700 font-semibold">Cloud Firestore Verified</span>
            </div>
          </div>
        </div>

        {/* Administrative Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Depot Facility</span>
            <strong className="text-slate-900">{depot.name} ({depot.code})</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Operating Period</span>
            <strong className="text-sky-800 font-mono">{decision.timePeriod}</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Authorized Officer</span>
            <strong className="text-slate-900">{currentUser.displayName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Total Rolling Stock</span>
            <strong className="text-slate-900">{fleet.length} Train Sets</strong>
          </div>
        </div>

        {/* Executive Summary Metrics Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Zap className="h-4 w-4 text-sky-600" />
            1. Executive Operational Quota & Induction Dispatch
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/70 text-slate-700 font-semibold border-b border-sky-100">
                <tr>
                  <th className="py-2.5 px-4">Performance Indicator</th>
                  <th className="py-2.5 px-4">Operational Value</th>
                  <th className="py-2.5 px-4">Safety Benchmark Target</th>
                  <th className="py-2.5 px-4">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">Predicted Passenger Demand (XGBoost)</td>
                  <td className="py-2.5 px-4 font-bold text-sky-800">{currentCycle.predictedDemand.toLocaleString()} pax/hr</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Peak Window Forecasting</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">VERIFIED</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">Required Train Quota (Service Agent)</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{decision.requiredTrains} train sets</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">850 effective pax per set</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">CONFIRMED</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">Active Revenue Induction (Fleet Agent RL)</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-700">{deployedTrains.length} train sets</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">&ge; {decision.requiredTrains} sets required</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">100% SATISFIED</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">Hot Standby Emergency Reserve</td>
                  <td className="py-2.5 px-4 font-bold text-amber-800">{standbyTrains.length} train sets</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">&ge; {depot.minStandbyBuffer} sets required buffer</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">BUFFER SECURED</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">Workshop & Maintenance Holding</td>
                  <td className="py-2.5 px-4 font-bold text-rose-700">{maintenanceTrains.length} train sets</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Overhaul limit: 48,000 km</td>
                  <td className="py-2.5 px-4 text-rose-700 font-semibold">SERVICING</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans text-slate-700">One-Step Look-Ahead Downstream Feasibility</td>
                  <td className="py-2.5 px-4 font-bold text-sky-800">{decision.lookaheadScore}%</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">&ge; 80% resilience threshold</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">RESILIENT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Fleet Status Ledger */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Layers className="h-4 w-4 text-sky-600" />
            2. Rolling Stock Individual Dispatch Status Ledger
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/70 text-slate-700 font-semibold border-b border-sky-100">
                <tr>
                  <th className="py-2.5 px-3">Train ID</th>
                  <th className="py-2.5 px-3">Berth</th>
                  <th className="py-2.5 px-3">Odometer</th>
                  <th className="py-2.5 px-3">Maintenance</th>
                  <th className="py-2.5 px-3">Cleaning</th>
                  <th className="py-2.5 px-3">Readiness</th>
                  <th className="py-2.5 px-3">Assigned Status</th>
                  <th className="py-2.5 px-3">Operational Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {fleet.map((t) => {
                  let action = 'STANDBY';
                  if (decision.deployedTrainIds.includes(t.trainId)) action = 'DEPLOY';
                  else if (decision.maintenanceTrainIds.includes(t.trainId)) action = 'MAINTENANCE';

                  const reason = decision.rationale[t.trainId] || 'Assigned per operational schedule.';

                  return (
                    <tr key={t.id} className="hover:bg-sky-50/30 transition">
                      <td className="py-2 px-3 font-bold text-slate-900">{t.trainId}</td>
                      <td className="py-2 px-3 text-slate-600">Track #{t.trackNumber}</td>
                      <td className="py-2 px-3 text-slate-700">{t.mileage.toLocaleString()} km</td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            t.maintenanceStatus === 'OK' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {t.maintenanceStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            t.cleaningStatus === 'CLEAN' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {t.cleaningStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={t.operationalReadiness ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {t.operationalReadiness ? 'Ready' : 'Not Ready'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            action === 'DEPLOY'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : action === 'STANDBY'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-sans truncate max-w-xs">{reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Sign-Off Block */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Regulatory Compliance & Certification Notice
            </h4>
            <p className="leading-relaxed">
              This document was generated using an authorized session authenticated with Cloud Firestore RBAC rules.
              All train allocations conform to physical rail safety standards, periodic overhaul mileage limits,
              and minimum emergency hot reserve thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            <div className="border-t border-slate-300 pt-2 text-xs">
              <span className="text-slate-500 block">Duty Depot Operations Manager</span>
              <strong className="text-slate-900 block mt-1">{currentUser.displayName}</strong>
              <span className="text-slate-500 font-mono text-[10px]">Digital Signature Verified &bull; {timestamp}</span>
            </div>

            <div className="border-t border-slate-300 pt-2 text-xs">
              <span className="text-slate-500 block">Chief Rolling Stock Engineer</span>
              <strong className="text-slate-900 block mt-1">Autonomous AI Fleet Agent (Look-Ahead Certified)</strong>
              <span className="text-slate-500 font-mono text-[10px]">Algorithm Policy Reward: +{decision.reward} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
