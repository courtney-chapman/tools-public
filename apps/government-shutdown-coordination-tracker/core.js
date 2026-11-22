(function(root){
'use strict';
const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;};
const tri=['Yes','No','Unknown'];
const riskLevels=['None','Low','Medium','High'];
const requestStatuses=['Not Needed','Not Sent','Sent','Follow-up Needed'];
const receivedStatuses=['Pending','Continue','Stop','Partial Stop','Other'];
const actionStatuses=['Not Started','Requested','In Progress','Complete','N/A'];
const phaseNames=['Before','During','Reopening'];
const contractTypes=['','FFP','T&M','Labor Hour','CPFF','CPIF','CPAF','Other'];
const standardChecklist=[
  ['Before','Review contract funding and potential limitations','Contracts / Finance'],
  ['Before','Assess potential performance impact','Contracts / Program Management'],
  ['Before','Request Government direction, if needed','Contracts'],
  ['Before','Confirm employees at Government sites','HR / Program Management'],
  ['Before','Identify major procurements potentially affected','Procurement'],
  ['Before','Identify affected subcontracts','Subcontracts'],
  ['Before','Identify affected small business subcontracts','Subcontracts / Small Business'],
  ['Before','Communicate preliminary shutdown guidance internally','Contracts'],
  ['During','Document Government direction received','Contracts'],
  ['During','Communicate applicable direction internally','Contracts'],
  ['During','Confirm current performance status','Program Management'],
  ['During','Coordinate subcontract direction, if required','Contracts / Subcontracts'],
  ['During','Confirm procurement impacts and required actions','Procurement'],
  ['During','Confirm workforce impact summary','HR / Program Management'],
  ['During','Identify contractual notices or modifications needed','Contracts'],
  ['During','Coordinate documentation of shutdown impacts','Contracts / Finance / Program Management'],
  ['During','Follow up on outstanding Government questions','Contracts'],
  ['Reopening','Confirm Government restart direction, if required','Contracts'],
  ['Reopening','Confirm performance and funding status','Contracts / Finance / Program Management'],
  ['Reopening','Communicate restart direction internally','Contracts'],
  ['Reopening','Coordinate subcontractor restart','Subcontracts'],
  ['Reopening','Confirm operational readiness','Program Management / Operations'],
  ['Reopening','Review schedule impacts','Contracts / Program Management'],
  ['Reopening','Determine whether contract modifications are needed','Contracts'],
  ['Reopening','Coordinate potential cost or schedule recovery review','Contracts / Finance'],
  ['Reopening','Close outstanding shutdown actions','Contracts']
];
function freshState(){const id=uid();return {schemaVersion:1,events:[{id,title:'Shutdown coordination',description:'',startDate:'',endDate:'',status:'Preparing'}],contracts:[],assessments:[],directions:[],actions:[],attachments:[],selectedEventId:id,selectedContractId:null};}
function newContract(number,customer='',programName=''){return {id:uid(),contractNumber:String(number).trim(),customer:String(customer).trim(),programName:String(programName).trim(),endUser:'',contractType:'',popStart:'',popEnd:'',fundedThrough:'',notes:''};}
function blankImpact(){return {employeesAtSite:'Unknown',employeesCount:'',employeesNotes:'',procurementsAffected:'Unknown',procurementActionRequired:'Unknown',procurementNotes:'',subcontractsAffected:'Unknown',smallBusinessAffected:'Unknown',subcontractDirectionRequired:'Unknown',subcontractDirectionSent:'Unknown',subcontractNotes:'',otherNotes:''};}
function newAssessment(eventId,contractId){return {id:uid(),shutdownEventId:eventId,contractId,riskLevel:'',performanceStatus:'Unknown',impactSummary:blankImpact(),notes:'',updatedAt:new Date().toISOString()};}
function newAction(assessmentId,action='',phase='Before',department=''){return {id:uid(),assessmentId,action,phase,department,owner:'',status:'Not Started',dueDate:'',notes:'',attachmentIds:[],templateKey:''};}
function applyChecklist(state,assessmentId){const existing=new Set(state.actions.filter(a=>a.assessmentId===assessmentId).map(a=>a.templateKey).filter(Boolean));const created=[];standardChecklist.forEach(([phase,action,department],index)=>{const templateKey=`standard-${index}`;if(!existing.has(templateKey)){const item=newAction(assessmentId,action,phase,department);item.templateKey=templateKey;created.push(item);}});state.actions.push(...created);return created.length;}
function isOpen(action){return action.status!=='Complete'&&action.status!=='N/A';}
function isOverdue(action,asOf=today()){return isOpen(action)&&!!action.dueDate&&action.dueDate<asOf;}
function currentDirection(state,assessmentId,category){return state.directions.find(d=>d.assessmentId===assessmentId&&d.directionCategory===category&&d.isCurrent)||null;}
function eventRows(state,eventId,asOf=today()){return state.assessments.filter(a=>a.shutdownEventId===eventId).map(a=>{const contract=state.contracts.find(c=>c.id===a.contractId);if(!contract)return null;const actions=state.actions.filter(x=>x.assessmentId===a.id);const open=actions.filter(isOpen);const requested=currentDirection(state,a.id,'requested');const received=currentDirection(state,a.id,'received');return {contract,assessment:a,actions,open,requested:requested?.status==='Not Needed'?'N/A':requested?.status||'Not Sent',received:received?.status||'Pending',openActions:open.length,overdueActions:open.filter(x=>isOverdue(x,asOf)).length,nextAction:open.slice().sort((x,y)=>(x.dueDate||'9999').localeCompare(y.dueDate||'9999'))[0]||null};}).filter(Boolean);}
function summary(rows){return {total:rows.length,riskLevel:rows.filter(r=>riskLevels.includes(r.assessment.riskLevel)&&r.assessment.riskLevel!=='None').length,awaitingDirection:rows.filter(r=>r.received==='Pending'&&r.requested!=='N/A').length,openActions:rows.reduce((n,r)=>n+r.openActions,0),overdueActions:rows.reduce((n,r)=>n+r.overdueActions,0)};}
function parseCSV(text){const rows=[];let row=[],field='',quoted=false;const source=String(text).replace(/^\uFEFF/,'');for(let i=0;i<source.length;i++){const c=source[i];if(quoted){if(c==='"'&&source[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"'){if(field)throw Error(`Unexpected quote near row ${rows.length+1}`);quoted=true;}else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&source[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v!==''))rows.push(row);row=[];}else field+=c;}if(quoted)throw Error('CSV has an unclosed quoted field');row.push(field);if(row.some(v=>v!==''))rows.push(row);if(!rows.length)return [];const headers=rows.shift().map(x=>x.trim());if(new Set(headers).size!==headers.length)throw Error('CSV has duplicate headers');return rows.map((cells,index)=>{if(cells.length!==headers.length)throw Error(`CSV row ${index+2} has ${cells.length} columns; expected ${headers.length}`);return Object.fromEntries(headers.map((key,i)=>[key,cells[i].trim()]));});}
function toCSV(rows,headers){const quote=value=>{const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;};return [headers.join(','),...rows.map(row=>headers.map(h=>quote(row[h])).join(','))].join('\r\n')+'\r\n';}
function validDate(value){if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(`${value}T00:00:00Z`);return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;}
const contractHeaders=['ContractNumber','Customer','ProgramName','EndUser','ContractType','POPStart','POPEnd','FundedThrough','RiskLevel','PerformanceStatus'];
const requiredContractHeaders=contractHeaders.filter(header=>header!=='ProgramName');
const actionHeaders=['ContractNumber','Action','Phase','Department','Status','DueDate','Notes'];
function previewContracts(state,rows){const seen=new Set();return rows.map((row,index)=>{let errors=[];const number=(row.ContractNumber||'').trim();if(!number)errors.push('ContractNumber is required');const key=number.toLowerCase();if(seen.has(key))errors.push('Duplicate number within CSV');seen.add(key);for(const date of ['POPStart','POPEnd','FundedThrough'])if(!validDate(row[date]))errors.push(`${date} is not a valid date`);if(row.ContractType&&!contractTypes.includes(row.ContractType))errors.push('Invalid ContractType');if(row.RiskLevel&&!riskLevels.includes(row.RiskLevel))errors.push('Invalid RiskLevel');if(row.PerformanceStatus&&!['Continuing','Impacted','Stopped','Unknown'].includes(row.PerformanceStatus))errors.push('Invalid PerformanceStatus');const existing=state.contracts.find(c=>c.contractNumber.toLowerCase()===key);return {index:index+2,row,errors,existing};});}
function previewActions(state,eventId,rows){return rows.map((row,index)=>{let errors=[];const number=(row.ContractNumber||'').trim();const contract=state.contracts.find(c=>c.contractNumber.toLowerCase()===number.toLowerCase());const assessment=state.assessments.find(a=>a.shutdownEventId===eventId&&a.contractId===contract?.id);if(!number||!contract||!assessment)errors.push('ContractNumber is not in this event');if(!(row.Action||'').trim())errors.push('Action is required');if(row.Phase&&!phaseNames.includes(row.Phase))errors.push('Invalid Phase');if(row.Status&&!actionStatuses.includes(row.Status))errors.push('Invalid Status');if(!validDate(row.DueDate))errors.push('Invalid DueDate');return {index:index+2,row,errors,assessment};});}
function migrateRisk(data){let changed=false;for(const assessment of data.assessments||[]){if(!('riskLevel' in assessment)){assessment.riskLevel=assessment.atRisk==='No'?'None':'';delete assessment.atRisk;changed=true;}}return changed;}
function validateBackup(data){if(!data||data.schemaVersion!==1)throw Error('Unsupported backup format or version');for(const key of ['events','contracts','assessments','directions','actions','attachments'])if(!Array.isArray(data[key]))throw Error(`Backup is missing ${key}`);const ids={};for(const key of ['events','contracts','assessments','directions','actions','attachments']){ids[key]=new Set();for(const item of data[key]){if(!item||typeof item.id!=='string'||ids[key].has(item.id))throw Error(`Invalid or duplicate ID in ${key}`);ids[key].add(item.id);}}for(const a of data.assessments)if(!ids.events.has(a.shutdownEventId)||!ids.contracts.has(a.contractId))throw Error('Assessment references a missing event or contract');for(const d of data.directions)if(!ids.assessments.has(d.assessmentId))throw Error('Direction references a missing assessment');for(const a of data.actions)if(!ids.assessments.has(a.assessmentId))throw Error('Action references a missing assessment');const parentSets={contract:ids.contracts,direction:ids.directions,action:ids.actions,impact:ids.assessments};for(const file of data.attachments)if(!parentSets[file.parentType]?.has(file.parentId))throw Error('Attachment references a missing parent');if(data.selectedEventId&&!ids.events.has(data.selectedEventId))throw Error('Selected event is missing');return true;}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const api={uid,today,tri,riskLevels,migrateRisk,requestStatuses,receivedStatuses,actionStatuses,phaseNames,standardChecklist,freshState,newContract,newAssessment,newAction,applyChecklist,isOpen,isOverdue,currentDirection,eventRows,summary,parseCSV,toCSV,validDate,contractHeaders,requiredContractHeaders,actionHeaders,previewContracts,previewActions,validateBackup,escapeHTML};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TrackerCore=api;
})(typeof window!=='undefined'?window:globalThis);
