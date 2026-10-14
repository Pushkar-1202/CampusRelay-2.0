'use strict';
(() => {
  const root = document.getElementById('landing');
  const hero = root.querySelector('.lp-hero');
  root.querySelector('#lp-heading').innerHTML = 'Chase the<br><span class="headline-outline">opportunity.</span><br><span class="lp-accent">Own the journey.</span>';
  root.querySelector('.lp-hero-desc').innerHTML = 'The announcements move. The deadlines change.<br>Your next big thing stays in sight.';
  hero.insertAdjacentHTML('beforeend', '<a class="scroll-cue" href="#relay-story"><span class="scroll-mouse"><i></i></span> SCROLL TO CONNECT THE DOTS <span>↓</span></a>');
  const story = document.createElement('section');
  story.id = 'relay-story'; story.className = 'relay-story';
  story.setAttribute('aria-label', 'Follow a simulated event from discovery to shortlisting');
  story.innerHTML = `<div class="story-pin"><div class="story-intro"><span class="lp-eyebrow">FROM SCATTERED TO SHORTLISTED</span><h2>One opportunity.<br><span>A living story.</span></h2><p>Keep scrolling. Watch the pieces fall into place.</p></div><div class="story-world"><div class="story-radar" aria-hidden="true"><i></i><i></i><i></i></div><svg class="story-wires" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true"><path d="M130 90C300 90 250 210 500 210M870 90C700 90 750 210 500 210M130 340C300 340 250 210 500 210M870 340C700 340 750 210 500 210"/></svg><div class="story-source s-one"><b>✉</b><span>ORGANIZER EMAIL<strong>You’re registered!</strong><small>Registration NST-2048</small></span></div><div class="story-source s-two"><b>▧</b><span>EVENT POSTER<strong>Northstar Hackathon</strong><small>Build something that matters.</small></span></div><div class="story-source s-three"><b>↗</b><span>SHARED MESSAGE<strong>Deadline extended.</strong><small>October 15 → October 17</small></span></div><div class="story-source s-four"><b>✦</b><span>RESULT ANNOUNCEMENT<strong>You made the shortlist.</strong><small>Your next chapter awaits.</small></span></div><div class="story-record"><div class="story-record-top"><span class="lp-live-dot"></span> YOUR LIVING RECORD <span>↗</span></div><div class="story-emblem">N<sup>↗</sup></div><h3>Northstar<br>Hackathon</h3><div class="story-status" id="story-status">Discovered</div><div class="story-date"><span>PROPOSAL DEADLINE</span><div><s id="story-old" hidden>15</s><strong id="story-day">15</strong><span>OCT<br>2026</span><b id="story-date-tag">Poster attached</b></div></div><div class="story-checkpoints"><i></i><i></i><i></i><i></i></div><small id="story-evidence">Student-provided poster · Sample event</small></div><div class="story-stamp" aria-hidden="true">✓<span>CONTEXT<br>PRESERVED</span></div></div><div class="story-bottom"><div class="story-caption"><span id="story-number">01 / 04</span><h3 id="story-title">Start with the spark.</h3><p id="story-copy">A poster becomes the first piece of your event story.</p></div><div class="story-chapters" aria-label="Story chapters">${['Discover','Connect','Update','Advance'].map((t,i)=>`<button data-chapter="${i}" aria-label="Show chapter ${i+1}: ${t}"><i></i><span>0${i+1} ${t}</span></button>`).join('')}</div></div><div class="story-disclaimer">SIMULATED JOURNEY · IMPORTANT CHANGES REQUIRE YOUR REVIEW</div></div>`;
  root.querySelector('.source-band').after(story);
  const progress = document.createElement('div'); progress.className='reading-progress'; progress.setAttribute('aria-hidden','true'); root.prepend(progress);
  const control = root.querySelector('#motion-toggle');
  const dock = document.createElement('div'); dock.className='motion-dock'; dock.innerHTML='<span>A LITTLE MOTION. A LOT OF CLARITY.</span>'; dock.append(control); root.append(dock);
  const chapters = [
    ['Discovered','Start with the spark.','A poster becomes the first piece of your event story.'],
    ['Registered','Different sources. Same journey.','A matching registration ID connects the email to the right event.'],
    ['Deadline updated','Plans change. Context stays.','After your review, the new date is saved alongside the original.'],
    ['Shortlisted ✦','Keep your next chapter in view.','A reviewed announcement moves your participation forward.']
  ];
  let active=-1, pending=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function draw() {
    pending=0; if(root.hidden) return;
    const box=story.getBoundingClientRect();
    const p=Math.max(0,Math.min(1,-box.top/Math.max(1,box.height-innerHeight)));
    const index=Math.min(3,Math.floor(p*4));
    const still=reduced.matches||document.body.classList.contains('motion-paused');
    story.style.setProperty('--story-progress',p);
    story.style.setProperty('--merge',still?0:Math.min(1,p*2.2));
    hero.style.setProperty('--hero-scroll',still?0:Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/innerHeight)));
    progress.style.transform=`scaleX(${scrollY/Math.max(1,root.offsetHeight-innerHeight)})`;
    if(index!==active){
      active=index; story.dataset.chapter=index;
      document.getElementById('story-status').textContent=chapters[index][0];
      document.getElementById('story-title').textContent=chapters[index][1];
      document.getElementById('story-copy').textContent=chapters[index][2];
      document.getElementById('story-number').textContent=`0${index+1} / 04`;
      document.getElementById('story-old').hidden=index<2;
      document.getElementById('story-day').textContent=index>=2?'17':'15';
      document.getElementById('story-date-tag').textContent=index>=2?'Change recorded ✓':'Poster attached';
      document.getElementById('story-evidence').textContent=index>=2?'Previous value + source preserved':'Student-provided source · Sample event';
      story.querySelectorAll('[data-chapter]').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
      story.querySelectorAll('.story-checkpoints i').forEach((el,i)=>el.classList.toggle('done',i<=index));
    }
  }
  function queue(){if(!pending) pending=requestAnimationFrame(draw);}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);addEventListener('hashchange',queue);
  new MutationObserver(queue).observe(root,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
  story.addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(!b)return;const index=Number(b.dataset.chapter);scrollTo({top:scrollY+story.getBoundingClientRect().top+(story.offsetHeight-innerHeight)*(index+.35)/4,behavior:reduced.matches||document.body.classList.contains('motion-paused')?'instant':'smooth'});});
  // Autoplay the existing demo only while it is on screen; interaction stops autoplay.
  let demoVisible=false, manual=false, timer=null, sceneIndex=0;
  const demo=root.querySelector('.lp-demo');
  function autoplay(){clearInterval(timer);if(demoVisible&&!manual&&!root.hidden&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('motion-paused'))timer=setInterval(()=>{sceneIndex=(sceneIndex+1)%3;demo.querySelectorAll('[data-scene]')[sceneIndex].click();},5000);}
  new IntersectionObserver(entries=>{demoVisible=entries[0].isIntersecting;autoplay();},{threshold:.3}).observe(demo);
  demo.addEventListener('pointerdown',()=>{manual=true;autoplay();});demo.addEventListener('keydown',()=>{manual=true;autoplay();});
  new MutationObserver(autoplay).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',autoplay);reduced.addEventListener('change',()=>{queue();autoplay();});queue();
})();
