// Versioned local progress; legacy evidence is retained without claiming new assessments.
(() => {
  'use strict';
  const key='digital-superpowers-progress-v3', oldKey='digital-minimum-progress-v2';
  const statuses=['new','training','almost','mastered'];
  let persistent=true, state={schemaVersion:3,skills:{},legacy:{},migrated:false};
  function parse(raw){try { const value=JSON.parse(raw || '{}');return value && typeof value==='object' && !Array.isArray(value)?value:{}; }catch{return {};}}
  function persist(){try {localStorage.setItem(key,JSON.stringify(state));} catch {persistent=false;}}
  try {
    const stored=parse(localStorage.getItem(key));
    if(stored.schemaVersion===3){state={...state,...stored,skills:parse(JSON.stringify(stored.skills)),legacy:parse(JSON.stringify(stored.legacy))};}
    if(!state.migrated){
      state.legacy=parse(localStorage.getItem(oldKey));
      // Old assessments allowed coached retries and do not prove the new independent checks.
      for(const [id,status] of Object.entries(state.legacy)){
        const skillKey=window.AppData?.legacyKeys[id];
        if(skillKey && statuses.includes(status) && status!=='new' && !state.skills[skillKey])
          state.skills[skillKey]={status:'training',assessmentVersion:1,needsAssessment:true};
      }
      state.migrated=true; persist();
    }
  } catch {persistent=false;}
  function known(skillKey){return typeof skillKey==='string' && window.AppData?.skills.some(s=>s.skillKey===skillKey);}
  window.ProgressStore={key,
    get isPersistent(){return persistent;},
    read(){return Object.fromEntries((window.AppData?.skills || []).map(s=>[s.skillKey,this.get(s.skillKey,s.assessmentVersion)]));},
    get(skillKey,version=1){
      if(!known(skillKey))return 'new';
      const value=state.skills[skillKey];
      return value && value.assessmentVersion===version && statuses.includes(value.status)?value.status:'new';
    },
    set(skillKey,status,version=1){
      if(!known(skillKey) || !statuses.includes(status) || !Number.isInteger(version) || version<1)return;
      const previous=state.skills[skillKey], best=this.get(skillKey,version);
      const next=statuses.indexOf(status)>statuses.indexOf(best)?status:best;
      state.skills[skillKey]={status:next,assessmentVersion:version};
      if(previous && previous.assessmentVersion!==version)state.skills[skillKey].history=[...(previous.history || []),{status:previous.status,assessmentVersion:previous.assessmentVersion}];
      else if(previous?.history)state.skills[skillKey].history=previous.history;
      persist();
    },
    reset(){state={schemaVersion:3,skills:{},legacy:{},migrated:true};this.works={};for(const workKey of ['postcard','pixel-code']){try{localStorage.removeItem('digital-superpowers-work-'+workKey);}catch{persistent=false;}}persist();},
    getWork(workKey){if(this.works?.[workKey])return JSON.parse(JSON.stringify(this.works[workKey]));try{return parse(localStorage.getItem('digital-superpowers-work-'+workKey));}catch{return {};}},
    saveWork(workKey,value){this.works=this.works || {};this.works[workKey]=JSON.parse(JSON.stringify(value));try{localStorage.setItem('digital-superpowers-work-'+workKey,JSON.stringify(value));}catch{persistent=false;}},
    works:{}
  };
})();
