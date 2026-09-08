"use client";

import React, { useState } from "react";
import Link from "next/link";
import { industryRiskTier, type IndustryRiskTier } from '@/lib/persona';
import { COUNTRIES } from '@/lib/countries';

interface BankResult {
  bank: string;
  odds: number;
}

function computeOdds(risk: IndustryRiskTier, turnover: number): BankResult[] {
  const base: Record<IndustryRiskTier, { wio: number; enbd: number }> = {
    LOW: { wio: 95, enbd: 85 },
    MEDIUM: { wio: 75, enbd: 60 },
    HIGH: { wio: 40, enbd: 20 },
    CRITICAL: { wio: 15, enbd: 5 },
  };
  const turnoverBonus = turnover >= 500000 ? 5 : turnover < 50000 ? -10 : 0;
  const clamp = (n: number) => Math.max(5, Math.min(99, n));

  return [
    { bank: 'Wio Bank', odds: clamp(base[risk].wio + turnoverBonus) },
    { bank: 'Emirates NBD', odds: clamp(base[risk].enbd + turnoverBonus) },
    { bank: 'Mashreq NeoBiz', odds: clamp(base[risk].wio - 5 + turnoverBonus) },
    { bank: 'ADCB Commercial', odds: clamp(base[risk].enbd - 10 + turnoverBonus) },
  ];
}

export default function BankingOddsMatcher() {
  const [nationality, setNationality] = useState("");
  const [industry, setIndustry] = useState("");
  const [turnover, setTurnover] = useState<number | ''>('');
  const [results, setResults] = useState<BankResult[] | null>(null);

  const handleCalculate = () => {
    if (!nationality || !industry || !turnover) return;
    const risk: IndustryRiskTier = 'LOW';
    setResults(computeOdds(risk, Number(turnover)));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="pt-10 pb-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Banking Odds</h1>
      </div>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="nationality" className="w-40 text-xs font-semibold text-gray-700">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Nationality</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="industry" className="w-40 text-xs font-semibold text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Industry</option>
                <option value="Consulting">Consulting / Agency</option>
                <option value="Technology">Software / SaaS / Tech</option>
                <option value="E-commerce">E-commerce / Retail</option>
                <option value="Marketing">Media & Marketing</option>
                <option value="Crypto">Crypto / Web3</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Other">Other Business Activity</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="turnover" className="w-40 text-xs font-semibold text-gray-700">
                Annual Turnover ($)
              </label>
              <input
                id="turnover"
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="150000"
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none transition-colors bg-white text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!nationality || !industry || !turnover}
            className="w-full bg-primary hover:bg-primary-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Calculate Approval Odds
          </button>
        </div>

        {results && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-base font-bold text-gray-900">Your Bank Approval Estimates</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{result.bank}</h3>
                    <p className="text-xs text-gray-500">Corporate Account</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900">
                      {result.odds}<span className="text-xs font-semibold text-gray-400">%</span>
                    </div>
                    <p className={`text-[11px] font-bold ${result.odds > 80 ? 'text-emerald-600' : result.odds > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {result.odds > 80 ? 'High Likelihood' : result.odds > 50 ? 'Moderate Odds' : 'Special Approval Needed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-3 mt-4">
              <h3 className="text-sm font-bold text-primary">Need Guaranteed Banking Support?</h3>
              <p className="text-gray-600 text-xs max-w-md mx-auto">
                Our banking compliance officers manage relationship officer submissions, compliance files, and fast-track opening.
              </p>
              <Link
                href="/services"
                className="inline-block bg-primary hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
              >
                Explore Banking Concierge
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
