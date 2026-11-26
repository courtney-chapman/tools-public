(function (root) {
  'use strict';
  const uid = () => globalThis.crypto?.randomUUID?.() || `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function validDate(s) { if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(`${s}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === s; }
  function addDays(date, days, convention='Calendar') {
    if (!validDate(date) || !Number.isInteger(Number(days)) || Number(days)<0 || Number(days)>3650) return '';
    const d = new Date(`${date}T12:00:00Z`); let left = Number(days);
    while (left > 0) { d.setUTCDate(d.getUTCDate()+1); if (convention !== 'Business' || ![0,6].includes(d.getUTCDay())) left--; }
    return d.toISOString().slice(0,10);
  }
  const cents = n => Math.round((Number(n)||0)*100);
  const money = n => (Number(n)||0).toLocaleString(undefined,{style:'currency',currency:'USD'});
  const dayDifference = (start,end) => validDate(start)&&validDate(end) ? Math.round((Date.parse(`${end}T12:00:00Z`)-Date.parse(`${start}T12:00:00Z`))/86400000) : null;
  function parseCSV(source) {
    const rows=[]; let row=[], field='', quoted=false; const s=String(source).replace(/^\uFEFF/,'');
    for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"'){if(field)throw Error('Unexpected quote');quoted=true;}else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);field='';if(row.some(Boolean))rows.push(row);row=[];}else field+=c;}
    if(quoted)throw Error('Unclosed CSV quote');row.push(field);if(row.some(Boolean))rows.push(row);if(!rows.length)return [];
    const headers=rows.shift().map(x=>x.trim());if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV header');
    return rows.map((cells,i)=>{if(cells.length!==headers.length)throw Error(`CSV row ${i+2} has the wrong number of columns`);return Object.fromEntries(headers.map((h,j)=>[h,cells[j]]));});
  }
  function toCSV(rows,headers){const q=v=>{let s=String(v??'');if(/^\s*[=+@]/.test(s)||(/^\s*-/.test(s)&&!/^\s*-\d+(\.\d+)?\s*$/.test(s)))s=`'${s}`;return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};return [headers.join(','),...rows.map(r=>headers.map(h=>q(r[h])).join(','))].join('\r\n')+'\r\n';}
  const fresh = () => ({schema:1,events:[],selectedId:'',settings:{warningDays:14,departments:'Contracts, Program Management, Engineering, Finance, Pricing, Procurement, Scheduling, Operations, Quality, Legal, Leadership',eventCategories:'',costCategories:''},sampleIds:[]});
  const blankEvent = () => ({id:uid(),identifier:'',contract:'',order:'',nickname:'',customer:'',contractsRep:'',programManager:'',title:'',description:'',category:'Directed change',identified:today(),directionDate:'',impactKnown:'',directionType:'Unresolved factual questions',phase:'Establish the Basis',basisStatus:'Pending Review',notificationStatus:'Pending review',departmentStatus:'Pending assessment',costStatus:'Not started',scheduleStatus:'Not started',approvalStatus:'Not started',governmentStatus:'Not submitted',settlementStatus:'Unresolved',archived:false,baseline:'',change:'',source:'',director:'',communication:'',authority:'Not confirmed',writtenDirection:'Not requested',modification:'',effectiveDate:'',clause:'',basisNotes:'',impact:'',questions:'',packageVersion:'Working draft',narrative:{},packageSections:{},certification:{required:'Pending determination'},submission:{},resolution:{},chronology:[],notices:[],assignments:[],assignmentRevisions:[],costs:[],rates:[],schedule:[],evidence:[],reviews:[],requests:[],positions:[],snapshots:[],submissions:[]});
  function validateBackup(s){
    if(!s||s.schema!==1||!Array.isArray(s.events)||!s.settings||typeof s.settings!=='object'||!Array.isArray(s.sampleIds))throw Error('Unsupported backup');
    const ids=new Set();
    for(const e of s.events){
      if(!e||typeof e!=='object'||typeof e.id!=='string'||!e.id||ids.has(e.id))throw Error('Invalid event ID');ids.add(e.id);
      for(const k of ['chronology','notices','assignments','costs','rates','schedule','evidence','reviews','requests','positions','snapshots'])if(!Array.isArray(e[k]))throw Error(`Missing ${k} collection`);
      for(const k of ['assignmentRevisions','submissions'])if(e[k]!==undefined&&!Array.isArray(e[k]))throw Error(`Invalid ${k} collection`);
      for(const k of ['chronology','notices','assignments','costs','rates','schedule','evidence','reviews','requests','positions','snapshots','assignmentRevisions','submissions']){
        const recordIds=new Set();for(const record of e[k]||[]){if(!record||typeof record!=='object'||typeof record.id!=='string'||!record.id||recordIds.has(record.id))throw Error(`Invalid or duplicate record in ${k}`);recordIds.add(record.id);}
      }
    }
    return true;
  }
  function normalizeState(s){validateBackup(s);for(const e of s.events){e.assignmentRevisions ||= [];if(!e.submissions)e.submissions=e.submission?.date?[{id:uid(),recordedAt:'Legacy submission record',...e.submission}]:[];}if(s.selectedId&&!s.events.some(e=>e.id===s.selectedId))s.selectedId=s.events[0]?.id||'';return s;}
  function noticeDeadline(n){return n.confirmedDeadline || n.override || n.extension || (n.triggerDate && n.period!=='' ? addDays(n.triggerDate,n.period,n.convention) : '');}
  const isContractualNotice = n => n.kind==='Contractual';
  const noticeVerified = n => ['Confirmed by Contracts','Completed'].includes(n.status) && !!n.clause && !!noticeDeadline(n);
  function costSummary(e){
    const amount=x=>{let value=Math.round(Number(x.quantity||0)*Number(x.rate||0)*100);return ['Credit','Avoided cost'].includes(x.kind)?-Math.abs(value):value;};
    const active=e.costs.filter(x=>!['Baseline','Revised'].includes(x.kind));
    let incurred=0,estimated=0,credits=0;
    for(const x of active){const value=amount(x);if(value<0)credits+=value;else if(x.classification==='Incurred')incurred+=value;else estimated+=value;}
    const direct=incurred+estimated+credits,warnings=[],used=new Set(),bases=new Map(),indirectByPeriod=new Map();
    const ratePeriods=new Set(e.rates.map(r=>String(r.period||'').trim()).filter(Boolean));
    if(active.some(x=>!x.period)&&e.rates.length)warnings.push(ratePeriods.size===1?'Cost lines without a period were assigned to the only entered indirect-rate period; confirm that allocation.':'Cost lines without a period were excluded from indirect bases because multiple rate periods exist.');
    let indirect=0;
    for(const r of [...e.rates].sort((a,b)=>Number(a.order||0)-Number(b.order||0))){
      const period=String(r.period||'').trim(),key=`${r.name}|${r.base}|${period}`.toLowerCase();
      if(used.has(key)){warnings.push(`Duplicate burden skipped: ${r.name||'unnamed rate'}`);continue;}used.add(key);
      const baseKey=`${r.base}|${period}`.toLowerCase();
      if(bases.has(baseKey)&&!r.overlapReviewed)warnings.push(`Possible overlapping indirect rates on ${r.base||'unspecified base'} for ${period||'unspecified period'}: ${bases.get(baseKey)} and ${r.name||'unnamed rate'}. Confirm both are intended.`);
      else bases.set(baseKey,r.name||'unnamed rate');
      const applicable=active.filter(x=>String(x.period||'').trim()===period||(!x.period&&ratePeriods.size===1));
      if(!applicable.length){warnings.push(`No cost lines match the indirect-rate period ${period||'(blank)'}.`);continue;}
      const directPeriod=applicable.reduce((n,x)=>n+amount(x),0);
      let base;
      if(r.base==='Direct labor')base=applicable.filter(x=>x.category==='Direct labor').reduce((n,x)=>n+amount(x),0);
      else if(r.base==='Direct costs')base=directPeriod;
      else if(r.base==='Direct plus prior indirect')base=directPeriod+(indirectByPeriod.get(period)||0);
      else {warnings.push(`Unknown allocation base: ${r.name||'unnamed rate'}`);continue;}
      const burden=Math.round(base*Number(r.rate||0)/100);
      indirect+=burden;indirectByPeriod.set(period,(indirectByPeriod.get(period)||0)+burden);
    }
    const reconciliation=new Map();
    for(const x of e.costs){
      if(!['Baseline','Revised','Incremental','Credit','Avoided cost'].includes(x.kind))continue;
      const key=[x.work,x.category,x.period].join('|').toLowerCase();
      const line=reconciliation.get(key)||{Baseline:0,Revised:0,Incremental:0,Credit:0,'Avoided cost':0,hasBaseline:false,hasRevised:false};
      line[x.kind]+=amount(x);if(x.kind==='Baseline')line.hasBaseline=true;if(x.kind==='Revised')line.hasRevised=true;reconciliation.set(key,line);
    }
    for(const [key,line] of reconciliation)if(line.hasBaseline&&line.hasRevised&&Math.abs(line.Revised-line.Baseline-line.Incremental-line.Credit-line['Avoided cost'])>1)warnings.push(`Possible baseline-to-revised reconciliation difference for ${key||'unassigned work element'}.`);
    const feeBase=e.feeBase==='Direct plus indirect'?direct+indirect:direct;
    const fee=e.feeMode==='Rate'?Math.round(feeBase*Number(e.feeRate||0)/100):cents(e.feeFixed);
    return {incurred:incurred/100,estimated:estimated/100,credits:credits/100,direct:direct/100,indirect:indirect/100,fee:fee/100,net:(direct+indirect+fee)/100,warnings};
  }
  function issues(e){
    const out=[];const contractual=e.notices.filter(isContractualNotice);
    if(e.basisStatus!=='Basis Identified'||!e.clause||!e.baseline||!e.change)out.push('Contractual basis, baseline, change, or clause needs review');
    if(e.authority==='Not confirmed'||e.authority==='Further clarification required')out.push('Direction authority or contractual basis needs clarification');
    if(!contractual.length&&e.notificationStatus!=='Not applicable')out.push('Contractual notice requirements have not been assessed');
    if(contractual.some(n=>!noticeVerified(n)))out.push('Contractual notice deadline or clause needs verification');
    if(contractual.some(n=>noticeVerified(n)&&!n.submitted&&noticeDeadline(n)<today()))out.push('Confirmed contractual notice may be overdue');
    if(e.notificationStatus==='Notices submitted'&&contractual.some(n=>!n.submitted))out.push('Notice status conflicts with an unsubmitted contractual notice');
    if(e.notificationStatus==='Not applicable'&&contractual.length)out.push('Notice status conflicts with a contractual notice record');
    if(!e.assignments.length&&e.departmentStatus!=='Not applicable')out.push('Departmental assessment has not been recorded');
    if(e.assignments.some(a=>!['Complete','Not applicable'].includes(a.status)))out.push('Departmental inputs remain open');
    if(e.departmentStatus==='Inputs complete'&&e.assignments.some(a=>!['Complete','Not applicable'].includes(a.status)))out.push('Department status conflicts with open assignments');
    if(!e.costs.length&&e.costStatus!=='Not applicable')out.push('Cost assessment has not been recorded');
    if(e.costs.some(c=>c.review!=='Reviewed'))out.push('Cost review remains open');
    if(e.costStatus==='Reviewed'&&e.costs.some(c=>c.review!=='Reviewed'))out.push('Cost status conflicts with unreviewed elements');
    if(costSummary(e).warnings.length)out.push('Cost reconciliation or indirect-rate review remains open');
    if(!e.schedule.length&&e.scheduleStatus!=='Not applicable')out.push('Schedule assessment has not been recorded');
    if(!e.evidence.length)out.push('Evidence register is empty');
    const ids=new Set(e.evidence.map(x=>x.identifier).filter(Boolean));
    if(ids.size<e.evidence.filter(x=>x.identifier).length)out.push('Evidence register has duplicate identifiers');
    if([...e.costs,...e.schedule].some(x=>!x.evidence||!ids.has(x.evidence)))out.push('Cost or schedule evidence ID is missing from the register');
    if(e.chronology.some(x=>x.verification==='Verified fact'&&(!x.evidenceId||!ids.has(x.evidenceId))))out.push('Verified chronology fact lacks a linked evidence ID');
    const targets=new Set([...e.chronology,...e.costs,...e.schedule].map(x=>x.id));
    if(e.evidence.some(x=>x.related&&!targets.has(x.related)))out.push('Evidence register contains an unresolved related-record ID');
    if(e.evidence.some(x=>x.verification!=='Verified'))out.push('Evidence remains unverified');
    if(e.certification?.required==='Pending determination'||!e.certification?.required)out.push('Determine whether REA certification is required under the incorporated clause');
    if(!e.reviews.length)out.push('Internal review or its non-applicability has not been documented');
    if(e.reviews.some(r=>!['Approved','Not applicable'].includes(r.status)))out.push('Internal review remains open');
    if(e.approvalStatus==='Approved'&&(!e.reviews.length||e.reviews.some(r=>r.status!=='Approved')))out.push('Approval status conflicts with review records');
    if(e.submissions?.length&&e.governmentStatus==='Not submitted')out.push('Recorded submission conflicts with Government response status');
    if(['Fully Resolved','Partially Resolved'].includes(e.settlementStatus)&&!e.resolution?.modification)out.push('Resolution recorded without modification reference');
    return [...new Set(out)];
  }
  const api={uid,today,esc,validDate,addDays,dayDifference,cents,money,parseCSV,toCSV,fresh,blankEvent,validateBackup,normalizeState,noticeDeadline,isContractualNotice,noticeVerified,costSummary,issues};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.REACore=api;
})(typeof window!=='undefined'?window:globalThis);
