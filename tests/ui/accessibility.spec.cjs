const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
async function audit(page,testInfo,label){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await testInfo.attach(label+'.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);}
for(const route of ['home','overview','timeline','review','conflicts','sources','settings','event/e1'])test('@a11y '+route,async({page},testInfo)=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#'+route);await audit(page,testInfo,route);});
test('@a11y calendar',async({page},testInfo)=>{await page.goto('/#timeline');await page.getByRole('button',{name:'Calendar',exact:true}).click();await audit(page,testInfo,'calendar');});
test('@a11y dialogs import editor review source share search restore undo clear',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#overview');
  await page.getByRole('button',{name:'Import update →',exact:true}).click();await audit(page,testInfo,'import');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'+ Add event',exact:true}).click();await audit(page,testInfo,'editor');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Review queue',exact:true}).click();await page.getByRole('button',{name:'Review & edit →'}).click();await audit(page,testInfo,'review');await page.getByText('Edit details',{exact:true}).click();await audit(page,testInfo,'review-expanded');await page.keyboard.press('Escape');
  await page.goto('/#event/e1');await page.getByRole('button',{name:/Registration confirmation \(sample\)/}).click();await audit(page,testInfo,'source');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Team summary ↗'}).click();await audit(page,testInfo,'share');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Undo this change'}).click();await audit(page,testInfo,'undo');await page.keyboard.press('Escape');
  await page.locator('.command-trigger').click();await audit(page,testInfo,'search');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Workspace',exact:true}).click();const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup ↓',exact:true}).click();const backup=await backupPromise;await page.locator('#backup-file').setInputFiles(await backup.path());await audit(page,testInfo,'restore');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Wipe this workspace'}).click();await audit(page,testInfo,'clear');
});
