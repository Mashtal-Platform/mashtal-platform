import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import type { LocationResult } from '../shared/api/locations';
import {
  loadLebanonLocations,
  searchLebanonLocationsLocal,
  type LebanonLocation,
} from '../shared/utils/lebanonLocations';

interface LebanonLocationPickerProps {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function LebanonLocationPicker({
  label,
  value,
  required = false,
  placeholder = 'Search Lebanese city/village…',
  onChange,
}: LebanonLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<number | null>(null);

  const displayValue = open ? query : value;

  const effectiveQuery = useMemo(() => query.trim(), [query]);
  const allLocations = useMemo(() => loadLebanonLocations(), []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const matched: LebanonLocation[] = searchLebanonLocationsLocal(allLocations, effectiveQuery, 30);
      const mapped: LocationResult[] = matched.map((m, idx) => ({
        id: `${m.ar}|${m.en}|${idx}`,
        name: m.ar && m.en && m.ar !== m.en ? `${m.ar} / ${m.en}` : (m.ar || m.en),
        name_ar: m.ar || undefined,
        name_en: m.en || undefined,
        type: 'village',
      }));
      setResults(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [open, effectiveQuery, allLocations]);

  const openPicker = () => {
    setOpen(true);
    // Start fresh so users can search immediately (do not prefill with the saved bilingual value).
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closePicker = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
  };

  const isArabicUi = () => {
    try {
      const docLang = document?.documentElement?.lang || '';
      if (docLang.toLowerCase().startsWith('ar')) return true;
      const nav = navigator?.language || '';
      return nav.toLowerCase().startsWith('ar');
    } catch {
      return false;
    }
  };

  const getPrimaryName = (item: LocationResult) => {
    const preferAr = isArabicUi();
    if (preferAr) return item.name_ar || item.name || item.name_en || '';
    return item.name_en || item.name || item.name_ar || '';
  };

  const getSecondaryName = (item: LocationResult) => {
    const preferAr = isArabicUi();
    const a = item.name_ar || '';
    const e = item.name_en || '';
    if (!a || !e) return '';
    if (a === e) return '';
    return preferAr ? e : a;
  };

  const formatSavedValue = (item: LocationResult) => {
    const a = (item.name_ar || '').trim();
    const e = (item.name_en || '').trim();
    if (a && e && a !== e) return `${a} / ${e}`;
    return (a || e || item.name || '').trim();
  };

  const select = (item: LocationResult) => {
    onChange(formatSavedValue(item));
    closePicker();
  };

  return (
    <div className="relative">
      <label className="block text-sm text-neutral-700 mb-2">
        {label} {required ? '*' : ''}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onFocus={() => openPicker()}
          onChange={(e) => {
            // Do NOT directly change saved value; only change query until user selects.
            if (!open) setOpen(true);
            setQuery(e.target.value);
          }}
          onBlur={() => {
            // Allow click selection in dropdown before closing
            blurTimer.current = window.setTimeout(() => closePicker(), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closePicker();
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-required={required}
        />
        {open && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              // Clear only the query; keep actual selected value until user selects a new one.
              setQuery('');
              setResults([]);
              setError(null);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
            title="Clear search"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        )}
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div
          onMouseDown={() => {
            // Prevent blur-close when clicking inside dropdown
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
          }}
          className="absolute z-50 mt-2 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden"
        >
          {error && (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="px-4 py-3 text-sm text-neutral-600">No matches found.</div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => select(r)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
              >
                <div className="text-sm text-neutral-900">{getPrimaryName(r)}</div>
                {getSecondaryName(r) && (
                  <div className="text-xs text-neutral-500">{getSecondaryName(r)}</div>
                )}
                {r.type && <div className="text-xs text-neutral-500 capitalize">{r.type}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

