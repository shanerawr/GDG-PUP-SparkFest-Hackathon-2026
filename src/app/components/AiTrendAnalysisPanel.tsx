import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle, Clock, MapPin, Layers, Filter, Shield, Activity, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserProfile } from '../types';

interface Hotspot {
  area: string;
  hazardCount: number;
  primaryHazard: string;
  severity: 'Life-Threatening' | 'Urgent' | 'Needs Attention';
}

interface AgencyCoord {
  agency: string;
  action: string;
}

interface AiAnalysisData {
  summary: string;
  hotspots: Hotspot[];
  priorityRecommendations: string[];
  agencyCoordination: AgencyCoord[];
  stats?: {
    total: number;
    unresolved: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
  aiModel: string;
  timestamp: string;
}

interface Props {
  currentUser: UserProfile;
}

export function AiTrendAnalysisPanel({ currentUser }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<AiAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchAnalysis = async (filter = filterType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality: currentUser.municipality || '',
          governmentCategory: currentUser.governmentCategory || '',
          role: currentUser.role || 'authority',
          filterType: filter,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI trend insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [currentUser, filterType]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Life-Threatening':
        return (
          <span className="inline-flex items-center gap-1 bg-red-950 text-red-200 border border-red-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            <ShieldAlert size={11} className="text-red-400 animate-pulse" /> {sev}
          </span>
        );
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-700 border border-red-300/60 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <AlertTriangle size={11} className="text-red-600" /> {sev}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-800 border border-amber-300/60 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <TrendingUp size={11} className="text-amber-600" /> {sev}
          </span>
        );
    }
  };

  return (
    <div className="py-3 px-1 space-y-4 animate-in fade-in duration-300">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-5 shadow-xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-extrabold tracking-wider uppercase mb-1">
              <Sparkles size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{(t as any).aiTrends?.title || 'Gemini AI Hazard Intelligence'}</span>
            </div>
            <h3 className="text-[17px] font-black tracking-tight text-white leading-tight">
              {currentUser.municipality ? `${currentUser.municipality} Sector Analysis` : 'National Community Hazard Trends'}
            </h3>
            <p className="text-[11.5px] text-indigo-200/80 font-medium max-w-sm">
              {(t as any).aiTrends?.subtitle || 'Real-time incident pattern recognition & dispatch recommendations'}
            </p>
          </div>

          <button
            onClick={() => fetchAnalysis()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-amber-400' : 'text-blue-300'} />
            <span className="hidden sm:inline">{loading ? ((t as any).aiTrends?.refreshing || 'Analyzing...') : ((t as any).aiTrends?.refresh || 'Refresh')}</span>
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-indigo-300 mr-1 flex items-center gap-1 flex-shrink-0">
            <Filter size={11} /> Filter:
          </span>
          {[
            { id: 'all', label: (t as any).aiTrends?.filterAll || 'All Hazards' },
            { id: 'flood', label: 'Flood & Water' },
            { id: 'infrastructure', label: 'Road & Infra' },
            { id: 'utility-outages', label: 'Utility Outages' },
            { id: 'fire', label: 'Fire & Emergency' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                filterType === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md border border-blue-400/50 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-indigo-200 border border-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-white/60 shadow-lg space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-bounce">
            <Sparkles size={26} className="text-white animate-pulse" />
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold text-gray-800">Synthesizing Community Reports</h4>
            <p className="text-[12px] font-medium text-gray-500 mt-1 max-w-xs mx-auto">
              Google Gemini is analyzing geographical clusters, severity metrics, and agency routing priorities...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-3xl p-6 text-center border border-red-200 shadow-sm space-y-2">
          <AlertTriangle size={28} className="mx-auto text-red-500" />
          <p className="text-[14px] font-extrabold text-red-800">Intelligence Feed Offline</p>
          <p className="text-[12px] text-red-600">{error}</p>
          <button
            onClick={() => fetchAnalysis()}
            className="mt-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          {data.stats && (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                <span className="block text-[18px] font-black text-gray-900">{data.stats.total}</span>
                <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-tight">Monitored</span>
              </div>
              <div className="bg-red-500/10 p-3 rounded-2xl border border-red-200/60 shadow-sm text-center">
                <span className="block text-[18px] font-black text-red-700">{data.stats.critical}</span>
                <span className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-tight">Critical</span>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-200/60 shadow-sm text-center">
                <span className="block text-[18px] font-black text-amber-700">{data.stats.unresolved}</span>
                <span className="text-[9.5px] font-extrabold text-amber-700 uppercase tracking-tight">Pending</span>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-200/60 shadow-sm text-center">
                <span className="block text-[18px] font-black text-emerald-700">{data.stats.inProgress + data.stats.resolved}</span>
                <span className="text-[9.5px] font-extrabold text-emerald-700 uppercase tracking-tight">Actioned</span>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl p-5 border border-indigo-500/20 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Activity size={14} />
              </div>
              <h4 className="text-[14px] font-black text-gray-900 tracking-tight">
                {(t as any).aiTrends?.summaryTitle || 'Executive Hazard Synthesis'}
              </h4>
            </div>
            <p className="text-[13px] font-semibold text-gray-700 leading-relaxed pl-1">
              "{data.summary}"
            </p>
          </div>

          {/* Hotspots Matrix */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
                  <MapPin size={14} />
                </div>
                <h4 className="text-[14px] font-black text-gray-900 tracking-tight">
                  {(t as any).aiTrends?.hotspotsTitle || 'Critical Incident Hotspots'}
                </h4>
              </div>
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Top Areas
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {data.hotspots && data.hotspots.length > 0 ? (
                data.hotspots.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-extrabold text-gray-900">{h.area}</span>
                        {getSeverityBadge(h.severity)}
                      </div>
                      <p className="text-[11.5px] font-semibold text-gray-500 flex items-center gap-1.5">
                        <Layers size={12} className="text-[#47B3E8]" /> Threat: <span className="text-gray-700 font-bold">{h.primaryHazard}</span>
                      </p>
                    </div>
                    <div className="text-right pl-3 flex-shrink-0">
                      <span className="block text-[18px] font-black text-gray-900">{h.hazardCount}</span>
                      <span className="text-[9.5px] font-extrabold text-gray-400 uppercase">Reports</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-gray-500 italic text-center py-4">No critical hotspot groupings detected.</p>
              )}
            </div>
          </div>

          {/* Priority Action Plan */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <CheckCircle size={14} />
              </div>
              <h4 className="text-[14px] font-black text-gray-900 tracking-tight">
                {(t as any).aiTrends?.recommendationsTitle || 'Priority Action Plan'}
              </h4>
            </div>

            <div className="space-y-2.5 pt-1">
              {data.priorityRecommendations && data.priorityRecommendations.length > 0 ? (
                data.priorityRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/40 border border-amber-200/50">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-[12.5px] font-bold text-gray-800 leading-snug pt-0.5">{rec}</p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-gray-500 italic">No specific recommendations available.</p>
              )}
            </div>
          </div>

          {/* Multi-Agency Dispatch Matrix */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#47B3E8] flex items-center justify-center text-white shadow-md shadow-[#47B3E8]/20">
                <Shield size={14} />
              </div>
              <h4 className="text-[14px] font-black text-gray-900 tracking-tight">
                {(t as any).aiTrends?.coordinationTitle || 'Multi-Agency Dispatch Matrix'}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {data.agencyCoordination && data.agencyCoordination.length > 0 ? (
                data.agencyCoordination.map((coord, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-[10.5px] tracking-wide uppercase shadow-sm">
                        {coord.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:text-right flex-1 sm:justify-end pl-1 sm:pl-4">
                      <ArrowRight size={13} className="text-[#47B3E8] flex-shrink-0 hidden sm:inline" />
                      <p className="text-[12px] font-bold text-gray-700">{coord.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-gray-500 italic">No agency routing data available.</p>
              )}
            </div>
          </div>

          {/* Footer Badge */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-gray-400">
            <Sparkles size={13} className="text-amber-500" />
            <span>{data.aiModel || ((t as any).aiTrends?.modelInfo || 'Intelligence powered by Google Gemini')}</span>
            <span>•</span>
            <span className="text-gray-400">{new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
