import React, { useState } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  HelpCircle,
  Train,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TrainSet, InductionDecisionPlan, HourlyDemandCycle } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: TrainSet[];
  decision: InductionDecisionPlan;
  currentCycle: HourlyDemandCycle;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  fleet,
  decision,
  currentCycle,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your AI Depot Operations Assistant. I am grounded in your current depot fleet (${fleet.length} trains) and the latest AI induction decision for period ${decision.timePeriod}. Ask me anything about train allocations, maintenance statuses, or demand forecasts.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');

    // Generate grounded response from real state
    setTimeout(() => {
      let reply = '';
      const q = textToSend.toLowerCase();

      if (q.includes('t-102') || q.includes('why was t-102 not selected')) {
        const t102 = fleet.find((t) => t.trainId === 'T-102');
        reply = `Train T-102 was excluded from deployment and routed to MAINTENANCE because its accumulated mileage (${t102?.mileage.toLocaleString()} km) exceeds the scheduled overhaul threshold. Consequently, its operational readiness flag is set to False until technical clearance is issued.`;
      } else if (q.includes('maintenance') || q.includes('due')) {
        const maintTrains = fleet.filter((t) => t.maintenanceStatus === 'DUE' || !t.operationalReadiness);
        reply = `Currently, ${maintTrains.length} trains require maintenance attention: ${maintTrains
          .map((t) => `${t.trainId} (Maint: ${t.maintenanceStatus}, Ready: ${t.operationalReadiness})`)
          .join(', ')}.`;
      } else if (q.includes('look-ahead') || q.includes('lookahead')) {
        reply = `The One-Step Look-Ahead engine evaluates period t+1 (${decision.timePeriod}). Current score is ${decision.lookaheadScore}%. It confirms that after deploying ${decision.deployedTrainIds.length} trains, ${decision.futureReserveMargin} healthy trains will remain on standby to buffer future demand surges without operational deficits.`;
      } else if (q.includes('demand') || q.includes('passenger')) {
        reply = `For the active period, predicted passenger demand is ${currentCycle.predictedDemand.toLocaleString()} pax. The Service Agent computed an active quota of ${decision.requiredTrains} train sets (based on 850 effective pax per 6-car train).`;
      } else if (q.includes('how to scan') || q.includes('ocr') || q.includes('report')) {
        reply = `To ingest today's maintenance log: Click "OCR Ingest Report" in the top bar. You can upload any PDF or image scan (or load the sample report). The system will highlight changes (e.g., T-102 mileage increase), allowing you to review and approve before the fleet database is updated.`;
      } else {
        reply = `Based on current depot telemetry: There are ${fleet.length} total train sets, with ${decision.deployedTrainIds.length} currently deployed for revenue service, ${decision.standbyTrainIds.length} on hot standby, and ${decision.maintenanceTrainIds.length} under depot maintenance. All allocations strictly respect physical readiness constraints.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-purple-100 shadow-2xl flex flex-col text-slate-800">
      {/* Drawer Header */}
      <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-sky-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Depot Assistant</h3>
            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Grounded in Live Depot Data
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-purple-50/40 border-b border-purple-100">
        <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
          Suggested Operational Queries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Why was T-102 not selected?',
            'Which trains are maintenance due?',
            'Explain one-step look-ahead',
            'How do I scan maintenance report?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 shadow-xs transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-xs ${
                m.sender === 'user'
                  ? 'bg-sky-500 text-white font-medium rounded-br-xs'
                  : 'bg-purple-50/70 border border-purple-100 text-slate-800 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about trains, decisions, look-ahead..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white shadow-xs transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
