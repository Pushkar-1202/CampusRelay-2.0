'use strict';
(function () {
  const icons = {
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    diagonal:'<path d="M6 18 18 6M6 6h12v12"/>',
    calendar:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 5h2"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    link:'<path d="m10 14 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    pause:'<path d="M8 5v14m8-14v14"/>',
    play:'<path d="m8 5 11 7-11 7V5Z"/>'
  };
  const icon = (name, cls = '') => `<svg class="relay-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
  const mark = `<span class="lp-mark">${icon('diagonal')}</span>`;
  const root = document.createElement('div'); root.id = 'landing'; root.hidden = true;
  root.innerHTML = `
    <div class="lp-ambient" aria-hidden="true"><div class="lp-glow glow-one"></div><div class="lp-glow glow-two"></div><div class="lp-grid"></div></div>
    <header class="lp-header" id="home"><a class="lp-brand" href="#home" aria-label="CampusRelay home">${mark}<span>campus<span>relay</span></span></a><nav class="lp-nav" aria-label="Landing page"><a href="#how-it-works">How it works</a><a href="#features">Why Relay?</a></nav><a class="lp-nav-cta" href="#overview">Open workspace ${icon('diagonal')}</a></header>
    <main id="landing-main">
      <section class="lp-hero lp-section" aria-labelledby="lp-heading">
        <div class="lp-hero-copy">
          <div class="lp-pill hero-entry"><span class="lp-live-dot"></span> Your opportunities. In motion.</div>
          <h1 id="lp-heading" class="hero-entry">Big opportunities.<br>Small details.<br><span class="lp-accent">Nothing missed.</span></h1>
          <p class="lp-hero-desc hero-entry">From “you’re registered” to “you’re shortlisted.”<br>Your event journey finally has a place to live.</p>
          <div class="lp-hero-actions hero-entry"><a class="lp-button lime" href="#overview">Meet your timeline ${icon('arrow')}</a><a class="lp-button text" href="#live-demo">See it in motion <span class="play-circle">${icon('play')}</span></a></div>
          <div class="lp-smallprint hero-entry">A student-first prototype. Bring your own announcements.</div>
        </div>
        <div class="lp-hero-art hero-entry" aria-label="Animated demonstration of an organizer update being reviewed in a living timeline">
          <div class="orbit orbit-one" aria-hidden="true"></div><div class="orbit orbit-two" aria-hidden="true"></div><div class="orbit-spark spark-one" aria-hidden="true">✦</div><div class="orbit-spark spark-two" aria-hidden="true">✦</div>
          <svg class="relay-connections" viewBox="0 0 560 520" aria-hidden="true"><path class="line-base" d="M105 100C270 105 110 265 285 270S430 385 490 410"/><path class="line-flow" d="M105 100C270 105 110 265 285 270S430 385 490 410"/></svg>
          <div class="floating-message message-top"><span class="message-icon">${icon('mail')}</span><div><span class="mini-label">ORGANIZER UPDATE</span><strong>More time to build.</strong><small>Proposal deadline extended →</small></div><span class="message-time">just in</span></div>
          <div class="hero-timeline" id="hero-timeline"><div class="mock-top"><span><i class="lp-live-dot"></i> LIVING TIMELINE</span>${icon('layers')}</div><div class="mock-event-icon">N<span>↗</span></div><h2>Northstar Hackathon</h2><p class="mock-subtitle">Your next big build.</p><div class="mock-stage" id="hero-stage">Registered ${icon('check')}</div><div class="mock-date"><div><small>PROPOSAL DEADLINE</small><strong id="hero-date">October 15 <s>→</s> <span>October 17</span></strong></div>${icon('calendar')}</div><div class="mock-journey"><span class="complete">✓</span><i></i><span class="complete">✓</span><i></i><span id="journey-current">3</span><i></i><span>4</span></div><div class="mock-footer"><span>${icon('shield')} Source attached</span><span>Sample event</span></div></div>
          <div class="floating-message message-bottom"><span class="message-icon lime-icon">${icon('check')}</span><div><span class="mini-label">REVIEWED & RECORDED</span><strong id="hero-toast">Deadline change captured</strong><small>Old date. New date. Original source.</small></div></div>
          <div class="art-caption"><span class="lp-live-dot"></span> A simulated journey, playing live <button id="motion-toggle" aria-label="Pause landing animations" aria-pressed="false">${icon('pause')}</button></div>
        </div>
      </section>
      <section class="source-band" aria-label="Supported input examples"><div class="source-band-label">Scattered across your feeds.<br><strong>Connected in your timeline.</strong></div><div class="source-marquee"><div class="source-track">${['EMAIL','POSTERS','SHARED MESSAGES','EVENT LINKS','SCREENSHOTS','EMAIL','POSTERS','SHARED MESSAGES','EVENT LINKS','SCREENSHOTS'].map((t,i) => `<span ${i >= 5 ? 'aria-hidden="true"' : ''}>${t} <b>✳</b></span>`).join('')}</div></div></section>
      <section class="lp-section lp-how" id="how-it-works"><div class="lp-section-heading reveal"><div class="lp-eyebrow">LESS CHASING. MORE CREATING.</div><h2>The journey moves.<br><span>Relay moves with it.</span></h2><p>Give an announcement somewhere to go.<br>Keep the context every time it changes.</p></div><div class="how-grid">
        <article class="how-card reveal"><div class="how-number">01 <span>CAPTURE</span></div><div class="capture-art" aria-hidden="true"><div class="capture-file file-back">${icon('calendar')} event_poster.png</div><div class="capture-file file-front">${icon('mail')} You’re registered! <i>↗</i></div><div class="capture-pulse">${icon('diagonal')}</div></div><h3>Bring the messy stuff.</h3><p>Paste an email or message. Attach a poster and add its text. Turn scattered details into an event record.</p></article>
        <article class="how-card reveal"><div class="how-number">02 <span>CONNECT</span></div><div class="match-art" aria-hidden="true"><div class="match-chip">NST-2048</div><div class="match-beam"></div><div class="match-target">${icon('link')}<span>Northstar Hackathon</span><i>✓</i></div><small>Matching registration ID</small></div><h3>Find the right journey.</h3><p>Relay compares identifiers, links, and event names. You choose the destination whenever the match is uncertain.</p></article>
        <article class="how-card reveal"><div class="how-number">03 <span>EVOLVE</span></div><div class="evolve-art" aria-hidden="true"><span class="evolve-old">OCT 15</span><span class="evolve-arrow">${icon('arrow')}</span><span class="evolve-new">OCT 17</span><div>Deadline changed <span>Source preserved ✓</span></div></div><h3>See exactly what changed.</h3><p>Review the old and new facts. Approve what’s right. Every change leaves a trail you can come back to.</p></article>
      </div></section>
      <section class="lp-section lp-demo" id="live-demo"><div class="lp-demo-intro reveal"><div class="lp-eyebrow">A LITTLE CHANGE. A CLEARER PICTURE.</div><h2>This is what<br><span>keeping up looks like.</span></h2><p>Explore three moments in an event journey.<br>These are simulated updates, so you can play freely.</p><div class="demo-selector" role="group" aria-label="Choose a simulated update"><button class="selected" data-scene="deadline" aria-pressed="true">${icon('calendar')} Deadline extended</button><button data-scene="stage" aria-pressed="false">${icon('spark')} Team shortlisted</button><button data-scene="conflict" aria-pressed="false">${icon('layers')} Schedule clash</button></div></div><div class="demo-screen reveal"><div class="demo-screen-top"><span><i></i><i></i><i></i></span><small>campusrelay / living record</small>${icon('shield')}</div><div class="demo-screen-body" id="scene-content"></div><div class="demo-screen-footer">${icon('link')} Original communication retained <span>SIMULATED</span></div></div></section>
      <section class="lp-section lp-features" id="features"><div class="lp-section-heading reveal"><div class="lp-eyebrow">CONFIDENCE, WITH CONTEXT.</div><h2>More than a date.<br><span>The whole story.</span></h2></div><div class="features-grid"><article class="feature-large reveal"><div class="feature-icon">${icon('shield')}</div><h3>A receipt for<br>every important update.</h3><p>Source text, previous facts, approved changes.<br>Know where your timeline came from.</p><div class="evidence-stack"><div class="evidence-note">${icon('mail')} Organizer announcement <span>↗</span></div><div class="evidence-note">${icon('calendar')} October 15 <span>→ October 17</span></div><div class="evidence-note">${icon('check')} Reviewed by you <span>Recorded ✓</span></div></div><span class="feature-footnote">Reviewed by a student ≠ independently authenticated.</span></article><article class="feature-small reveal"><div class="feature-icon lilac-icon">${icon('layers')}</div><h3>Your commitments,<br>in perspective.</h3><p>Spot same-day events and nearby deadlines before your week gets crowded.</p><div class="mini-calendar" aria-hidden="true">${['M','T','W','T','F','S','S','19','20','21','22','23','24','25'].map((s,i) => `<span class="${i === 12 ? 'busy-day' : ''}">${s}${i === 12 ? '<i></i><i></i>' : ''}</span>`).join('')}</div></article><article class="feature-small reveal"><div class="feature-icon coral-icon">${icon('diagonal')}</div><h3>Pass the clarity<br>to your team.</h3><p>Copy a concise event summary. Keep original emails and personal notes in your workspace.</p><div class="team-art" aria-hidden="true"><span>A</span><span>R</span><span>S</span><div>Same facts. Shared focus. ${icon('check')}</div></div></article></div></section>
      <section class="lp-section lp-final reveal"><div class="final-orbit" aria-hidden="true"></div><div class="lp-eyebrow">THE NEXT CHAPTER IS YOURS.</div><h2>Go build something.<br><span>We’ll keep the story together.</span></h2><a class="lp-button lime" href="#overview">Open your workspace ${icon('diagonal')}</a><p>Local workspace · No inbox connection required</p></section>
    </main><footer class="lp-footer"><a class="lp-brand" href="#home">${mark}<span>campus<span>relay</span></span></a><p>Your event journey. Always in context.</p><a href="https://github.com/Pushkar-1202/CampusRelay" target="_blank" rel="noopener noreferrer">Explore the project ${icon('diagonal')}</a></footer>
  `;
  document.querySelector('.skip-link').after(root);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = media.matches, visible = false, interval = null, step = 0;
  const scenes = {
    deadline: {type:'DEADLINE UPDATE',tag:'Reviewed change',title:'A little breathing room.',description:'Northstar Hackathon · proposal submission',body:'<div class="scene-date-change"><div><small>PREVIOUS</small><s>October 15</s></div><span>→</span><div><small>UPDATED</small><strong>October 17</strong></div></div>',source:'“The proposal deadline is extended to October 17.”',note:'Previous date preserved. New date approved.'},
    stage: {type:'PARTICIPATION UPDATE',tag:'Shortlisted',title:'Your next chapter starts.',description:'Northstar Hackathon · team NST-2048',body:'<div class="scene-stage-change"><span>Registered</span><i>→</i><strong>Shortlisted ✦</strong></div><div class="scene-progress"><i></i><i></i><i></i><i></i></div>',source:'“Congratulations! Your team has qualified for the final round.”',note:'Participation advances with supporting evidence.'},
    conflict: {type:'CONFLICTIQ ALERT',tag:'Potential clash',title:'Two places. One day.',description:'Known dates compared across your events',body:'<div class="scene-conflict"><div><strong>Northstar Hackathon</strong><span>Final round · October 24</span></div><div><strong>Build for Good</strong><span>Final round · October 24</span></div></div>',source:'Both events list October 24 as their final-round date.',note:'Times are unknown. Review the schedules before deciding.'}
  };
  function scene(name) {
    const s = scenes[name]; if (!s) return;
    const element = document.getElementById('scene-content');
    element.innerHTML = `<div class="scene-kicker"><span>${s.type}</span><b>${s.tag}</b></div><h3>${s.title}</h3><p>${s.description}</p>${s.body}<div class="scene-source"><small>SUPPORTING SOURCE</small><p>${s.source}</p></div><div class="scene-note">${icon('check')} ${s.note}</div>`;
    element.classList.remove('scene-enter'); void element.offsetWidth; element.classList.add('scene-enter');
    root.querySelectorAll('[data-scene]').forEach(b => {const chosen = b.dataset.scene === name; b.classList.toggle('selected', chosen); b.setAttribute('aria-pressed', String(chosen));});
  }
  function heroStep() {
    step = (step + 1) % 3;
    const card = document.getElementById('hero-timeline'); card.classList.remove('mock-change'); void card.offsetWidth; card.classList.add('mock-change');
    document.getElementById('hero-stage').innerHTML = [ 'Registered', 'Proposal submitted', 'Shortlisted ✦' ][step] + icon('check');
    document.getElementById('hero-toast').textContent = [ 'Deadline change captured', 'Submission recorded', 'You’re on to the next round' ][step];
    document.getElementById('journey-current').classList.toggle('complete', step > 0);
  }
  function schedule() {
    clearInterval(interval); interval = null;
    document.body.classList.toggle('motion-paused', paused || media.matches);
    document.documentElement.classList.toggle('motion-paused', paused || media.matches);
    const toggle = document.getElementById('motion-toggle');
    toggle.innerHTML = icon(paused ? 'play' : 'pause'); toggle.setAttribute('aria-pressed',String(paused)); toggle.setAttribute('aria-label',paused ? 'Play landing animations' : 'Pause landing animations');
    if (visible && !paused && !media.matches && !document.hidden) interval = setInterval(heroStep, 4200);
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-scene],#motion-toggle'); if (!button) return;
    if (button.id === 'motion-toggle') { paused = !paused; schedule(); } else scene(button.dataset.scene);
  });
  document.addEventListener('visibilitychange',schedule); media.addEventListener('change', () => {paused = media.matches; schedule();});
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (entry.isIntersecting) {entry.target.classList.add('in-view'); observer.unobserve(entry.target);}}), {threshold:0.12});
  root.querySelectorAll('.reveal').forEach(el => observer.observe(el)); document.body.classList.add('motion-ready');
  root.querySelectorAll('.how-card,.feature-small,.feature-large').forEach(card => {
    card.addEventListener('pointermove', event => { if (media.matches || paused || event.pointerType === 'touch') return; const bounds = card.getBoundingClientRect(); card.style.setProperty('--spot-x', (event.clientX - bounds.left)+'px'); card.style.setProperty('--spot-y', (event.clientY - bounds.top)+'px'); });
  });
  scene('deadline'); schedule();
  window.CampusLanding = { setVisible(value) { visible = value; root.hidden = !value; document.body.classList.toggle('landing-visible',value); document.querySelector('.app-shell').hidden = value; document.querySelector('.skip-link').href = value ? '#landing-main' : '#content'; schedule(); } };
})();

