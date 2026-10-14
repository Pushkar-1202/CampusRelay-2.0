'use strict';
(() => {
  const originalOverview=overview, originalTimeline=timeline, originalDetail=detail;
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let weekOffset=0, chosenDay=E.today(), calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const allMilestones=()=>state.events.filter(e=>!E.CLOSED.includes(e.stage)).flatMap(event=>datesOf(event).map(([field,date])=>({event,field,date})));
  function weekPanel(){
    const start=new Date(E.today()+'T12:00:00');start.setDate(start.getDate()+weekOffset*7);
    const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
    const known=allMilestones(), selectedItems=known.filter(m=>m.date===chosenDay);
    return `<section class="week-planner"><div class="planner-heading"><div><span class="eyebrow">MAKE SPACE FOR YOUR NEXT MOVE</span><h2>Your week, in focus.</h2></div><div class="planner-controls"><button data-work="week-prev" aria-label="Previous seven days">←</button><button data-work="week-today">Today</button><button data-work="week-next" aria-label="Next seven days">→</button></div></div><div class="week-days">${days.map(d=>{const date=iso(d),items=known.filter(m=>m.date===date);return `<button class="week-day ${date===chosenDay?'selected':''} ${date===E.today()?'is-today':''}" data-work="day" data-date="${date}" aria-pressed="${date===chosenDay}" aria-label="${fmt(date)}, ${items.length} milestones"><span>${d.toLocaleDateString('en-US',{weekday:'short'})}</span><strong>${d.getDate()}</strong><small>${items.length?items.length+' planned':'—'}</small><i class="${items.length?'has-items':''}"></i></button>`;}).join('')}</div><div class="day-agenda"><span class="agenda-label">${chosenDay===E.today()?'TODAY':short(chosenDay).toUpperCase()}</span>${selectedItems.length?selectedItems.map(m=>`<button data-action="event" data-id="${esc(m.event.id)}"><span><strong>${esc(m.event.name)}</strong><small>${esc(m.field)}</small></span><span>↗</span></button>`).join(''):'<p>No recorded milestones. A little room to build.</p>'}</div></section>`;
  }
  function focusPanel(){
    const next=milestones()[0], days=next?Math.round((Date.parse(next.date)-Date.parse(E.today()))/86400000):0;
    return `<section class="focus-panel"><div class="focus-copy"><div class="focus-kicker"><span class="pulse"></span> ${next?'YOUR NEXT MOVE':'YOUR NEXT CHAPTER'}</div><h2>${next?esc(next.event.name):'Great things start<br>with a small step.'}</h2><p>${next?esc(next.field)+' · '+fmt(next.date):'Bring an announcement. Give your opportunity a place to grow.'}</p><div class="focus-actions"><button class="button primary" data-action="${next?'event':'import'}" ${next?'data-id="'+esc(next.event.id)+'"':''}>${next?'Open event journey':'Import your first update'} <span>↗</span></button>${next?tag(next.event.stage):''}</div></div><div class="focus-orbit" aria-hidden="true"><i></i><i></i><i></i><div><strong>${next?days:'↗'}</strong><span>${next?(days===0?'TODAY':days===1?'DAY TO GO':'DAYS TO GO'):'LET’S BEGIN'}</span></div><b>✦</b></div><span class="focus-footnote">${next?'Based on your recorded dates':'Your personal opportunity space'}</span></section>`;
  }
  eventCard=function(e){
    const next=nextDate(e), mark=(e.name.match(/[A-Za-z0-9]/g)||['↗']).slice(0,2).join('').toUpperCase();
    return `<button class="event-card premium-card" data-action="event" data-id="${esc(e.id)}"><div class="premium-card-top"><span class="event-monogram">${esc(mark)}</span>${tag(e.stage)}<span class="card-arrow">↗</span></div><div class="event-org">${esc(e.category||'Event')} · ${esc(e.organizer||'Organizer unknown')}</div><div class="event-title">${esc(e.name)}</div><div class="card-next"><span>${next?esc(next[0]):'NEXT MILESTONE'}</span><strong>${next?short(next[1]):'No date recorded'}</strong></div><div class="card-evidence"><span>▤ ${e.sources.length} sources</span><span>↗ ${e.history.length} changes</span></div></button>`;
  };
  overview=function(){
    const original=originalOverview();
    const statStart=original.indexOf('<div class="stats">');
    const gridStart=original.indexOf('<div class="grid-main">');
    return original.slice(0,statStart)+`<div class="workspace-spotlight">${focusPanel()}${weekPanel()}</div>`+original.slice(statStart,gridStart)+original.slice(gridStart);
  };
  function monthView(){
    const year=calendarMonth.getFullYear(), month=calendarMonth.getMonth(), start=new Date(year,month,1), offset=(start.getDay()+6)%7;
    const first=new Date(year,month,1-offset), known=allMilestones().filter(m=>(filter==='All'||m.event.stage===filter)&&(m.event.name+' '+m.event.organizer+' '+m.event.category).toLowerCase().includes(query.toLowerCase()));
    const cells=Array.from({length:42},(_,i)=>{const d=new Date(first);d.setDate(first.getDate()+i);const date=iso(d),items=known.filter(m=>m.date===date);return `<div class="month-cell ${d.getMonth()!==month?'outside':''} ${date===E.today()?'today-cell':''}"><span class="month-number">${d.getDate()}</span>${items.map(m=>`<button data-action="event" data-id="${esc(m.event.id)}" title="${esc(m.event.name+' · '+m.field)}"><span>${esc(m.event.name)}</span><small>${esc(m.field)}</small></button>`).join('')}</div>`;}).join('');
    return `<section class="panel month-panel"><div class="panel-head"><div><h2>${start.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2><p>Recorded dates · select an event to open its journey</p></div><div class="planner-controls"><button data-work="month-prev" aria-label="Previous month">←</button><button data-work="month-today">Today</button><button data-work="month-next" aria-label="Next month">→</button></div></div><div class="month-scroll"><div class="month-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="month-weekday">${d}</div>`).join('')}${cells}</div></div></section>`;
  }
  timeline=function(){
    const html=originalTimeline();
    // Parse only this generated view so controls retain the same state and handlers.
    const template=document.createElement('template');template.innerHTML=html;
    const segmented=template.content.querySelector('.segmented');
    segmented.insertAdjacentHTML('beforeend',`<button data-action="mode" data-mode="calendar" class="${mode==='calendar'?'active':''}" aria-pressed="${mode==='calendar'}">Calendar</button>`);
    if(mode==='calendar')template.content.querySelector('.timeline-tools').nextElementSibling.outerHTML=monthView();
    return template.innerHTML;
  };
  detail=function(e){return originalDetail(e).replace('<div class="detail-toolbar">',`<div class="record-summary"><span><i class="pulse"></i> LIVING RECORD</span><span>${esc(e.stage)}</span><span>${e.sources.length} supporting sources</span></div><div class="detail-toolbar">`);};
  document.querySelector('.top-actions').insertAdjacentHTML('afterbegin','<button class="command-trigger" data-work="search"><span>⌕</span> Quick search <kbd>Ctrl K</kbd></button>');
  document.querySelector('.sidebar-bottom').insertAdjacentHTML('afterbegin','<button class="sidebar-capture" data-action="import"><span>＋</span><div>Catch an update<small>Keep your journey moving</small></div><b>↗</b></button>');
  const palette=document.createElement('dialog');palette.id='command-palette';palette.setAttribute('aria-label','Quick search');
  palette.innerHTML='<div class="command-input-row"><span>⌕</span><input id="command-input" placeholder="Find an event or jump to an action…" aria-label="Search events and actions" autocomplete="off"><button data-work="close-search" aria-label="Close quick search">Esc</button></div><div id="command-results"></div><footer>↑ ↓ Navigate <span>↵ Open</span><span>Esc Close</span></footer>';
  document.body.append(palette);let commandIndex=0;
  function results(){
    const q=$('command-input').value.toLowerCase().trim(), actions=[['overview','Overview','Your next steps'],['timeline','Living timeline','Every opportunity in one place'],['review','Review queue',state.review.length+' pending reviews'],['conflicts','ConflictIQ','Check schedule overlaps'],['sources','Evidence library','Original communications'],['settings','Workspace settings','Export, backup and restore']];
    const items=[...state.events.filter(e=>(e.name+' '+e.organizer).toLowerCase().includes(q)).map(e=>({title:e.name,sub:e.stage,action:'event',id:e.id})),...actions.filter(a=>(a[1]+' '+a[2]).toLowerCase().includes(q)).map(a=>({title:a[1],sub:a[2],action:'nav',view:a[0]})),...(!q||'import update'.includes(q)?[{title:'Import an update',sub:'Paste a communication for review',action:'import'}]:[])];
    $('command-results').innerHTML=items.length?items.slice(0,12).map((a,i)=>`<button class="command-result ${i===0?'highlighted':''}" data-command="true" data-action="${a.action}" ${a.id?'data-id="'+esc(a.id)+'"':''} ${a.view?'data-view="'+a.view+'"':''}><span class="command-result-icon">${a.action==='event'?'↗':'◫'}</span><span><strong>${esc(a.title)}</strong><small>${esc(a.sub)}</small></span><span>↵</span></button>`).join(''):'<div class="command-empty">No matching events or actions.</div>';
    commandIndex=0;
  }
  function openSearch(){if($('workspace-dialog').open||view==='home')return;palette.showModal();$('command-input').value='';results();$('command-input').focus();}
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&view!=='home'){event.preventDefault();palette.open?palette.close():openSearch();}
    if(!palette.open)return;
    const buttons=[...palette.querySelectorAll('.command-result')];
    if(['ArrowDown','ArrowUp'].includes(event.key)&&buttons.length){event.preventDefault();commandIndex=(commandIndex+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons.forEach((b,i)=>b.classList.toggle('highlighted',i===commandIndex));buttons[commandIndex].scrollIntoView({block:'nearest'});}
    if(event.key==='Enter'&&buttons[commandIndex]){event.preventDefault();buttons[commandIndex].click();}
  });
  $('command-input').addEventListener('input',results);
  // Close before the application's delegated action opens another dialog.
  document.addEventListener('click',event=>{if(event.target.closest('[data-command]'))palette.close();},true);
  document.addEventListener('click',event=>{
    const t=event.target.closest('[data-work]');if(!t)return;
    const action=t.dataset.work;
    if(action==='search')return openSearch();if(action==='close-search')return palette.close();
    if(action==='day')chosenDay=t.dataset.date;
    if(action.startsWith('week-')){weekOffset=action==='week-today'?0:weekOffset+(action==='week-next'?1:-1);const d=new Date(E.today()+'T12:00:00');d.setDate(d.getDate()+weekOffset*7);chosenDay=iso(d);}
    if(action.startsWith('month-'))calendarMonth=action==='month-today'?new Date(new Date().getFullYear(),new Date().getMonth(),1):new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+(action==='month-next'?1:-1),1);
    render();const target=t.dataset.date?document.querySelector(`[data-date="${t.dataset.date}"]`):document.querySelector(`[data-work="${action}"]`);target?.focus({preventScroll:true});
  });
  const content=$('content');
  new MutationObserver(()=>{content.dataset.screen=selected?'event':view;}).observe(content,{childList:true});
  render();content.dataset.screen=selected?'event':view;
})();

