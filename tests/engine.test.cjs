const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../dist/engine.js');
const event = () => ({id:'one',name:'Northstar Hackathon 2026',organizer:'Northstar',stage:'Shortlisted',registrationId:'NST-2048',url:'https://example.com/northstar',dates:{'Proposal deadline':'2026-10-17'},sources:[],history:[],journey:[]});
test('date validation rejects rollover and ambiguous numeric dates', () => {
  assert.equal(E.parseDate('deadline 2026-10-20'), '2026-10-20');
  assert.equal(E.parseDate('17 Oct 2026'), '2026-10-17');
  assert.equal(E.parseDate('Oct 17, 2026'), '2026-10-17');
  assert.equal(E.parseDate('17/10/2026'), '2026-10-17');
  assert.equal(E.parseDate('10/11/2026'), null);
  assert.equal(E.parseDate('February 30, 2026'), null);
  assert.equal(E.validDate('2028-02-29'), true);
});
test('revised dates use the new value and keep field-specific boundaries', () => {
  const data = E.extract('Event: Northstar Hackathon 2026\nRegistration deadline: Oct 12, 2026. Proposal deadline extended from Oct 15, 2026 to Oct 17, 2026. Final round: 2026-10-24.');
  assert.equal(data.name,'Northstar Hackathon 2026');
  assert.deepEqual(data.dates,{'Registration deadline':'2026-10-12','Proposal deadline':'2026-10-17','Final round':'2026-10-24'});
});
test('uncertain dates produce warnings instead of invented facts', () => {
  const data = E.extract('Submission deadline: 10/11/2026. Proposal deadline: October 15 and October 17.');
  assert.equal(Object.keys(data.dates).length,0);
  assert.equal(data.warnings.length,2);
});
test('cancellation and negative selection override positive keywords', () => {
  assert.equal(E.extract('The final round for shortlisted teams has been cancelled.').stage,'Cancelled');
  assert.equal(E.extract('You are not shortlisted. Registration was confirmed.').stage,'Not shortlisted');
});
test('registration mismatch cannot become a high match by name alone', () => {
  const e = event();
  const ranks = E.match({name:e.name,registrationId:'OTHER-1234',dates:{}},[e],e.name);
  assert.ok(ranks[0].score < 60);
  assert.equal(ranks[0].mismatch,true);
  assert.equal(E.match({registrationId:e.registrationId},[e],'Your team qualified')[0].score,100);
});
test('applying changes preserves provenance and rejects stale expectations', () => {
  const e = event(), data = {dates:{'Proposal deadline':'2026-10-20'},stage:'Participation confirmed'};
  const proposal = {data,changes:E.differences(e,data)};
  E.apply(e,data,'source-1','2026-10-13T08:00:00Z');
  assert.equal(e.history[0].old,'2026-10-17');
  assert.equal(e.history[0].source,'source-1');
  assert.equal(e.factSources['Proposal deadline'],'source-1');
  assert.equal(e.journey[0].label,'Participation confirmed');
  assert.equal(E.stale(e,proposal),true);
});
test('conflicts exclude closed events and differentiate nearby deadlines', () => {
  const a = event(), b = {...event(),id:'two',name:'Second',dates:{'Submission deadline':'2026-10-19'}};
  assert.equal(E.conflicts([a,b],'2026-10-13')[0].type,'Deadlines close together');
  b.dates = {'Final round':'2026-10-17'};
  assert.equal(E.conflicts([a,b],'2026-10-13')[0].type,'Same-day commitments');
  b.stage = 'Cancelled'; assert.equal(E.conflicts([a,b],'2026-10-13').length,0);
});
test('calendar uses stable identities, escaped text and exclusive next-day end', () => {
  const e = event(); e.name = 'Build, Learn; Relay\nRound 1';
  const ics = E.calendar([e],new Date('2026-10-13T08:00:00Z'));
  assert.match(ics,/DTSTART;VALUE=DATE:20261017\r\nDTEND;VALUE=DATE:20261018/);
  assert.match(ics,/Build\\, Learn\\; Relay\\nRound 1/);
  const firstUid = ics.match(/UID:(.*)/)[1];
  e.dates['Proposal deadline'] = '2026-10-20';
  assert.equal(E.calendar([e]).match(/UID:(.*)/)[1],firstUid);
  e.stage = 'Cancelled'; assert.equal(E.calendar([e]).includes('BEGIN:VEVENT'),false);
});
test('team summary omits registration ID, notes and private communication', () => {
  const e = event(); e.notes = 'secret notes';
  assert.ok(!E.teamSummary(e).includes('NST-2048'));
  assert.ok(!E.teamSummary(e).includes('secret notes'));
});
test('new identity facts preserve their source and existing identifiers are retained', () => {
  const e = event(); e.registrationId = ''; e.url = '';
  E.apply(e,{dates:{},registrationId:'NEW-1001',url:'https://example.com/event'},'identity-source');
  assert.equal(e.history.length,2);
  assert.equal(e.factSources.registrationId,'identity-source');
  E.apply(e,{dates:{},registrationId:'DIFFERENT-2'},'other-source');
  assert.equal(e.registrationId,'NEW-1001');
});
test('backup validation rejects malformed references and unsafe links', () => {
  const e = event(), backup = {events:[e],sources:[],review:[]};
  assert.equal(E.validateBackup(backup).events.length,1);
  e.url = 'javascript:alert(1)'; assert.throws(() => E.validateBackup(backup));
  e.url = ''; e.sources = ['missing']; assert.throws(() => E.validateBackup(backup));
});
