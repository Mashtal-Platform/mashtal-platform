import React, { useState, useRef } from 'react';
import { Building2, Save, X, Plus, Trash2, Clock } from 'lucide-react';
import { LebanonLocationPicker } from './LebanonLocationPicker';
import { PhoneInput } from './PhoneInput';

// Backend validation compatibility (server/src/controllers/userController.js)
function isServerPhoneCompatible(phone: string) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return true;
  if (!/^\+?[\d\s\-]*$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export interface BusinessProfileForm {
  fullName?: string;
  companyName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  businessProfile?: {
    companyName?: string;
    bio?: string;
    location?: string;
    phone?: string;
    hours?: Array<{ day: string; closed?: boolean; open?: Array<{ from: string; to: string }> }>;
    about?: Record<string, string>;
  };
}

interface CustomField {
  id: string;
  title: string;
  content: string;
}

interface BusinessEditProfileProps {
  profile: BusinessProfileForm & { hours?: any[]; about?: Record<string, string> };
  onSave: (profile: BusinessProfileForm) => void;
  onCancel: () => void;
}

function defaultHours() {
  return DAYS.map((day) => ({
    day,
    closed: day === 'sunday',
    open: day === 'sunday' ? [] : [{ from: '08:00', to: '18:00' }],
  }));
}

function parseHours(hours: any[] | undefined) {
  if (!hours || !Array.isArray(hours) || hours.length === 0) return defaultHours();
  const byDay: Record<string, any> = {};
  hours.forEach((h) => {
    const d = (h.day || '').toLowerCase();
    if (DAYS.includes(d as any)) {
      byDay[d] = {
        day: d,
        closed: !!h.closed,
        open: Array.isArray(h.open) && h.open.length
          ? h.open.map((s: any) => ({ from: s.from || '09:00', to: s.to || '17:00' }))
          : [{ from: '09:00', to: '17:00' }],
      };
    }
  });
  return DAYS.map((day) => byDay[day] || { day, closed: true, open: [] });
}

function aboutToCustomFields(about: Record<string, string> | undefined): CustomField[] {
  if (!about || typeof about !== 'object') return [];
  return Object.entries(about).map(([title, content]) => ({
    id: title.replace(/\s+/g, '_'),
    title,
    content: typeof content === 'string' ? content : '',
  }));
}

function customFieldsToAbout(fields: CustomField[]): Record<string, string> {
  const about: Record<string, string> = {};
  fields.forEach((f) => {
    const t = (f.title || '').trim();
    if (t) about[t] = (f.content || '').trim();
  });
  return about;
}

/** Ensure end time is strictly after start time (in HH:mm). Returns valid end time. */
function ensureEndAfterStart(from: string, to: string): string {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const fromMins = (fh ?? 0) * 60 + (fm ?? 0);
  let toMins = (th ?? 0) * 60 + (tm ?? 0);
  if (toMins <= fromMins) {
    toMins = fromMins + 60;
    if (toMins >= 24 * 60) toMins = 24 * 60 - 1;
  }
  const h = Math.floor(toMins / 60);
  const m = toMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isTimeBefore(a: string, b: string): boolean {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (ah ?? 0) * 60 + (am ?? 0) < (bh ?? 0) * 60 + (bm ?? 0);
}

export function BusinessEditProfile({ profile, onSave, onCancel }: BusinessEditProfileProps) {
  const bp = profile.businessProfile || {};
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [companyName, setCompanyName] = useState(bp.companyName || profile.companyName || '');
  const [bio, setBio] = useState(bp.bio || profile.bio || '');
  const [location, setLocation] = useState(bp.location || profile.location || '');
  const [phone, setPhone] = useState(bp.phone || profile.phone || '');
  const [hours, setHours] = useState(() => parseHours(profile.hours || bp.hours));
  const [customFields, setCustomFields] = useState<CustomField[]>(() =>
    aboutToCustomFields(profile.about || bp.about)
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hoursErrors, setHoursErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDayChange = (dayIndex: number, field: 'closed' | 'from' | 'to', value: boolean | string) => {
    setSaveError(null);
    setHoursErrors((prev) => ({ ...prev, [dayIndex]: '' }));
    setHours((prev) => {
      const next = [...prev];
      const row = { ...next[dayIndex] };
      if (field === 'closed') {
        row.closed = value as boolean;
        row.open = row.closed ? [] : [{ from: '08:00', to: '18:00' }];
      } else {
        if (!row.open?.length) row.open = [{ from: '08:00', to: '18:00' }];
        const slot = { ...row.open[0] };
        if (field === 'from') {
          slot.from = value as string;
          if (!isTimeBefore(slot.from, slot.to)) slot.to = ensureEndAfterStart(slot.from, slot.to);
        } else {
          const newTo = value as string;
          if (!isTimeBefore(slot.from, newTo)) {
            slot.to = ensureEndAfterStart(slot.from, newTo);
          } else {
            slot.to = newTo;
          }
        }
        row.open = [slot];
      }
      next[dayIndex] = row;
      return next;
    });
  };

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: `f_${Date.now()}`, title: '', content: '' },
    ]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, field: 'title' | 'content', value: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleSave = async () => {
    setSaveError(null);
    const errs: Record<number, string> = {};
    hours.forEach((h, i) => {
      if (!h.closed && h.open?.length) {
        const from = h.open[0].from || '08:00';
        const to = h.open[0].to || '18:00';
        if (!isTimeBefore(from, to)) errs[i] = 'Closing time must be after opening time';
      }
    });
    if (Object.keys(errs).length > 0) {
      setHoursErrors(errs);
      setSaveError('Please fix the working hours: opening time must be before closing time for each day.');
      return;
    }
    setHoursErrors({});
    if (phone.trim()) {
      if (!isServerPhoneCompatible(phone)) {
        setSaveError('Please enter a valid phone number (digits with optional +, spaces/dashes; e.g. +961 70 123 456).');
        return;
      }
    }
    const hoursForApi = hours.map((h) => ({
      day: h.day,
      closed: h.closed,
      open: h.closed ? [] : (h.open || [{ from: '08:00', to: '18:00' }]),
    }));
    const about = customFieldsToAbout(customFields);
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        fullName,
        businessProfile: {
          companyName,
          bio,
          location,
          phone,
          hours: hoursForApi,
          about: Object.keys(about).length ? about : {},
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              Edit Business Profile
            </h2>
            <button
              onClick={onCancel}
              className="p-2.5 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-600"
              aria-label="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {saveError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                {saveError}
              </div>
            )}

            <section className="bg-neutral-50/50 rounded-xl p-6 border border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-800 mb-4 tracking-tight">Basic information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Your name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Business / Company name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Bio / Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none resize-none"
                  placeholder="Tell customers about your business..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <LebanonLocationPicker
                    label="Location"
                    value={location}
                    placeholder="Search city or village in Lebanon…"
                    onChange={setLocation}
                  />
                </div>
                <PhoneInput
                  label="Phone"
                  value={phone}
                  defaultCountry="LB"
                  placeholder="e.g. +961 70 123 456"
                  onChange={setPhone}
                />
              </div>
            </section>

            <section className="bg-neutral-50/50 rounded-xl p-6 border border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-800 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                Working hours
              </h3>
              <p className="text-sm text-neutral-600 mb-4">Opening time must be before closing time for each day.</p>
              <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                {hours.map((row, index) => (
                  <div
                    key={row.day}
                    className={`flex flex-wrap items-center gap-4 p-4 border-b border-neutral-100 last:border-0 ${
                      hoursErrors[index] ? 'bg-amber-50/50' : 'bg-white'
                    }`}
                  >
                    <span className="w-32 text-sm font-medium text-neutral-800 capitalize">
                      {DAY_LABELS[row.day] || row.day}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!row.closed}
                        onChange={(e) => handleDayChange(index, 'closed', e.target.checked)}
                        className="rounded border-neutral-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-neutral-600">Closed</span>
                    </label>
                    {!row.closed && (
                      <div className="flex items-center gap-2">
                        <label className="sr-only">Opening time</label>
                        <input
                          type="time"
                          value={row.open?.[0]?.from || '08:00'}
                          onChange={(e) => handleDayChange(index, 'from', e.target.value)}
                          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                        />
                        <span className="text-neutral-400 font-medium">to</span>
                        <label className="sr-only">Closing time</label>
                        <input
                          type="time"
                          value={row.open?.[0]?.to || '18:00'}
                          onChange={(e) => handleDayChange(index, 'to', e.target.value)}
                          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                        />
                      </div>
                    )}
                    {hoursErrors[index] && (
                      <span className="text-sm text-amber-700 ml-0 w-full md:w-auto">{hoursErrors[index]}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-neutral-50/50 rounded-xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-neutral-800 tracking-tight">About section fields</h3>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add field
                </button>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                These appear in the About tab on your profile (e.g. Services, Payment methods, Policies).
              </p>
              <div className="space-y-4">
                {customFields.map((field) => (
                  <div key={field.id} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Custom field</span>
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        aria-label="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.title}
                      onChange={(e) => updateCustomField(field.id, 'title', e.target.value)}
                      placeholder="Label (e.g. Services, Payment methods)"
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none text-neutral-900"
                    />
                    <textarea
                      value={field.content}
                      onChange={(e) => updateCustomField(field.id, 'content', e.target.value)}
                      placeholder="Content shown in About..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none resize-none text-neutral-900"
                    />
                  </div>
                ))}
                {customFields.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
                    No custom fields yet. Click &quot;Add field&quot; to add information that will appear in your About tab.
                  </p>
                )}
              </div>
            </section>

            <div className="flex gap-3 pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
