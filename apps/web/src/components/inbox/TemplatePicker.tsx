'use client'

import React, { useMemo, useState } from 'react'
import { FileText, Send, X, ShieldCheck, AlertTriangle, Search } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface TemplatePickerProps {
  templates: AnyRecord[]
  sending?: boolean
  contactName?: string
  onSend: (template: AnyRecord, variables: string[]) => void
  onClose: () => void
}

/** Meta stores status lowercase ('approved'); older rows may be uppercase. */
export function isApprovedTemplate(template: AnyRecord): boolean {
  return String(template?.status || '').toLowerCase() === 'approved'
}

/** Positional {{1}}…{{n}} placeholders, ordered by index. */
export function templatePlaceholders(template: AnyRecord): string[] {
  const body = String(template?.body || '')
  const matches = body.match(/\{\{(\d+)\}\}/g) || []
  const unique = Array.from(new Set(matches.map((m) => m.replace(/\D/g, ''))))
  return unique.sort((a, b) => Number(a) - Number(b))
}

export function renderTemplateBody(body: string, variables: Record<string, string>): string {
  return String(body || '').replace(/\{\{(\d+)\}\}/g, (match, index: string) => {
    const value = variables[index]
    return value && value.trim() ? value : match
  })
}

export function TemplatePicker({
  templates,
  sending = false,
  contactName = 'there',
  onSend,
  onClose,
}: TemplatePickerProps) {
  const approved = useMemo(() => templates.filter(isApprovedTemplate), [templates])
  const rejected = useMemo(() => templates.filter((t) => !isApprovedTemplate(t)), [templates])

  const [selectedId, setSelectedId] = useState<string>(approved[0]?.id ?? '')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')

  const selected = approved.find((t) => t.id === selectedId) || approved[0] || null
  const placeholders = selected ? templatePlaceholders(selected) : []

  const visible = query.trim()
    ? approved.filter((t) =>
        `${t.name} ${t.category} ${t.body}`.toLowerCase().includes(query.trim().toLowerCase())
      )
    : approved

  const previewBody = selected ? renderTemplateBody(selected.body, variables) : ''

  const missing = placeholders.filter((p) => !String(variables[p] || '').trim())

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-[var(--text)]">Approved Meta HSM templates</span>
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            {approved.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          aria-label="Close template picker"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {approved.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-xs font-semibold text-[var(--text)]">No approved templates available</p>
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
            Create a template in Templates, sync it from Meta, and wait for approval before sending outside the
            24-hour window.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-3 md:grid-cols-2">
          {/* Template list */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] py-1.5 pl-8 pr-2 text-xs text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
              {visible.map((tpl) => {
                const isActive = selected?.id === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(tpl.id)
                      setVariables({})
                    }}
                    className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--orange-lt)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
                      <span className="truncate font-mono text-[11px] font-bold text-[var(--text)]">{tpl.name}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      {tpl.body}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                      <span>{tpl.category}</span>
                      <span>·</span>
                      <span>{String(tpl.language || 'en').toUpperCase()}</span>
                      {templatePlaceholders(tpl).length > 0 && (
                        <>
                          <span>·</span>
                          <span>{templatePlaceholders(tpl).length} vars</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
              {visible.length === 0 && (
                <p className="py-4 text-center text-[11px] text-[var(--text-tertiary)]">No templates match “{query}”.</p>
              )}
            </div>
          </div>

          {/* Variable fill-in + preview */}
          <div className="space-y-2.5">
            {selected && (
              <>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5">
                  <p className="font-mono text-[11px] font-bold text-[var(--text)]">{selected.name}</p>
                  {selected.header && (
                    <p className="mt-1 text-[11px] font-semibold text-[var(--text-secondary)]">{selected.header}</p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {previewBody}
                  </p>
                  {selected.footer && (
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{selected.footer}</p>
                  )}
                </div>

                {placeholders.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Fill {placeholders.length} variable{placeholders.length === 1 ? '' : 's'}
                    </p>
                    {placeholders.map((idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="shrink-0 rounded bg-[var(--navy)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {`{{${idx}}}`}
                        </span>
                        <input
                          value={variables[idx] || ''}
                          onChange={(e) => setVariables((prev) => ({ ...prev, [idx]: e.target.value }))}
                          placeholder={idx === '1' ? contactName : `Value ${idx}`}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  disabled={sending || missing.length > 0}
                  onClick={() => onSend(selected, placeholders.map((p) => variables[p] || ''))}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? 'Sending…' : missing.length > 0 ? `Fill ${missing.length} variable(s)` : 'Send template'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="border-t border-[var(--border)] bg-amber-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            {rejected.length} template{rejected.length === 1 ? '' : 's'} pending or rejected by Meta — hidden from
            sending
          </p>
        </div>
      )}
    </div>
  )
}
