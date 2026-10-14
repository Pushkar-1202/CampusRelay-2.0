// Opt-in local evaluation. No emails are downloaded or sent anywhere.
const fs=require('node:fs'),path=require('node:path'),E=require('../src/engine.js');
const input=process.argv[2];if(!input){console.error('Usage: npm run evaluate -- evaluation/private/messages.json [report.json]');process.exit(1);}
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows)||rows.length<20||rows.length>30)throw Error('Provide 20–30 independently labeled, redacted real messages.');
for(const r of rows)if(r.provenance!=='real-redacted'||r.consent!==true||!r.id||!r.text||!r.expected||!Object.hasOwn(r.expected,'name')||!Object.hasOwn(r.expected,'stage')||!r.expected.dates||!/^\d{4}-\d{2}-\d{2}$/.test(r.receivedDate))throw Error('Each example needs provenance, consent, receivedDate and explicit name/stage/dates labels.');
const metric={name:{correct:0,total:rows.length},stage:{correct:0,total:rows.length},dates:{correct:0,total:rows.length}};
const canonical=x=>JSON.stringify(Object.fromEntries(Object.entries(x||{}).sort(([a],[b])=>a.localeCompare(b))));
const errors=[];
for(const r of rows){const p=E.extract(r.text,new Date(r.receivedDate+'T12:00:00Z')),ok={name:(p.name||'')===(r.expected.name||''),stage:(p.stage||null)===(r.expected.stage||null),dates:canonical(p.dates)===canonical(r.expected.dates)};for(const k of Object.keys(metric))if(ok[k])metric[k].correct++;if(Object.values(ok).some(v=>!v))errors.push({id:r.id,failedFields:Object.keys(ok).filter(k=>!ok[k])});}
const report={dataset:'Consented, redacted real messages supplied locally',sampleSize:rows.length,method:'Exact event-name match; exact stage match; exact full date-map match including extra or missing dates. Empty fields count only if labeled empty.',metrics:Object.fromEntries(Object.entries(metric).map(([k,v])=>[k,{...v,percent:Math.round(10000*v.correct/v.total)/100}])),errors,limitations:'Small convenience sample, not a general accuracy guarantee. No raw communication text in this report.'};
const destination=process.argv[3]||'reports/private/real-message-evaluation.json';fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
