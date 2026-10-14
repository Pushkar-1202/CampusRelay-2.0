'use strict';
const E = RelayEngine, KEY = 'campusrelay-v1', $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const fmt = value => E.validDate(value) ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : value || 'Not recorded';
const short = value => E.validDate(value) ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', {month:'short',day:'numeric'}) : value || 'Not recorded';
const tag = (value, color) => `<span class="tag ${color || (['Shortlisted','Completed','Participation confirmed'].includes(value) ? 'green' : value === 'Registered' ? 'blue' : E.CLOSED.includes(value) ? 'orange' : 'gray')}">${esc(value)}</span>`;
const source = id => state.sources.find(s => s.id === id), eventById = id => state.events.find(e => e.id === id);
let state = load(), view = 'overview', selected = null, filter = 'All', query = '', mode = 'milestones';
let dialogType = '', dialogId = '', attachment = null, restoreData = null, toastTimer;

function normalize(input) {
  input.events.forEach(e => { e.factSources ||= {}; e.venue ||= ''; e.notes ||= ''; });
  input.sources.forEach(s => { s.date ||= new Date().toISOString(); s.type ||= 'Student input'; s.reliability ||= 'Student-provided'; });
  input.review.forEach(r => { r.data.warnings ||= []; r.data.dates ||= {}; r.data.venue ||= ''; r.candidates ||= E.match(r.data, input.events, input.sources.find(s => s.id === r.source)?.text || ''); });
  return input;
}
function load() {
  try { const old = JSON.parse(localStorage.getItem(KEY)); if (old) return normalize(E.validateBackup(old)); } catch {}
  return normalize(createDemo());
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { toast('Browser storage is full or unavailable. Export a backup before closing.', true); return false; }
}
function save() { persist(); render(); }
function toast(text, error = false) {
  clearTimeout(toastTimer); $('toast').textContent = text; $('toast').className = 'visible' + (error ? ' error-toast' : '');
  toastTimer = setTimeout(() => $('toast').className = '', 5000);
}
function navigate(target, id = null) {
  view = target; selected = id; history.pushState(null, '', id ? '#event/' + encodeURIComponent(id) : '#' + target);
  render(); $('content').focus({preventScroll:true}); window.scrollTo({top:0});
}
function route() {
  const hash = location.hash.slice(1);
  let id = ''; try { id = hash.startsWith('event/') ? decodeURIComponent(hash.slice(6)) : ''; } catch {}
  if (id && eventById(id)) { selected = id; view = 'timeline'; }
  else { selected = null; view = ['overview','timeline','review','conflicts','sources','settings'].includes(hash) ? hash : 'home'; }
  render();
  if (view !== 'home' || hash === 'home') window.scrollTo({top:0});
}
const datesOf = e => Object.entries(e.dates).filter(([,d]) => E.validDate(d)).sort((a,b) => a[1].localeCompare(b[1]));
const nextDate = e => datesOf(e).find(([,d]) => d >= E.today());
function milestones() {
  return state.events.filter(e => !E.CLOSED.includes(e.stage)).flatMap(event => datesOf(event).filter(([,d]) => d >= E.today()).map(([field,date]) => ({event,field,date}))).sort((a,b) => a.date.localeCompare(b.date) || a.event.name.localeCompare(b.event.name));
}
function hero(title, description, eyebrow, actions = true) {
  return `<div class="eyebrow">${esc(eyebrow)}</div><div class="hero-row"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${actions ? '<div class="hero-actions"><button class="button ghost" data-action="edit">+ Add event</button><button class="button primary" data-action="import">Import update <span>→</span></button></div>' : ''}</div>`;
}
function eventCard(e) {
  const next = nextDate(e);
  return `<button class="event-card" data-action="event" data-id="${esc(e.id)}"><div class="event-top"><div><div class="event-title">${esc(e.name)}</div><div class="event-org">${esc(e.organizer || 'Organizer not known')} · ${esc(e.category || 'Event')}</div></div>${tag(e.stage)}</div><div class="event-bottom"><span>◷ ${next ? esc(next[0]) + ': <b>' + short(next[1]) + '</b>' : 'No upcoming milestone'}</span><span>▤ ${e.sources.length} sources</span>${e.history.length ? `<span class="due">↗ ${e.history.length} recorded changes</span>` : ''}</div></button>`;
}
function milestoneRows(list, limit = Infinity) {
  let previous = '';
  return list.slice(0, limit).map(m => {
    const group = m.date !== previous; previous = m.date;
    const distance = Math.round((Date.parse(m.date) - Date.parse(E.today())) / 86400000);
    return `${group ? `<div class="date-heading"><span>${fmt(m.date)}</span><small>${distance === 0 ? 'Today' : distance === 1 ? 'Tomorrow' : 'In ' + distance + ' days'}</small></div>` : ''}<button class="milestone-row" data-action="event" data-id="${esc(m.event.id)}"><span class="milestone-icon ${/deadline/.test(m.field) ? 'orange' : ''}">${/deadline/.test(m.field) ? '◷' : '↗'}</span><span class="milestone-text"><strong>${esc(m.field)}</strong><span>${esc(m.event.name)}</span></span>${tag(m.event.stage)}<span class="row-arrow">→</span></button>`;
  }).join('');
}
function activities() {
  return state.events.flatMap(e => [...e.history.map(h => ({title:h.field === 'stage' ? 'Participation updated' : h.field + (h.old ? ' changed' : ' added'),desc:e.name,at:h.at,id:e.id,change:true})), ...e.journey.filter(j => !e.history.some(h => h.field === 'stage' && h.source === j.source)).map(j => ({title:j.label,desc:e.name,at:j.date+'T12:00:00',id:e.id}))]).sort((a,b) => b.at.localeCompare(a.at)).slice(0,5);
}
function overview() {
  const upcoming = milestones(), clashes = E.conflicts(state.events), hour = new Date().getHours();
  return hero((hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + ', student ✳', 'Your next steps, with the evidence to back them up.', 'YOUR OPPORTUNITY RADAR') +
    `<div class="stats"><div class="stat"><div class="stat-top">Active opportunities <span class="stat-icon">◫</span></div><strong>${state.events.filter(e => !E.CLOSED.includes(e.stage)).length}</strong></div><div class="stat"><div class="stat-top">Next 7 days <span class="stat-icon">◷</span></div><strong>${upcoming.filter(m => Date.parse(m.date)-Date.parse(E.today()) < 7*86400000).length}<em>milestones</em></strong></div><button class="stat stat-button" data-action="nav" data-view="review"><div class="stat-top">Needs your review <span class="stat-icon">◇</span></div><strong>${state.review.length}</strong></button><button class="stat stat-button" data-action="nav" data-view="conflicts"><div class="stat-top">Schedule alerts <span class="stat-icon">⇄</span></div><strong>${clashes.length}</strong></button></div>` +
    `<div class="grid-main"><section class="panel"><div class="panel-head"><div><h2>Coming up on your timeline</h2><p>Reviewed milestones, in date order</p></div><button class="text-button" data-action="nav" data-view="timeline">View timeline →</button></div><div class="milestones">${milestoneRows(upcoming,5) || '<div class="empty"><strong>Your timeline is clear</strong>Add an event or import a dated communication.</div>'}</div></section><div>${clashes.length ? `<section class="panel alert-panel"><div class="alert-kicker">⇄ CONFLICTIQ</div><h3>${esc(clashes[0].type)}</h3><p>${esc(clashes[0].a.event.name)} and ${esc(clashes[0].b.event.name)}</p><small>${esc(clashes[0].detail)}</small><button class="text-button" data-action="nav" data-view="conflicts">Review schedule →</button></section>` : ''}<section class="panel"><div class="panel-head"><div><h2>Recent activity</h2><p>The record of what changed</p></div></div><div class="activity">${activities().map(a => `<button class="activity-row" data-action="event" data-id="${esc(a.id)}"><span class="activity-icon ${a.change ? 'orange' : ''}">${a.change ? '↗' : '✓'}</span><span class="activity-text"><strong>${esc(a.title)}</strong>${esc(a.desc)}<span class="activity-time">${fmt(a.at.slice(0,10))}</span></span></button>`).join('') || '<div class="empty">No activity yet.</div>'}</div></section></div></div>` +
    `<div class="banner"><div><h3>Follow a living event journey.</h3><p>Try a simulated deadline extension, then review its source and approve the change.</p></div><button data-action="demo">Try the demo →</button></div><div class="section-title"><div><h2>Your opportunities</h2><p>${state.events.length} event records in your workspace</p></div></div><div class="opportunity-grid">${state.events.slice(0,3).map(eventCard).join('')}</div>`;
}
function timeline() {
  const list = state.events.filter(e => (filter === 'All' || e.stage === filter) && (e.name+' '+e.organizer+' '+e.category).toLowerCase().includes(query.toLowerCase()));
  const upcoming = milestones().filter(m => list.some(e => e.id === m.event.id));
  return hero('Your living timeline', 'Every reviewed deadline and milestone, in the order it matters.', 'ONE JOURNEY. EVERY SOURCE.') +
    `<div class="timeline-tools"><label class="search-box"><span aria-hidden="true">⌕</span><input id="event-search" type="search" placeholder="Search events or organizers" aria-label="Search events or organizers" value="${esc(query)}"></label><select id="stage-filter" aria-label="Participation filter"><option>All</option>${E.STAGES.map(s => `<option ${filter === s ? 'selected' : ''}>${s}</option>`).join('')}</select><div class="segmented"><button data-action="mode" data-mode="milestones" class="${mode === 'milestones' ? 'active' : ''}" aria-pressed="${mode === 'milestones'}">Milestones</button><button data-action="mode" data-mode="events" class="${mode === 'events' ? 'active' : ''}" aria-pressed="${mode === 'events'}">Events</button></div></div>` +
    (mode === 'milestones' ? `<section class="panel"><div class="panel-head"><h2>${upcoming.length} upcoming milestones</h2><button class="text-button" data-action="calendar">Export calendar ↓</button></div><div class="milestones">${milestoneRows(upcoming) || '<div class="empty"><strong>No upcoming milestones</strong>Switch to Events to see records without upcoming dates.</div>'}</div></section>` : `<div class="opportunity-grid">${list.map(eventCard).join('') || '<div class="panel empty"><strong>No matching events</strong>Try a different search or status.</div>'}</div>`);
}
const changeValue = (field,value) => E.FIELDS.includes(field) ? fmt(value) : value || 'Not recorded';
function detail(e) {
  const clashes = E.conflicts(state.events).filter(c => c.a.event.id === e.id || c.b.event.id === e.id);
  return `<button class="back" data-action="nav" data-view="timeline">← Back to timeline</button><div class="detail-cover"><div class="eyebrow">${esc(e.category || 'EVENT')} · LIVING RECORD</div><h2>${esc(e.name)}</h2><p>${esc(e.organizer || 'Organizer not known')}</p><div class="detail-meta"><span>${esc(e.stage)}</span><span>${e.sources.length} sources</span><span>${e.history.length} recorded changes</span></div></div><div class="detail-toolbar"><button class="button ghost" data-action="edit" data-id="${esc(e.id)}">Edit event</button><button class="button primary" data-action="import" data-id="${esc(e.id)}">Import an update →</button><button class="button ghost" data-action="share" data-id="${esc(e.id)}">Team summary ↗</button><button class="button ghost" data-action="calendar" data-id="${esc(e.id)}">Calendar ↓</button></div>` +
    (clashes.length ? `<div class="notice warn">⇄ ${clashes.length} schedule alerts for this event. <button class="text-button" data-action="nav" data-view="conflicts">Review in ConflictIQ →</button></div>` : '') +
    `<div class="detail-grid"><div><section class="panel detail-section"><h3>Participation journey</h3><div class="journey">${e.journey.map((j,i) => `<div class="journey-row"><div class="journey-dot">${i === e.journey.length-1 ? '●' : '✓'}</div><div><strong>${esc(j.label)}</strong><p>${fmt(j.date)} · ${esc(source(j.source)?.title || 'Student action')}</p></div></div>`).join('')}</div>${!E.CLOSED.includes(e.stage) ? '<div class="next-step">Next steps begin with new evidence or an explicit update from you.</div>' : ''}</section><section class="panel detail-section" style="margin-top:20px"><h3>Change history</h3>${e.history.length ? e.history.slice().reverse().map(h => `<div class="change-box"><strong>${esc(h.field === 'stage' ? 'PARTICIPATION UPDATED' : h.field.toUpperCase() + (h.old ? ' UPDATED' : ' ADDED'))}</strong><div class="change-values">${h.old ? `<s>${esc(changeValue(h.field,h.old))}</s><span>→</span>` : ''}<span>${esc(changeValue(h.field,h.value))}</span></div><p>${esc(source(h.source)?.title || 'Student action')} · ${fmt(h.at.slice(0,10))}</p><button class="text-button source-link" data-action="source" data-id="${esc(h.source)}">View supporting source →</button></div>`).join('') : '<div class="empty">No changes recorded yet.</div>'}</section></div><div><section class="panel detail-section"><h3>Current facts</h3><div class="fact-row"><span>Participation</span><strong>${esc(e.stage)}</strong></div>${datesOf(e).map(([k,v]) => `<div class="fact-row"><span>${esc(k)}</span><strong>${fmt(v)}${e.factSources[k] ? `<button class="fact-evidence" data-action="source" data-id="${esc(e.factSources[k])}" aria-label="Source for ${esc(k)}">▤</button>` : ''}</strong></div>`).join('')}<div class="fact-row"><span>Venue</span><strong>${esc(e.venue || 'Not known')}</strong></div><div class="fact-row"><span>Registration ID</span><strong>${esc(e.registrationId || 'Not known')}</strong></div>${E.normalizeUrl(e.url) ? `<div class="fact-row"><span>Event page</span><strong><a href="${esc(E.normalizeUrl(e.url))}" target="_blank" rel="noopener noreferrer">Open official link ↗</a></strong></div>` : ''}${e.notes ? `<div class="event-notes"><h4>Your notes</h4><p>${esc(e.notes)}</p></div>` : ''}</section><section class="panel detail-section" style="margin-top:20px"><h3>Evidence & sources</h3>${e.sources.map(id => sourceRow(source(id))).join('')}<div class="notice">Reviewed means you approved the fact. Source authenticity has not been independently verified.</div></section></div></div>`;
}
function reviewView() {
  return hero('Updates that need you', 'Confirm the event, correct extracted facts, and choose what to apply.', 'RELAYMATCH REVIEW') + '<div class="notice">Every imported update waits for review. A strong match identifies an event; it does not authenticate the source.</div>' +
    (state.review.length ? state.review.map(r => `<section class="panel review-card"><div class="event-top"><div><h3>${esc(r.title)}</h3><p>${esc(r.reason)}</p></div>${tag(r.eventId ? r.matchLabel : 'Select event',r.eventId ? 'green' : 'orange')}</div><div class="review-preview"><span>${r.eventId ? esc(eventById(r.eventId)?.name) : 'No event chosen yet'}</span><strong>${r.eventId ? (r.changes?.length || 0)+' proposed changes' : 'New event or existing match'}</strong></div>${r.data.warnings?.length ? `<p class="warning-text">${esc(r.data.warnings[0])}</p>` : ''}<div class="review-actions"><button class="button primary" data-action="review" data-id="${esc(r.id)}">Review & edit →</button><button class="button ghost" data-action="dismiss" data-id="${esc(r.id)}">Dismiss proposal</button><button class="text-button" data-action="source" data-id="${esc(r.source)}">View source</button></div></section>`).join('') : '<section class="panel empty"><strong>All caught up ✓</strong>Imported communications will wait here.</section>');
}
function conflictsView() {
  const alerts = E.conflicts(state.events);
  return hero('Make room for what matters', 'Known dates help you spot crowded days before they arrive.', 'CONFLICTIQ',false) + '<div class="notice">Same-day events are potential conflicts because exact times are not recorded. Nearby deadlines are workload alerts. Classes and personal commitments are included only when you add them as events.</div>' +
    (alerts.length ? alerts.map(c => `<section class="panel conflict-card"><div class="conflict-heading">${tag(c.type,c.gap === 0 ? 'orange' : 'blue')}<strong>${c.gap === 0 ? fmt(c.a.date) : short(c.a.date)+' & '+short(c.b.date)}</strong></div><div class="conflict-events">${[c.a,c.b].map(m => `<button data-action="event" data-id="${esc(m.event.id)}"><strong>${esc(m.event.name)}</strong><span>${esc(m.field)} · ${fmt(m.date)}</span><small>Open event →</small></button>`).join('')}</div><p>${esc(c.detail)}</p></section>`).join('') : '<section class="panel empty"><strong>No schedule alerts</strong>No known dates overlap or create nearby deadlines.</section>');
}
function sourceRow(s) {
  return s ? `<button class="source-row" data-action="source" data-id="${esc(s.id)}"><span class="source-glyph">▤</span><span class="source-info"><strong>${esc(s.title)}</strong><span>${esc(s.type)} · ${fmt(s.date.slice(0,10))}</span><small>${esc(s.reliability)}</small></span><span class="row-arrow">→</span></button>` : '';
}
function sourcesView() {
  return hero('Every fact has a beginning', 'Read the communication behind a milestone or a change.', 'EVIDENCE LIBRARY') + '<div class="notice">Sample and simulated messages are labeled. Your original imported text is preserved in this browser.</div><section class="panel detail-section">' + (state.sources.slice().reverse().map(sourceRow).join('') || '<div class="empty">No sources yet.</div>') + '</section>';
}
function settingsView() {
  return hero('Your workspace, your records', 'Keep a backup, move your timeline, or start with your own opportunities.', 'WORKSPACE',false) + `<div class="settings-grid"><section class="panel detail-section"><h3>Calendar</h3><p class="settings-description">Download reviewed milestones as an .ics calendar file. This is a snapshot: export again after dates change.</p><button class="button primary" data-action="calendar">Download calendar ↓</button></section><section class="panel detail-section"><h3>Backup & restore</h3><p class="settings-description">Save event records, original communications, and pending reviews. Restore an exported backup in another browser.</p><div class="review-actions"><button class="button primary" data-action="backup">Export backup ↓</button><label class="button ghost file-label">Restore backup<input type="file" id="backup-file" accept=".json,application/json" class="sr-only"></label></div></section><section class="panel detail-section"><h3>Start fresh</h3><p class="settings-description">Begin with an empty workspace or reset the sample data. Export a backup first to keep your records.</p><div class="review-actions"><button class="button ghost" data-action="clear">Empty workspace</button><button class="button ghost" data-action="reset">Reset demo</button></div></section><section class="panel detail-section"><h3>What is connected?</h3><p class="settings-description">Text analysis runs in this browser. Image attachments are saved as evidence, with text entered by you. This version has no email forwarding, AI service, live calendar feed, or shared team database.</p>${tag('Browser-local prototype','gray')}</section></div>`;
}
function render() {
  window.CampusLanding?.setVisible(view === 'home');
  if (view === 'home') return;
  $('review-count').textContent = state.review.length;
  document.querySelectorAll('.nav-item').forEach(b => { const active = b.dataset.view === view; b.classList.toggle('active',active); b.setAttribute('aria-current',active ? 'page' : 'false'); });
  $('crumb-current').textContent = selected ? 'Event details' : ({overview:'Overview',timeline:'Living timeline',review:'Review queue',sources:'Sources',conflicts:'ConflictIQ',settings:'Workspace'}[view]);
  $('today-label').textContent = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  $('content').innerHTML = selected && eventById(selected) ? detail(eventById(selected)) : ({overview,timeline,review:reviewView,sources:sourcesView,conflicts:conflictsView,settings:settingsView}[view] || overview)();
}
function openDialog(type,title,content,actions='',id='',wide=false) {
  dialogType = type; dialogId = id; $('workspace-dialog').classList.toggle('wide-dialog',wide);
  $('dialog-content').innerHTML = `<div class="modal-head"><div><div class="eyebrow">CAMPUSRELAY</div><h2 id="dialog-title">${esc(title)}</h2></div><button class="close" data-action="close" aria-label="Close dialog">×</button></div>${content}<div class="form-error" id="form-error" role="alert"></div>${actions ? `<div class="modal-actions">${actions}</div>` : ''}`;
  if (!$('workspace-dialog').open) $('workspace-dialog').showModal();
}
const closeDialog = () => { $('workspace-dialog').close(); attachment = null; dialogType = ''; };
const cancelButton = '<button class="button ghost" data-action="close">Cancel</button>';
const field = (label,id,value='',type='text',extra='') => `<label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" value="${esc(value)}" ${extra}>`;
function showImport(id='') {
  attachment = null;
  openDialog('import','Import a communication',`<p>Paste an email, announcement, or shared message. Nothing changes until you review it.</p><div class="import-examples"><span>Simulated examples:</span><button data-action="sample" data-sample="deadline">Deadline extension</button><button data-action="sample" data-sample="stage">Status update</button><button data-action="sample" data-sample="ambiguous">Uncertain match</button></div><label for="source-type">Source type</label><select id="source-type"><option>Email / forwarded message</option><option>Poster or screenshot</option><option>Organizer announcement</option><option>Shared message</option><option>Event URL</option></select>${field('Source label','source-title','','text','placeholder="e.g. Organizer email, October 13" maxlength="150"')}<label for="source-text">Communication text</label><textarea id="source-text" rows="7" maxlength="20000" placeholder="Event: Northstar Hackathon 2026&#10;Registration ID: NST-2048&#10;Proposal deadline moved from October 17, 2026 to October 20, 2026."></textarea><label class="attachment-drop" for="source-file">▧ Attach a poster or load a text / .eml file<input id="source-file" type="file" accept="image/png,image/jpeg,image/webp,.txt,.eml,text/plain" class="sr-only"></label><div id="attachment-preview"></div><div class="modal-tip">Text extraction uses date and keyword rules. Image files are evidence attachments; paste their text for analysis. URLs are saved as references and are not fetched.</div>`,cancelButton+'<button class="button primary" data-action="analyze">Analyze & review →</button>',id);
}
function sample(kind) {
  const e = eventById(dialogId) || eventById('e1') || state.events[0];
  if (!e) return toast('Add an event first or reset the demo in Workspace.');
  $('source-title').value = 'Simulated ' + (kind === 'deadline' ? 'deadline extension' : kind === 'stage' ? 'participation update' : 'ambiguous message');
  $('source-type').value = 'Organizer announcement';
  $('source-text').value = kind === 'ambiguous' ? 'Congratulations, your team has been shortlisted for the final round. Final round: October 24, 2026. This is a simulated message.' : `Event: ${e.name}\n${e.registrationId ? 'Registration ID: '+e.registrationId+'\n' : ''}${kind === 'deadline' ? 'Proposal deadline moved from '+(e.dates['Proposal deadline'] || '2026-10-17')+' to 2026-10-20.' : 'Your participation is confirmed. Final round: October 24, 2026.'}\nThis is a simulated organizer message for testing CampusRelay.`;
}
function analyze() {
  const text = $('source-text').value.trim(), type = $('source-type').value, title = $('source-title').value.trim() || type+' · '+short(E.today());
  if (text.length < 20) return formError('Paste at least a sentence of event information.');
  if (state.sources.some(s => E.fingerprint(s.text) === E.fingerprint(text))) return formError('This communication is already in your source library.');
  const data = E.extract(text), candidates = E.match(data,state.events,text), best = candidates[0];
  const clear = best && best.score >= 60 && !best.mismatch && (!candidates[1] || best.score-candidates[1].score >= 25);
  const s = {id:E.uid('source'),title,type,date:new Date().toISOString(),text,reliability:/simulated/i.test(text) && /simulated/i.test(title) ? 'Simulated update' : 'Student-provided',attachment:attachment?.data || '',attachmentName:attachment?.name || ''};
  const r = {id:E.uid('review'),title,source:s.id,eventId:clear ? best.id : null,candidates,matchLabel:clear ? 'High match' : 'Uncertain match',reason:clear ? best.reasons.join(' · ') : 'Select the correct event or create a new opportunity.',data,changes:clear ? E.differences(eventById(best.id),data) : [],created:new Date().toISOString()};
  state.sources.push(s); state.review.push(r); save(); showReview(r.id);
}
function factsForm(data) {
  return `<div class="form-grid"><div>${field('Event name','fact-name',data.name || '','text','maxlength="120"')}</div><div>${field('Organizer','fact-organizer',data.organizer || '','text','maxlength="100"')}</div></div><div class="form-grid"><div>${field('Registration / application ID','fact-id',data.registrationId || '','text','maxlength="50"')}</div><div>${field('Event URL','fact-url',data.url || '','url','placeholder="https://…"')}</div></div>${field('Venue','fact-venue',data.venue || '','text','maxlength="150"')}<label for="fact-stage">Participation stage</label><select id="fact-stage"><option value="">No stage update</option>${E.STAGES.map(s => `<option ${data.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select><div class="dates-form">${E.FIELDS.map((f,i) => `<div>${field(f,'fact-date-'+i,data.dates?.[f] || '','date')}</div>`).join('')}</div>`;
}
function collectFacts() {
  const data = {name:$('fact-name').value.trim(),organizer:$('fact-organizer').value.trim(),registrationId:$('fact-id').value.trim(),url:$('fact-url').value.trim(),venue:$('fact-venue').value.trim(),stage:$('fact-stage').value || null,dates:{},warnings:[]};
  if (data.url && !E.normalizeUrl(data.url)) throw new Error('Use a valid http or https event URL.');
  data.url = E.normalizeUrl(data.url);
  E.FIELDS.forEach((f,i) => { const date = $('fact-date-'+i).value; if (date) { if (!E.validDate(date)) throw new Error('Check the date for '+f.toLowerCase()+'.'); data.dates[f] = date; } });
  return data;
}
function diffPreview(event,data,rejected = []) {
  if (!event) return '<div class="notice">This will create a new opportunity from the edited facts above. Give it a clear event name.</div>';
  const changes = E.differences(event,data);
  return `<h3 class="diff-title">Proposed changes · ${changes.length}</h3>${changes.length ? changes.map(c => `<label class="diff-row"><input type="checkbox" name="accepted-field" value="${esc(c.field)}" ${rejected.includes(c.field) ? '' : 'checked'}><span><strong>${esc(c.field === 'stage' ? 'Participation' : c.field)}</strong><span>${esc(changeValue(c.field,c.old))} <b>→</b> ${esc(changeValue(c.field,c.value))}</span></span></label>`).join('') : '<div class="notice">No new date or stage changes. Approving attaches the communication as additional evidence.</div>'}`;
}
function showReview(id) {
  const r = state.review.find(x => x.id === id); if (!r) return;
  const s = source(r.source), event = r.eventId && eventById(r.eventId);
  r.changes = event ? E.differences(event,r.data) : [];
  const regression = event && r.data.stage && E.STAGES.indexOf(r.data.stage) < E.STAGES.indexOf(event.stage);
  openDialog('review','Review extracted information',`<p>Read the source, choose the event, and correct uncertain details.</p><details class="source-excerpt" open><summary>Original communication · ${esc(s?.title)}</summary><pre>${esc(s?.text || '')}</pre>${s?.attachment ? `<img class="source-image" src="${esc(s.attachment)}" alt="Source attachment">` : ''}</details>${r.data.warnings?.length ? `<div class="notice warn">${r.data.warnings.map(esc).join('<br>')}</div>` : ''}${regression ? '<div class="notice warn">This stage is earlier than the current stage. Confirm that this message applies to the current round.</div>' : ''}<label for="match-event">Where does this communication belong?</label><select id="match-event"><option value="">Create a new event</option>${state.events.map(e => `<option value="${esc(e.id)}" ${r.eventId === e.id ? 'selected' : ''}>${esc(e.name)}${r.candidates.find(c => c.id === e.id)?.mismatch ? ' · different registration ID' : ''}</option>`).join('')}</select><div class="match-evidence">${event ? esc(r.candidates.find(c => c.id === event.id)?.reasons.join(' · ') || 'Selected by you') : 'No event is merged until you select it.'}</div><details class="editable-facts" ${event ? '' : 'open'}><summary>Edit extracted facts</summary>${factsForm(r.data)}</details><div id="proposal-diff">${diffPreview(event,r.data,r.rejectedFields)}</div><div class="notice">Source: ${esc(s?.reliability)}. Approval records your review; it does not authenticate the organizer.</div>`,'<button class="button ghost" data-action="close">Keep for later</button><button class="button primary" data-action="apply-review">Approve selected facts →</button>',id,true);
}
function updateDraft() {
  const r = state.review.find(x => x.id === dialogId); if (!r) return;
  try { r.data = collectFacts(); r.eventId = $('match-event').value || null; r.matchLabel = 'Student selected'; r.changes = r.eventId ? E.differences(eventById(r.eventId),r.data) : []; $('proposal-diff').innerHTML = diffPreview(r.eventId && eventById(r.eventId),r.data,r.rejectedFields); document.querySelector('.match-evidence').textContent = r.eventId ? 'You selected '+eventById(r.eventId).name+'. Confirm this is the correct opportunity.' : 'No event is merged until you select it.'; persist(); formError(''); }
  catch (error) { formError(error.message); }
}
function applyReview() {
  const r = state.review.find(x => x.id === dialogId); if (!r) return;
  let data; try { data = collectFacts(); } catch (error) { return formError(error.message); }
  const event = eventById($('match-event').value);
  if (event && E.stale(event,r)) { r.data = data; r.eventId = event.id; showReview(r.id); return formError('The event changed while this review was open. Review the refreshed comparison and approve again.'); }
  if (!event && !data.name) return formError('Enter an event name before creating the opportunity.');
  if (!event && state.events.some(e => e.name.toLowerCase() === data.name.toLowerCase())) return formError('An event with this name already exists. Select it above to avoid a duplicate.');
  let id;
  if (event) {
    const accepted = new Set([...document.querySelectorAll('input[name="accepted-field"]:checked')].map(el => el.value));
    E.apply(event,{...data,dates:Object.fromEntries(Object.entries(data.dates).filter(([k]) => accepted.has(k))),stage:accepted.has('stage') ? data.stage : null,venue:accepted.has('venue') ? data.venue : '',registrationId:accepted.has('registrationId') ? data.registrationId : '',url:accepted.has('url') ? data.url : ''},r.source); id = event.id;
  } else { const e = makeEvent(data,r.source); state.events.unshift(e); id = e.id; }
  state.review = state.review.filter(x => x.id !== r.id); closeDialog(); persist(); navigate('timeline',id); toast('Source saved and selected facts applied.');
}
function makeEvent(data,sourceId) {
  const stage = data.stage || 'Discovered';
  return {id:E.uid('event'),name:data.name,organizer:data.organizer || '',category:/workshop/i.test(data.name) ? 'Workshop' : /hackathon/i.test(data.name) ? 'Hackathon' : 'Event',stage,dates:data.dates,url:E.normalizeUrl(data.url),venue:data.venue || '',registrationId:data.registrationId || '',notes:'',sources:[sourceId],factSources:Object.fromEntries([...Object.keys(data.dates),'stage',...(data.venue ? ['venue'] : [])].map(k => [k,sourceId])),history:[],journey:[{label:stage,date:E.today(),source:sourceId}],created:new Date().toISOString()};
}
function showEditor(id) {
  const event = id && eventById(id);
  openDialog('editor',event ? 'Edit opportunity' : 'Add an opportunity',`<p>Record the facts you know. Blank dates stay unknown.</p>${factsForm(event || {dates:{},stage:'Discovered'})}<label for="event-category">Category</label><select id="event-category">${['Hackathon','Competition','Workshop','Conference','College event','Personal commitment','Event'].map(c => `<option ${(event?.category || 'Event') === c ? 'selected' : ''}>${c}</option>`).join('')}</select><label for="event-notes">Personal notes</label><textarea id="event-notes" maxlength="2000" rows="3">${esc(event?.notes || '')}</textarea><div class="modal-tip">Manual changes preserve history as student actions. To remove a known date, leave its field blank.</div>`,cancelButton+'<button class="button primary" data-action="save-event">Save event →</button>',id || '',true);
}
function saveEvent() {
  let data; try { data = collectFacts(); } catch (error) { return formError(error.message); }
  if (!data.name) return formError('Enter an event name.');
  const current = dialogId && eventById(dialogId);
  if (state.events.some(e => e.id !== current?.id && e.name.toLowerCase() === data.name.toLowerCase())) return formError('An event with this name already exists.');
  data.stage ||= current?.stage || 'Discovered';
  const s = {id:E.uid('source'),title:current ? 'Manual event edit' : 'Manually added event',type:'Student action',date:new Date().toISOString(),reliability:'Student-provided',text:['Event: '+data.name,'Organizer: '+data.organizer,'Stage: '+data.stage,...Object.entries(data.dates).map(([f,v]) => f+': '+v),'Venue: '+data.venue].join('\n')};
  state.sources.push(s); let id;
  if (current) {
    E.apply(current,data,s.id);
    for (const f of Object.keys(current.dates)) if (!data.dates[f]) { current.history.push({field:f,old:current.dates[f],value:'',source:s.id,at:s.date}); delete current.dates[f]; delete current.factSources[f]; }
    for (const key of ['name','organizer','registrationId','url','venue']) if ((current[key] || '') !== data[key]) { current.history.push({field:key,old:current[key] || '',value:data[key],source:s.id,at:s.date}); current[key] = data[key]; }
    id = current.id;
  } else { const e = makeEvent(data,s.id); state.events.unshift(e); id = e.id; }
  const e = eventById(id); e.category = $('event-category').value; e.notes = $('event-notes').value.trim();
  closeDialog(); persist(); navigate('timeline',id); toast('Opportunity saved.');
}
function showSource(id) {
  const s = source(id); if (!s) return toast('Source unavailable.',true);
  openDialog('source',s.title,`<div class="source-dialog-meta">${tag(s.reliability,/sample|simulated/i.test(s.reliability) ? 'blue' : 'gray')}<span>${esc(s.type)} · ${fmt(s.date.slice(0,10))}</span></div><pre class="source-document">${esc(s.text)}</pre>${s.attachment ? `<img class="source-image" src="${esc(s.attachment)}" alt="${esc(s.attachmentName || 'Source attachment')}">` : ''}<div class="notice">${/sample|simulated/i.test(s.reliability) ? 'This is demonstration data, not an authenticated organizer communication.' : 'Student-provided source. Confirm important facts with the organizer when needed.'}</div>`,'<button class="button primary" data-action="close">Done</button>',id,true);
}
function showShare(id) {
  const e = eventById(id); if (!e) return;
  openDialog('share','Share the event facts','<p>Copy the current event facts and participation stage for your teammates.</p><pre class="source-document">'+esc(E.teamSummary(e))+'</pre><div class="notice">Original emails, registration IDs, personal notes, and attachments are excluded.</div>','<button class="button ghost" data-action="share-download">Download text ↓</button><button class="button primary" data-action="copy-summary">Copy summary</button>',id);
}
function download(name,text,type) {
  const url = URL.createObjectURL(new Blob([text],{type})), link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
const formError = text => $('form-error').textContent = text;
async function handleFile(file) {
  if (!file) return;
  if (file.size > 1500000) return formError('Use a file smaller than 1.5 MB to save it in this browser.');
  if (/\.(txt|eml)$/i.test(file.name)) { $('source-text').value = (await file.text()).slice(0,20000); $('source-title').value ||= file.name; return; }
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) return formError('Attach a PNG, JPEG, WebP, text, or .eml file.');
  const reader = new FileReader(); reader.onload = () => { attachment = {data:reader.result,name:file.name}; $('attachment-preview').innerHTML = `<img src="${esc(reader.result)}" alt="Poster preview"><span>${esc(file.name)} · add its text above</span>`; $('source-type').value = 'Poster or screenshot'; $('source-title').value ||= file.name; }; reader.readAsDataURL(file);
}
async function handleBackup(file) {
  if (!file) return;
  if (file.size > 10000000) return toast('Backup exceeds the 10 MB limit.',true);
  try { restoreData = normalize(E.validateBackup(JSON.parse(await file.text()))); openDialog('restore','Restore this workspace?',`<p>This backup contains ${restoreData.events.length} events, ${restoreData.sources.length} sources, and ${restoreData.review.length} pending reviews.</p><div class="notice warn">Restoring replaces this browser workspace. Download a backup first to keep the current records.</div>`,'<button class="button ghost" data-action="backup">Backup current data ↓</button>'+cancelButton+'<button class="button primary" data-action="restore-confirm">Restore workspace</button>'); }
  catch (error) { toast(error.message || 'Backup could not be read.',true); }
}
function confirmReset(demo) { openDialog(demo ? 'reset' : 'clear',demo ? 'Reset the demonstration?' : 'Start an empty workspace?','<p>This replaces the current browser records. Export a backup first to keep them.</p>','<button class="button ghost" data-action="backup">Export backup ↓</button>'+cancelButton+`<button class="button primary" data-action="reset-confirm" data-demo="${demo}">${demo ? 'Reset demo' : 'Start fresh'}</button>`); }
document.addEventListener('click',async event => {
  const t = event.target.closest('[data-action]'); if (!t) return;
  const action = t.dataset.action, id = t.dataset.id;
  if (action === 'nav') navigate(t.dataset.view);
  else if (action === 'event') navigate('timeline',id);
  else if (action === 'import') showImport(id);
  else if (action === 'demo') { showImport(); sample('deadline'); }
  else if (action === 'sample') sample(t.dataset.sample);
  else if (action === 'close') closeDialog();
  else if (action === 'analyze') analyze();
  else if (action === 'review') showReview(id);
  else if (action === 'apply-review') applyReview();
  else if (action === 'edit') showEditor(id);
  else if (action === 'save-event') saveEvent();
  else if (action === 'source') showSource(id);
  else if (action === 'dismiss') { state.review = state.review.filter(r => r.id !== id); save(); toast('Proposal dismissed. The source remains in the library.'); }
  else if (action === 'mode') { mode = t.dataset.mode; render(); }
  else if (action === 'calendar') { download('campusrelay.ics',E.calendar(id ? [eventById(id)] : state.events),'text/calendar;charset=utf-8'); toast('Calendar snapshot downloaded. Export again after dates change.'); }
  else if (action === 'backup') { download('campusrelay-backup-'+E.today()+'.json',JSON.stringify({...state,version:2,exportedAt:new Date().toISOString()},null,2),'application/json'); toast('Workspace backup downloaded.'); }
  else if (action === 'restore-confirm' && restoreData) { state = restoreData; restoreData = null; closeDialog(); save(); navigate('overview'); toast('Workspace restored.'); }
  else if (action === 'clear' || action === 'reset') confirmReset(action === 'reset');
  else if (action === 'reset-confirm') { state = t.dataset.demo === 'true' ? normalize(createDemo()) : {events:[],sources:[],review:[]}; closeDialog(); save(); navigate('overview'); toast('Workspace ready.'); }
  else if (action === 'share') showShare(id);
  else if (action === 'share-download') download('campusrelay-team-summary.txt',E.teamSummary(eventById(dialogId)),'text/plain;charset=utf-8');
  else if (action === 'copy-summary') { try { await navigator.clipboard.writeText(E.teamSummary(eventById(dialogId))); toast('Team summary copied.'); } catch { formError('Clipboard access unavailable. Use Download text instead.'); } }
});
document.addEventListener('input',event => { if (event.target.id === 'event-search') { const start = event.target.selectionStart, end = event.target.selectionEnd; query = event.target.value; render(); $('event-search').focus(); $('event-search').setSelectionRange(start,end); } });
document.addEventListener('change',event => {
  if (dialogType === 'review' && event.target.name === 'accepted-field') { const r = state.review.find(x => x.id === dialogId); r.rejectedFields = [...document.querySelectorAll('input[name="accepted-field"]:not(:checked)')].map(el => el.value); persist(); }
  if (event.target.id === 'stage-filter') { filter = event.target.value; render(); }
  if (event.target.id === 'source-file') handleFile(event.target.files[0]);
  if (event.target.id === 'backup-file') handleBackup(event.target.files[0]);
  if (dialogType === 'review' && (event.target.id === 'match-event' || event.target.id.startsWith('fact-'))) updateDraft();
});
window.addEventListener('popstate',route);
window.addEventListener('hashchange',route);
window.addEventListener('storage',event => { if (event.key === KEY && event.newValue) { try { state = normalize(E.validateBackup(JSON.parse(event.newValue))); render(); toast('Workspace updated in another tab.'); } catch {} } });
route();



