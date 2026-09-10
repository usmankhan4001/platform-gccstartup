'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Users,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Filter,
  Eye,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { WhatsAppMockupPreview } from '../templates/WhatsAppMockupPreview';
import { VariableMapper } from './VariableMapper';
import { InfoTooltip, Tooltip } from '@/components/ui/Tooltip';

interface CampaignWizardProps {
  templates: any[];
  groups: any[];
  tags: any[];
}

export function CampaignWizard({ templates = [], groups = [], tags = [] }: CampaignWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [includeGroupIds, setIncludeGroupIds] = useState<string[]>([]);
  const [includeTagIds, setIncludeTagIds] = useState<string[]>([]);
  const [excludeGroupIds, setExcludeGroupIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  // Keys mirror lib/whatsapp/dispatcher's contact field map so mapped variables
  // resolve at send time instead of degrading to the fallback value.
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({
    '1': 'first_name',
    '2': 'company',
  });
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Audience Live Calculator State
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sampleContacts, setSampleContacts] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Live audience calculation trigger
  useEffect(() => {
    setIsCalculating(true);
    const audienceFilter = {
      sendToAll,
      includeGroups: includeGroupIds,
      includeTags: includeTagIds,
      excludeGroups: excludeGroupIds,
      excludeTags: excludeTagIds,
    };

    fetch('/api/campaigns/calculate-audience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audienceFilter }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAudienceCount(data.count ?? 0);
        setSampleContacts(data.sampleContacts || []);
      })
      .catch(() => {})
      .finally(() => setIsCalculating(false));
  }, [sendToAll, includeGroupIds, includeTagIds, excludeGroupIds, excludeTagIds]);

  const handleLaunchCampaign = async () => {
    if (!campaignName.trim()) {
      setError('Please provide a campaign name.');
      setStep(1);
      return;
    }
    if (!selectedTemplateId) {
      setError('Please select an approved Meta message template.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const audienceFilter = {
        sendToAll,
        includeGroups: includeGroupIds,
        includeTags: includeTagIds,
        excludeGroups: excludeGroupIds,
        excludeTags: excludeTagIds,
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          templateId: selectedTemplateId,
          audienceFilter,
          variableMappings,
          headerMediaUrl: headerMediaUrl.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
          startImmediately: !scheduledAt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to launch broadcast campaign');
      }

      const campaignId = data.campaign?.id || data.id;
      router.push(`/crm/campaigns/${campaignId}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 3-Step Wizard Progress Tracker */}
      <div className="bg-[var(--surface)] p-2.5 rounded-2xl border border-[var(--border)] shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, title: 'Audience & Segmentation', icon: Users, desc: 'Target lists, tags & suppressions' },
            { num: 2, title: 'Approved Meta HSM Template', icon: FileText, desc: 'Template picker & dynamic variables' },
            { num: 3, title: 'Schedule & Launch', icon: Send, desc: 'Rate-limiting & dispatch telemetry' },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num as any)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isCurrent
                    ? 'bg-[var(--navy)] text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-[var(--surface-alt)] text-[var(--navy)] hover:bg-[var(--border)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-alt)]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[var(--orange)] text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[var(--border)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">{s.title}</p>
                  <p className={`text-[10px] truncate ${isCurrent ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Audience Selection & Segmentation */}
      {step === 1 && (
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--navy)]">Step 1: Audience Selection & Segmentation</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Specify your broadcast campaign title and configure recipient lists, tags, and suppression subtractions.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
              Broadcast Campaign Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UAE Corporate Tax & Annual Renewal Broadcast"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>

          {/* Audience Filter Settings */}
          <div className="space-y-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Audience Targeting & Suppression Rules</span>
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                  className="rounded text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4"
                />
                <span>Broadcast to ALL Active Contacts</span>
              </label>
            </div>

            {!sendToAll && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Include Groups & Tags */}
                <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--navy)]">Include Target Lists (OR)</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      Inclusion
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Target Groups</label>
                    <div className="flex flex-wrap gap-1.5">
                      {groups.length === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)]">All leads included by default</span>
                      ) : (
                        groups.map((g) => {
                          const isSelected = includeGroupIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) setIncludeGroupIds(includeGroupIds.filter((id) => id !== g.id));
                                else setIncludeGroupIds([...includeGroupIds, g.id]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[var(--navy)] text-white shadow-xs'
                                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]'
                              }`}
                            >
                              + {g.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Target Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.length === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)]">No tags available</span>
                      ) : (
                        tags.map((t) => {
                          const isSelected = includeTagIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) setIncludeTagIds(includeTagIds.filter((id) => id !== t.id));
                                else setIncludeTagIds([...includeTagIds, t.id]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[var(--navy)] text-white shadow-xs'
                                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]'
                              }`}
                            >
                              #{t.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Exclude Groups & Tags */}
                <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--navy)]">Exclude Suppressions (Subtract)</span>
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Suppression
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Exclude Groups</label>
                    <div className="flex flex-wrap gap-1.5">
                      {groups.length === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)]">No groups</span>
                      ) : (
                        groups.map((g) => {
                          const isSelected = excludeGroupIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) setExcludeGroupIds(excludeGroupIds.filter((id) => id !== g.id));
                                else setExcludeGroupIds([...excludeGroupIds, g.id]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-rose-50'
                              }`}
                            >
                              - {g.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Exclude Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.length === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)]">No tags</span>
                      ) : (
                        tags.map((t) => {
                          const isSelected = excludeTagIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) setExcludeTagIds(excludeTagIds.filter((id) => id !== t.id));
                                else setExcludeTagIds([...excludeTagIds, t.id]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-rose-50'
                              }`}
                            >
                              - #{t.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deduplicated Audience Counter */}
            <div className="p-4 rounded-xl bg-[var(--navy)] text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-[var(--orange)] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    Deduplicated E.164 Audience
                  </span>
                  <p className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{isCalculating ? 'Calculating...' : `${audienceCount ?? 0} Verified Contacts`}</span>
                    <span className="text-xs font-normal text-emerald-400">WhatsApp Consent Verified</span>
                  </p>
                </div>
              </div>

              {sampleContacts.length > 0 && (
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-white/60">Sample Recipients:</p>
                  <p className="text-xs text-white/90 font-mono">
                    {sampleContacts.map((c) => c.name || c.phone).slice(0, 2).join(', ')}...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => {
                if (!campaignName.trim()) {
                  setError('Please provide a campaign name.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <span>Next: Meta HSM Template &amp; Variables</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Approved Meta HSM Template Picker & Dynamic Variable Mapper */}
      {step === 2 && (
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--navy)]">Step 2: Approved Meta HSM Template &amp; Dynamic Variable Mapper</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Select an official Meta-approved WhatsApp template and map dynamic variables (`{'{{1}}'}`, `{'{{2}}'}`) to personalized customer attributes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Selection & Variable Mapper */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1.5">Select Approved Template</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {templates.length === 0 ? (
                    <div className="p-6 text-center bg-[var(--surface-alt)] rounded-xl border border-[var(--border)]">
                      <p className="text-xs font-bold text-[var(--text)]">No Templates Found</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                        Sync templates with Meta WhatsApp Cloud API in the Templates Hub.
                      </p>
                    </div>
                  ) : (
                    templates.map((tpl) => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[var(--orange)] bg-[var(--orange-lt)] shadow-xs'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-xs text-[var(--navy)]">{tpl.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                              {tpl.status || 'APPROVED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{tpl.body || tpl.text_body || 'Template message body'}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dynamic Variable Mapper */}
              <div className="pt-3 border-t border-[var(--border)]">
                <VariableMapper
                  template={selectedTemplate}
                  mappings={variableMappings}
                  headerMediaUrl={headerMediaUrl}
                  onChangeMapping={(k, v) => setVariableMappings({ ...variableMappings, [k]: v })}
                  onChangeHeaderUrl={(url) => setHeaderMediaUrl(url)}
                />
              </div>
            </div>

            {/* Live WhatsApp Mockup Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--border)]">
              <h4 className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider mb-3">
                Live WhatsApp HSM Preview
              </h4>
              {selectedTemplate && (
                <WhatsAppMockupPreview
                  template={selectedTemplate}
                  headerMediaUrl={headerMediaUrl}
                  sampleValues={{ '1': 'Rashid', '2': 'Apex Ventures', '3': 'Dubai QFZP' }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--surface-alt)] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedTemplateId}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <span>Next: Pre-Flight &amp; Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pre-Flight Review, Schedule & Launch */}
      {step === 3 && (
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--navy)]">Step 3: Pre-Flight Review &amp; Launch</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Review pre-flight metrics, set dispatch schedule, and trigger rate-limited dispatch across Meta WhatsApp Cloud API.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Campaign</span>
              <p className="text-sm font-bold text-[var(--navy)] mt-1 truncate">{campaignName}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono truncate">Template: {selectedTemplate?.name}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Recipients</span>
              <p className="text-lg font-bold text-[var(--navy)] mt-1">{audienceCount ?? 0} Contacts</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Deduplicated &amp; Valid</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Estimated Dispatch</span>
              <p className="text-lg font-bold text-[var(--navy)] mt-1">~ {Math.max(1, Math.ceil((audienceCount || 1) / 20))}s</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">20 msgs / second limit</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">0% Platform Markup</span>
              <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                ${((audienceCount || 0) * 0.045).toFixed(2)} USD
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Direct Meta WhatsApp Tier</p>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider">Dispatch Timing</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs text-[var(--text-secondary)] font-medium">Schedule for later (Optional):</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
              />
              {scheduledAt && (
                <button
                  type="button"
                  onClick={() => setScheduledAt('')}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear (Send Immediately)
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--surface-alt)] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleLaunchCampaign}
              disabled={isSubmitting || (audienceCount ?? 0) === 0}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Starting Dispatch Engine...' : scheduledAt ? 'Schedule WhatsApp Broadcast' : 'Launch WhatsApp Broadcast Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

