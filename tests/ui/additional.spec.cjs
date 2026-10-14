const {test,expect}=require('@playwright/test');
test('EML upload detects email and extracts a summary',async({page})=>{
 await page.goto('/#overview');await page.getByRole('button',{name:'Import update →',exact:true}).click();
 await page.locator('#source-file').setInputFiles({name:'registration.eml',mimeType:'message/rfc822',buffer:Buffer.from('From: team@example.test\nSubject: CodeStorm 2026 - Registration confirmed\nContent-Type: text/html\n\n<p>Event: CodeStorm 2026</p><p>Registration confirmed</p><p>Proposal deadline: 15th Oct’26 by EOD</p>')});
 await expect(page.locator('#detected-source')).toContainText('Email');await page.getByRole('button',{name:'Find updates →'}).click();
 await expect(page.locator('.review-summary')).toContainText('CodeStorm 2026');await expect(page.getByRole('dialog')).toContainText('EOD');
});
test('digest cannot be approved as one event',async({page})=>{
 await page.goto('/#overview');await page.getByRole('button',{name:'Import update →',exact:true}).click();
 await page.getByLabel('Communication text',{exact:true}).fill('Event: Alpha Hackathon\nProposal deadline October 15, 2026\nEvent: Beta Workshop\nWorkshop October 18, 2026');
 await page.getByRole('button',{name:'Find updates →'}).click();await expect(page.getByRole('button',{name:'Approve update',exact:true})).toBeDisabled();
});
test('throttled mobile landing is readable without remote fonts',async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(),session=await context.newCDPSession(page);
 await session.send('Emulation.setCPUThrottlingRate',{rate:4});await session.send('Network.enable');
 await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:75000});
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4174'))external.push(r.url());});
 const start=Date.now();await page.goto('http://127.0.0.1:4174/#home');await expect(page.locator('#lp-heading')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const small=await page.locator('body *').evaluateAll(els=>els.filter(e=>e.children.length===0&&e.textContent.trim()&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden'&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>({text:e.textContent.slice(0,50),size:getComputedStyle(e).fontSize})));
 expect(small).toEqual([]);expect(external).toEqual([]);
 await info.attach('simulation.json',{body:JSON.stringify({cpuSlowdown:4,width:390,latencyMs:150,downloadBytesPerSec:200000,elapsedMs:Date.now()-start,physicalDevice:false}),contentType:'application/json'});
 await page.screenshot({path:'test-results/mobile-landing.png',fullPage:true});await context.close();
});
