(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RelayEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STAGES = ['Discovered', 'Registered', 'Proposal submitted', 'Shortlisted', 'Participation confirmed', 'Attended', 'Completed', 'Not shortlisted', 'Withdrawn', 'Cancelled'];
  const FIELDS = ['Registration deadline', 'Proposal deadline', 'Submission deadline', 'Final round', 'Workshop', 'Event date'];
  const CLOSED = ['Not shortlisted', 'Withdrawn', 'Cancelled', 'Completed'];
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  function today(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return y >= 2000 && y <= 2100 && date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
  }
  function dateParts(y, m, d) {
    const value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return validDate(value) ? value : null;
  }
  function normalizeUrl(value) {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) return '';
      for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
      url.hash = '';
      url.hostname = url.hostname.toLowerCase();
      url.pathname = url.pathname.replace(/\/$/, '') || '/';
      return url.toString();
    } catch { return ''; }
  }
  function parseDate(value, year = new Date().getFullYear()) {
    let m = String(value).match(/\b(20\d{2}|2100)-(\d{2})-(\d{2})\b/);
    if (m) return dateParts(+m[1], +m[2], +m[3]);
    const names = months.map(x => x.slice(0, 3) + '(?:' + x.slice(3) + ')?').join('|');
    m = String(value).match(new RegExp(`\\b(${names})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}|2100))?\\b`, 'i'));
    if (m) return dateParts(+(m[3] || year), months.findIndex(x => x.startsWith(m[1].toLowerCase().slice(0, 3))) + 1, +m[2]);
    m = String(value).match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${names})\\.?(?:,?\\s+(20\\d{2}|2100))?\\b`, 'i'));
    if (m) return dateParts(+(m[3] || year), months.findIndex(x => x.startsWith(m[2].toLowerCase().slice(0, 3))) + 1, +m[1]);
    // Numeric dates are accepted only when their day/month order is unambiguous.
    m = String(value).match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|2100)\b/);
    if (m && +m[1] > 12) return dateParts(+m[3], +m[2], +m[1]);
    if (m && +m[2] > 12) return dateParts(+m[3], +m[1], +m[2]);
    return null;
  }
  function extract(text, now = new Date()) {
    const data = { name: '', organizer: '', registrationId: '', url: '', venue: '', dates: {}, stage: null, warnings: [] };
    const name = text.match(/(?:event(?: name)?|opportunity)\s*:\s*([^\n.]{3,100})/i);
    const header = text.split('\n').map(x => x.trim()).find(x => /hackathon|challenge|competition|workshop|conference|summit|fest\b/i.test(x));
    data.name = name?.[1]?.trim() || (header && header.length < 100 ? header.replace(/^(?:subject|event)\s*:\s*/i, '').split(/[.!]|\s[—–]\s|\s(?:by|registration|proposal|submission|final round|shortlisted|deadline)\b/i)[0].trim() : '');
    data.organizer = text.match(/(?:organizer|organized by|hosted by)\s*:?\s*([^\n.]{3,80})/i)?.[1]?.trim() || '';
    data.registrationId = text.match(/(?:registration|application|team)\s*(?:id|#|number)\s*[:#-]?\s*([A-Z0-9][A-Z0-9_-]{3,40})/i)?.[1] || '';
    data.url = normalizeUrl(text.match(/https?:\/\/[^\s<>]+/i)?.[0]?.replace(/[.,;)]$/, '') || '');
    data.venue = text.match(/(?:venue|location)\s*:\s*([^\n.]{2,100})/i)?.[1]?.trim() || '';
    const labels = /registration\s+(?:deadline|closes?|ends?)|proposal\s+(?:submission\s+)?(?:deadline|due|closes?|ends?)|(?:submission|submit|deliverable)\s+(?:deadline|due|closes?|ends?)|final\s+round|\bfinals\b|workshop\s+(?:date|on)|(?:event|hackathon|competition)\s+(?:date|on)/gi;
    const hits = [...text.matchAll(labels)];
    const names = months.map(x => x.slice(0, 3) + '(?:' + x.slice(3) + ')?').join('|');
    const datePattern = new RegExp(`\\b(?:20\\d{2}|2100)-\\d{2}-\\d{2}\\b|\\b(?:${names})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+(?:20\\d{2}|2100))?\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${names})\\.?(?:,?\\s+(?:20\\d{2}|2100))?\\b|\\b\\d{1,2}[/-]\\d{1,2}[/-](?:20\\d{2}|2100)\\b`, 'gi');
    hits.forEach((hit, i) => {
      const label = hit[0].toLowerCase();
      const field = label.startsWith('registration') ? FIELDS[0] : label.startsWith('proposal') ? FIELDS[1] : /submission|submit|deliverable/.test(label) ? FIELDS[2] : /final/.test(label) ? FIELDS[3] : label.startsWith('workshop') ? FIELDS[4] : FIELDS[5];
      const fragment = text.slice(hit.index + hit[0].length, Math.min(hits[i + 1]?.index ?? text.length, hit.index + 200)).split(/[\n;!]/)[0];
      const candidates = [...fragment.matchAll(datePattern)];
      if (!candidates.length) return;
      const isRevision = /\b(?:from|extended|moved|changed|rescheduled|revised|now|to)\b/i.test(fragment);
      if (candidates.length > 1 && !isRevision) {
        data.warnings.push(`Multiple dates for ${field.toLowerCase()}; select the correct date.`);
        return;
      }
      const token = candidates.at(-1)[0];
      const value = parseDate(token, now.getFullYear());
      if (!value) { data.warnings.push(`Could not safely interpret “${token}”. Use a month name or YYYY-MM-DD.`); return; }
      if (!/20\d{2}|2100/.test(token)) data.warnings.push(`Year assumed as ${now.getFullYear()} for ${field.toLowerCase()}; please confirm.`);
      if (data.dates[field] && data.dates[field] !== value) data.warnings.push(`This message contains different values for ${field.toLowerCase()}; review both in the source.`);
      data.dates[field] = value;
    });
    if (/cancelled|canceled/i.test(text)) data.stage = 'Cancelled';
    else if (/not\s+shortlisted|not\s+selected|did not qualify/i.test(text)) data.stage = 'Not shortlisted';
    else if (/withdrawn|withdrawal confirmed/i.test(text)) data.stage = 'Withdrawn';
    else if (/shortlisted|you.{0,20}qualified|selected for (?:the )?(?:next|final)/i.test(text)) data.stage = 'Shortlisted';
    else if (/participation.{0,25}confirmed|attendance confirmed for/i.test(text)) data.stage = 'Participation confirmed';
    else if (/(?:submission|proposal).{0,25}(?:received|submitted|confirmed)|thank you for submitting/i.test(text)) data.stage = 'Proposal submitted';
    else if (/registration.{0,35}(?:confirmed|successful|complete)|you are registered/i.test(text)) data.stage = 'Registered';
    else if (/certificate of (?:completion|attendance)|event completed/i.test(text)) data.stage = 'Completed';
    return data;
  }
  function match(data, events, text) {
    return events.map(event => {
      let score = 0, reasons = [], mismatch = false;
      if (data.registrationId && event.registrationId) {
        if (data.registrationId.toLowerCase() === event.registrationId.toLowerCase()) { score += 100; reasons.push('Same registration ID'); }
        else { mismatch = true; reasons.push('Registration IDs differ'); }
      }
      if (data.url && event.url && normalizeUrl(data.url) === normalizeUrl(event.url)) { score += 100; reasons.push('Same event URL'); }
      if (text.toLowerCase().includes(event.name.toLowerCase())) { score += 65; reasons.push('Exact event name'); }
      else if (data.name) {
        const tokens = data.name.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !['hackathon', 'workshop', 'competition', 'challenge', 'conference'].includes(w));
        const common = tokens.filter(w => event.name.toLowerCase().includes(w)).length;
        score += Math.min(36, common * 18);
        if (common) reasons.push('Similar event name');
      }
      if (data.organizer && event.organizer && data.organizer.toLowerCase() === event.organizer.toLowerCase()) { score += 15; reasons.push('Same organizer'); }
      if (mismatch) score = Math.min(score, 25);
      return { id: event.id, score, reasons, mismatch };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  }
  function differences(event, data) {
    const result = [];
    for (const [field, value] of Object.entries(data.dates || {})) if (event.dates[field] !== value) result.push({ field, old: event.dates[field] || '', value });
    for (const field of ['venue', 'stage']) if (data[field] && event[field] !== data[field]) result.push({ field, old: event[field] || '', value: data[field] });
    for (const field of ['registrationId', 'url']) if (data[field] && !event[field]) result.push({ field, old: '', value: field === 'url' ? normalizeUrl(data[field]) : data[field] });
    return result;
  }
  function stale(event, proposal) {
    return differences(event, proposal.data).some(c => {
      const previous = proposal.changes?.find(x => x.field === c.field);
      return previous && previous.old !== c.old;
    }) || (proposal.changes || []).some(c => (FIELDS.includes(c.field) ? event.dates[c.field] : event[c.field] || '') !== c.old);
  }
  function apply(event, data, sourceId, at = new Date().toISOString()) {
    const changes = differences(event, data);
    for (const change of changes) {
      event.history.push({ ...change, source: sourceId, at });
      if (FIELDS.includes(change.field)) event.dates[change.field] = change.value;
      else event[change.field] = change.value;
      event.factSources ||= {};
      event.factSources[change.field] = sourceId;
    }
    if (changes.some(x => x.field === 'stage')) event.journey.push({ label: data.stage, date: at.slice(0, 10), source: sourceId });
    if (!event.sources.includes(sourceId)) event.sources.push(sourceId);
    return changes;
  }
  function fingerprint(text) { return text.toLowerCase().replace(/\s+/g, ' ').trim(); }
  function conflicts(events, after = today()) {
    const dates = events.filter(e => !CLOSED.includes(e.stage)).flatMap(e => Object.entries(e.dates).filter(([, d]) => validDate(d) && d >= after).map(([field, date]) => ({ event: e, field, date })));
    const result = [];
    for (let i = 0; i < dates.length; i++) for (let j = i + 1; j < dates.length; j++) {
      const a = dates[i], b = dates[j];
      if (a.event.id === b.event.id) continue;
      const gap = Math.abs((Date.parse(a.date) - Date.parse(b.date)) / 86400000);
      const deadlines = /deadline/i.test(a.field) && /deadline/i.test(b.field);
      if (gap === 0 || (deadlines && gap <= 2)) result.push({ a, b, gap, type: gap === 0 ? 'Same-day commitments' : 'Deadlines close together', detail: gap === 0 ? 'Dates coincide. Exact times are unknown, so this is a potential conflict.' : `${gap} day${gap === 1 ? '' : 's'} apart. Plan the workload for both submissions.` });
    }
    return result.sort((a, b) => a.gap - b.gap || a.a.date.localeCompare(b.a.date));
  }
  function icsEscape(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function fold(line) {
    let out = '', chunk = '', bytes = 0;
    for (const ch of line) {
      const length = new TextEncoder().encode(ch).length;
      if (bytes + length > 75) { out += chunk + '\r\n'; chunk = ' '; bytes = 1; }
      chunk += ch; bytes += length;
    }
    return out + chunk;
  }
  function calendar(events, now = new Date()) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusRelay//Living Timeline//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:CampusRelay'];
    for (const event of events.filter(e => e.stage !== 'Cancelled' && e.stage !== 'Withdrawn')) for (const [field, date] of Object.entries(event.dates).filter(([, d]) => validDate(d))) {
      const end = new Date(date + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
      lines.push('BEGIN:VEVENT', 'UID:' + encodeURIComponent(event.id + '-' + field) + '@campusrelay', 'DTSTAMP:' + now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), 'DTSTART;VALUE=DATE:' + date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + end.toISOString().slice(0, 10).replace(/-/g, ''), 'SEQUENCE:' + event.history.length, 'SUMMARY:' + icsEscape(event.name + ' · ' + field), 'DESCRIPTION:' + icsEscape('Participation: ' + event.stage + '\nDate reviewed in CampusRelay. Calendar export is a snapshot.'), 'LOCATION:' + icsEscape(event.venue || ''));
      if (normalizeUrl(event.url)) lines.push('URL:' + normalizeUrl(event.url));
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n';
  }
  function teamSummary(event) {
    return [event.name, event.organizer || 'Organizer not known', 'Stage: ' + event.stage, ...Object.entries(event.dates).map(([k, v]) => k + ': ' + v), event.venue ? 'Venue: ' + event.venue : '', normalizeUrl(event.url), 'Shared from CampusRelay · reviewed facts only'].filter(Boolean).join('\n');
  }
  function validateBackup(input) {
    if (!input || !Array.isArray(input.events) || !Array.isArray(input.sources) || !Array.isArray(input.review) || input.events.length > 500 || input.sources.length > 2000 || input.review.length > 500) throw new Error('This is not a supported CampusRelay backup.');
    const ids = new Set();
    for (const e of input.events) {
      if (typeof e.id !== 'string' || ids.has(e.id) || typeof e.name !== 'string' || !e.name.trim() || e.name.length > 200 || !STAGES.includes(e.stage) || !e.dates || typeof e.dates !== 'object' || !Array.isArray(e.sources) || !Array.isArray(e.journey) || !Array.isArray(e.history)) throw new Error('An event record is invalid.');
      ids.add(e.id);
      for (const [field, d] of Object.entries(e.dates)) if (!FIELDS.includes(field) || !validDate(d)) throw new Error('A milestone date is invalid.');
      if (e.url && !normalizeUrl(e.url)) throw new Error('An event URL is invalid.');
      for (const key of ['organizer', 'venue', 'registrationId', 'notes', 'category']) if (e[key] != null && typeof e[key] !== 'string') throw new Error('An event detail is invalid.');
      for (const j of e.journey) if (!j || typeof j.label !== 'string' || !validDate(j.date) || typeof j.source !== 'string') throw new Error('A participation record is invalid.');
      for (const h of e.history) if (!h || typeof h.field !== 'string' || typeof h.value !== 'string' || typeof h.at !== 'string' || !Number.isFinite(Date.parse(h.at)) || typeof h.source !== 'string') throw new Error('A change record is invalid.');
    }
    const sourceIds = new Set();
    for (const s of input.sources) {
      if (typeof s.id !== 'string' || sourceIds.has(s.id) || typeof s.text !== 'string' || s.text.length > 100000 || typeof s.title !== 'string' || typeof s.date !== 'string' || !Number.isFinite(Date.parse(s.date))) throw new Error('A source record is invalid.');
      for (const key of ['type', 'reliability', 'attachmentName']) if (s[key] != null && typeof s[key] !== 'string') throw new Error('A source detail is invalid.');
      sourceIds.add(s.id);
      if (s.attachment && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.attachment)) throw new Error('An attachment is invalid.');
    }
    for (const e of input.events) if (e.sources.some(id => !sourceIds.has(id))) throw new Error('An event references a missing source.');
    for (const r of input.review) {
      if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.reason !== 'string' || !r.data || !sourceIds.has(r.source) || (r.eventId && !ids.has(r.eventId))) throw new Error('A review record is invalid.');
      if (r.data.stage && !STAGES.includes(r.data.stage)) throw new Error('A proposed stage is invalid.');
      if (!r.data.dates || typeof r.data.dates !== 'object') throw new Error('Proposed dates are invalid.');
      for (const [field, date] of Object.entries(r.data.dates)) if (!FIELDS.includes(field) || !validDate(date)) throw new Error('A proposed date is invalid.');
      for (const key of ['name', 'organizer', 'registrationId', 'url', 'venue']) if (r.data[key] != null && typeof r.data[key] !== 'string') throw new Error('A proposed detail is invalid.');
      if (r.data.warnings && (!Array.isArray(r.data.warnings) || r.data.warnings.some(w => typeof w !== 'string'))) throw new Error('Proposed warnings are invalid.');
      if (r.rejectedFields && (!Array.isArray(r.rejectedFields) || r.rejectedFields.some(f => typeof f !== 'string'))) throw new Error('Review selections are invalid.');
    }
    return JSON.parse(JSON.stringify(input));
  }
  return { STAGES, FIELDS, CLOSED, uid, today, validDate, parseDate, normalizeUrl, extract, match, differences, stale, apply, fingerprint, conflicts, calendar, teamSummary, validateBackup };
});
