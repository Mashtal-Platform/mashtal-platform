import React, { useEffect, useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

interface PhoneInputProps {
  label: string;
  value: string;
  required?: boolean;
  defaultCountry?: string; // e.g. 'LB'
  placeholder?: string;
  onChange: (value: string) => void;
}

function formatAsYouType(value: string, defaultCountry: string) {
  try {
    return new AsYouType(defaultCountry as any).input(value);
  } catch {
    return value;
  }
}

function isValidInternationalPhone(value: string, defaultCountry: string) {
  try {
    const parsed = parsePhoneNumberFromString(value, defaultCountry as any);
    return !!parsed?.isValid();
  } catch {
    return false;
  }
}

function normalizePhoneForServer(value: string, defaultCountry: string) {
  // Server validation accepts only: optional leading +, digits, spaces, dashes.
  // To make it deterministic, always emit E.164 (+ followed by digits) when possible.
  const cleaned = String(value || '')
    .replace(/[()]/g, '')
    .replace(/[–—]/g, '-') // normalize unicode dashes
    .replace(/[^\d+\-\s]/g, '')
    .trim();

  try {
    const parsed = parsePhoneNumberFromString(cleaned, defaultCountry as any);
    if (parsed?.number) return parsed.number; // E.164 format: +{country}{national}
  } catch {
    // fall through
  }

  // If we can't parse yet, keep the cleaned value (still server-compatible chars).
  // Collapse whitespace to a single space for stability.
  return cleaned.replace(/\s+/g, ' ');
}

/**
 * Professional phone input:
 * - formats as-you-type
 * - allows any international number, but defaults to Lebanon
 * - emits the formatted string (international format when possible)
 */
export function PhoneInput({
  label,
  value,
  required = false,
  defaultCountry = 'LB',
  placeholder = 'e.g. +961 70 123 456',
  onChange,
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);

  const serverValue = useMemo(
    () => normalizePhoneForServer(value || '', defaultCountry),
    [value, defaultCountry]
  );

  const display = useMemo(
    () => formatAsYouType(serverValue, defaultCountry),
    [serverValue, defaultCountry]
  );
  const valid = useMemo(
    () => !serverValue || isValidInternationalPhone(serverValue, defaultCountry),
    [serverValue, defaultCountry]
  );

  // Keep parent state formatted (so other screens show nicely)
  useEffect(() => {
    if (!serverValue) return;
    // Emit normalized server-safe value (E.164 when possible) to parent.
    if (serverValue !== value) onChange(serverValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverValue]);

  return (
    <div>
      <label className="block text-sm text-neutral-700 mb-2">
        {label} {required ? '*' : ''}
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={display}
          onChange={(e) => {
            const nextRaw = e.target.value;
            const serverCompatible = normalizePhoneForServer(nextRaw, defaultCountry);
            onChange(serverCompatible);
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${
            !touched || valid
              ? 'border-neutral-200 focus:border-green-600 focus:ring-green-100'
              : 'border-red-300 focus:border-red-500 focus:ring-red-100'
          }`}
        />
      </div>
      {touched && value && !valid && (
        <div className="mt-1 text-xs text-red-600">Enter a valid phone number (example: +961 70 123 456).</div>
      )}
    </div>
  );
}

