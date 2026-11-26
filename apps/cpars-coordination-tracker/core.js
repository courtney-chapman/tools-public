'use strict';
const CPARS = (() => {
  const TIMING = Object.freeze({farCommentDays:14, guidanceCompletionDays:120, defaultAvailabilityDays:30});
  const FACTORS = ['Technical/Quality','Cost Control','Schedule/Timeliness','Management/Business Relations','Small Business Subcontracting','Other'];
  const RATINGS = ['Not recorded','Exceptional','Very Good','Satisfactory','Marginal','Unsatisfactory','Not Applicable'];
  const DEPARTMENTS = ['Contracts','Program Management','Finance','Quality','Procurement','Small Business','Engineering','Operations','Legal','Leadership'];
  const defaultSettings=()=>({availabilityDays:30,internalResponseDays:10,advanceDays:60,followupDays:14,warningDays:14,departments:[...DEPARTMENTS]});
  function normalizeState(raw){
    if(!raw||![1,2].includes(raw.version))throw Error('Unrecognized backup version.');
    for(const key of ['contracts','evaluations','outreach','assignments','actions'])if(!Array.isArray(raw[key]))throw Error(`Missing ${key} records.`);
    const state={...raw,version:2,reviews:Array.isArray(raw.reviews)?raw.reviews:[],subfactors:Array.isArray(raw.subfactors)?raw.subfactors:[],settings:{...defaultSettings(),...(raw.settings||{})}};
    state.settings.departments=[...new Set((Array.isArray(state.settings.departments)?state.settings.departments:DEPARTMENTS).map(x=>String(x).trim()).filter(Boolean))];
    state.contracts=raw.contracts.map(c=>({...c,reportingLevel:c.reportingLevel||((c.orderNumber||'').trim()?'Order':'Contract')}));
    state.evaluations=raw.evaluations.map(e=>({...e,factors:e.factors||{},history:Array.isArray(e.history)?e.history:[]}));
    return state;
  }
  const iso = value => {if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';const [y,m,d]=value.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));return date.toISOString().slice(0,10)===value?value:'';};
  const today = () => {const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  function addDays(value,days){if(!iso(value))return '';const [y,m,d]=value.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d+days));return date.toISOString().slice(0,10);}
  function addYears(value,years){if(!iso(value))return '';const [y,m,d]=value.split('-').map(Number);const last=new Date(Date.UTC(y+years,m,0)).getUTCDate();return [y+years,String(m).padStart(2,'0'),String(Math.min(d,last)).padStart(2,'0')].join('-');}
  function diffDays(a,b){if(!iso(a)||!iso(b))return null;const ms=v=>{const [y,m,d]=v.split('-').map(Number);return Date.UTC(y,m-1,d);};return Math.round((ms(b)-ms(a))/86400000);}
  function cycles(contract){if(contract.applicability!=='Applicable'||contract.archived||!iso(contract.popStart)||!iso(contract.popEnd))return [];const end=contract.actualCompletion && contract.actualCompletion<contract.popEnd?contract.actualCompletion:contract.popEnd; if(end<contract.popStart)return [];const out=[];let start=contract.popStart;let count=0;while(start<=end&&count++<60){const anniversary=addDays(addYears(start,1),-1);const periodEnd=anniversary<end?anniversary:end;out.push({periodStart:start,periodEnd,type:periodEnd===end?'Final':'Annual'});start=addDays(periodEnd,1);}return out;}
  function suggestedDates(e,settings){return {expectedAvailability:e.periodEnd?addDays(e.periodEnd,Number(settings.availabilityDays)||TIMING.defaultAvailabilityDays):'',reportingDeadline:e.periodEnd?addDays(e.periodEnd,TIMING.guidanceCompletionDays):'',commentDeadline:e.notificationDate?addDays(e.notificationDate,TIMING.farCommentDays):'',internalTarget:e.notificationDate?addDays(e.notificationDate,Math.min(Number(settings.internalResponseDays)||10,13)):''};}
  function evaluationDateError(e){
    if(!iso(e.periodStart)||!iso(e.periodEnd)||e.periodEnd<e.periodStart)return 'Enter a valid evaluation period.';
    if(e.notificationDate&&(!iso(e.notificationDate)||e.notificationDate<e.periodEnd))return 'CPARS notification cannot precede the evaluation period end.';
    if(e.submissionDate&&(!iso(e.submissionDate)||!e.notificationDate||e.submissionDate<e.notificationDate))return 'Response submission requires a notification and cannot precede it.';
    if(e.finalizationDate&&(!iso(e.finalizationDate)||e.finalizationDate<e.periodEnd||e.notificationDate&&e.finalizationDate<e.notificationDate||e.submissionDate&&e.finalizationDate<e.submissionDate))return 'Government finalization cannot precede the period end, notification, or recorded submission.';
    if(e.commentDeadline&&e.notificationDate&&(!iso(e.commentDeadline)||e.commentDeadline<e.notificationDate))return 'The comment deadline cannot precede notification.';
    return '';
  }
  function removeSampleRecords(state){
    const sampleIds=new Set(state.evaluations.filter(x=>x.sample).map(x=>x.id));
    const retained=new Set([...state.outreach,...state.assignments,...state.actions,...(state.reviews||[]),...(state.subfactors||[])].filter(x=>!x.sample&&sampleIds.has(x.evaluationId)).map(x=>x.evaluationId));
    const keptContracts=new Set(state.evaluations.filter(x=>retained.has(x.id)||!x.sample).map(x=>x.contractId));
    for(const key of ['outreach','assignments','actions','reviews','subfactors'])if(state[key])state[key]=state[key].filter(x=>!x.sample);
    state.evaluations=state.evaluations.filter(x=>!x.sample||retained.has(x.id));
    state.contracts=state.contracts.filter(x=>!x.sample||keptContracts.has(x.id));
    for(const x of state.evaluations)if(retained.has(x.id))x.sample=false;
    for(const x of state.contracts)if(keptContracts.has(x.id))x.sample=false;
    return retained.size;
  }
  function csvRows(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV has an unclosed quote.');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}return rows;}
  const csvCell=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const csv=(headers,rows)=>'\uFEFF'+[headers.map(csvCell).join(','),...rows.map(r=>headers.map(h=>csvCell(r[h])).join(','))].join('\r\n');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  return {TIMING,FACTORS,RATINGS,DEPARTMENTS,defaultSettings,normalizeState,iso,today,addDays,addYears,diffDays,cycles,suggestedDates,evaluationDateError,removeSampleRecords,csvRows,csv,esc,uid};
})();
if(typeof module!=='undefined')module.exports=CPARS;
