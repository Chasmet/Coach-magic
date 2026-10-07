(() => {
  const API = 'https://api.github.com/repos/Chasmet/Coach-magic/releases/latest';
  const AUTO_KEY = 'coachMagicAutoUpdate';
  const LAST_CHECK_KEY = 'coachMagicLastUpdateCheck';
  const CHECK_INTERVAL = 6 * 60 * 60 * 1000;
  const CURRENT_VERSION = String(window.COACH_MAGIC_VERSION || '1.0.0').replace(/^v/i, '');
  let latest = null;
  let checking = false;

  const style = document.createElement('style');
  style.textContent = `
    .settings-switch{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#ffffff0b;border:1px solid #ffffff22;border-radius:18px;padding:14px;margin:10px 0}.settings-switch b{display:block}.settings-switch small{display:block;color:#a9b6ca;margin-top:4px;line-height:1.35}.switch{position:relative;width:54px;height:30px;flex:none}.switch input{display:none}.slider{position:absolute;inset:0;border-radius:999px;background:#ffffff26;border:1px solid #ffffff33;transition:.2s}.slider:before{content:'';position:absolute;width:22px;height:22px;left:3px;top:3px;border-radius:50%;background:white;transition:.2s}.switch input:checked+.slider{background:#2388ff;border-color:#2388ff}.switch input:checked+.slider:before{transform:translateX(24px)}
    .update-state{margin-top:12px;padding:12px;border-radius:16px;background:#ffffff0b;border:1px solid #ffffff22;line-height:1.45}.update-state.ok{border-color:#85e64688}.update-state.warn{border-color:#ff9d2e88}.update-state.bad{border-color:#ff535388}.update-version{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #ffffff16}.update-version:last-child{border-bottom:0}.update-version span{color:#a9b6ca}.settings-actions{display:grid;gap:9px;margin-top:12px}.settings-note{font-size:12px;color:#a9b6ca;line-height:1.45;margin-top:10px}
  `;
  document.head.appendChild(style);

  function autoEnabled(){ const v=localStorage.getItem(AUTO_KEY); return v===null ? true : v==='1'; }
  function setAutoEnabled(v){ localStorage.setItem(AUTO_KEY, v ? '1' : '0'); }
  function cleanVersion(v){ return String(v||'').replace(/^v/i,'').trim(); }
  function compareVersions(a,b){
    const A=cleanVersion(a).split('.').map(x=>parseInt(x,10)||0), B=cleanVersion(b).split('.').map(x=>parseInt(x,10)||0);
    for(let i=0;i<Math.max(A.length,B.length);i++){ const x=A[i]||0,y=B[i]||0; if(x>y)return 1;if(x<y)return -1; }
    return 0;
  }
  async function fetchLatest(){
    const r=await fetch(`${API}?t=${Date.now()}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!r.ok) throw new Error(`GitHub ${r.status}`);
    const data=await r.json();
    const apk=(data.assets||[]).find(a=>/\.apk$/i.test(a.name));
    if(!apk) throw new Error('Aucun APK trouvé dans la dernière Release');
    latest={versionName:cleanVersion(data.tag_name),tag:data.tag_name,url:apk.browser_download_url,published:data.published_at};
    return latest;
  }
  function ensureModal(){
    let modal=document.getElementById('settingsUpdateModal');
    if(modal)return modal;
    modal=document.createElement('div');modal.id='settingsUpdateModal';modal.className='modal';modal.innerHTML='<div class="sheet" id="settingsUpdateSheet"></div>';
    modal.addEventListener('click',e=>{if(e.target===modal)closeSettings()});document.body.appendChild(modal);return modal;
  }
  function closeSettings(){const m=document.getElementById('settingsUpdateModal');if(m)m.classList.remove('show')}
  async function openSettings(){
    ensureModal().classList.add('show');
    const sheet=document.getElementById('settingsUpdateSheet');
    sheet.innerHTML=`<div class="editor-head"><button class="back" id="settingsBack">←</button><div class="editor-title"><h2>Réglages</h2><p>Coach Magic</p></div><div style="font-size:25px">⚙️</div></div>
      <div class="section-title"><span>⬆️</span>MISES À JOUR</div>
      <div class="settings-switch"><div><b>Recherche automatique</b><small>Vérifie les nouvelles versions au démarrage et te prévient.</small></div><label class="switch"><input id="autoUpdateToggle" type="checkbox" ${autoEnabled()?'checked':''}><span class="slider"></span></label></div>
      <div id="updateState" class="update-state"><div class="update-version"><span>Version installée</span><b>${CURRENT_VERSION}</b></div><div class="update-version"><span>Dernière version</span><b id="latestVersion">—</b></div></div>
      <div class="settings-actions"><button class="btn full" id="checkUpdateBtn">Vérifier maintenant</button><button class="btn full" id="installUpdateBtn" style="display:none">Télécharger la mise à jour</button></div>
      <div class="section-title"><span>💾</span>SAUVEGARDE</div>
      <div class="settings-actions"><button class="btn ghost full" id="backupBtn">Copier ma sauvegarde</button><button class="btn ghost full" id="restoreBtn">Restaurer une sauvegarde</button></div>
      <div class="settings-note">La mise à jour ouvre l’APK officiel de la dernière GitHub Release. Android te demandera ensuite de confirmer l’installation.</div>`;
    document.getElementById('settingsBack').onclick=closeSettings;
    document.getElementById('autoUpdateToggle').onchange=e=>setAutoEnabled(e.target.checked);
    document.getElementById('checkUpdateBtn').onclick=()=>checkForUpdates(false);
    document.getElementById('installUpdateBtn').onclick=downloadLatest;
    document.getElementById('backupBtn').onclick=backupData;
    document.getElementById('restoreBtn').onclick=restoreData;
    if(latest)paintState(latest);
  }
  function paintState(release){
    const state=document.getElementById('updateState'),latestEl=document.getElementById('latestVersion'),install=document.getElementById('installUpdateBtn');
    if(!state||!latestEl||!install)return;
    latestEl.textContent=release.versionName||release.tag;
    if(compareVersions(release.versionName,CURRENT_VERSION)>0){state.className='update-state warn';install.style.display='block';install.textContent=`Télécharger ${release.versionName}`;}
    else{state.className='update-state ok';install.style.display='none';if(!state.querySelector('.up-to-date'))state.insertAdjacentHTML('beforeend','<div class="up-to-date" style="margin-top:8px;color:#c8ffad"><b>✓ Application à jour</b></div>');}
  }
  async function checkForUpdates(silent){
    if(checking)return;checking=true;const btn=document.getElementById('checkUpdateBtn'),state=document.getElementById('updateState');
    try{if(btn){btn.disabled=true;btn.textContent='Vérification…'}const release=await fetchLatest();localStorage.setItem(LAST_CHECK_KEY,String(Date.now()));if(silent&&compareVersions(release.versionName,CURRENT_VERSION)>0)await openSettings();paintState(release);}
    catch(err){if(!silent){if(state){state.className='update-state bad';state.insertAdjacentHTML('beforeend',`<div style="margin-top:8px">Impossible de vérifier : ${String(err.message||err)}</div>`)}else alert('Impossible de vérifier les mises à jour.')}}
    finally{checking=false;if(btn){btn.disabled=false;btn.textContent='Vérifier maintenant'}}
  }
  async function downloadLatest(){
    try{if(!latest)await fetchLatest();const a=document.createElement('a');a.href=latest.url;a.target='_blank';a.rel='noopener';a.download='Coach-Magic.apk';document.body.appendChild(a);a.click();a.remove();}
    catch(err){alert(`Mise à jour impossible : ${String(err.message||err)}`)}
  }
  async function backupData(){
    const data=JSON.stringify({format:'coach-magic-backup-v1',createdAt:new Date().toISOString(),storage:{coachMagicV6:localStorage.getItem('coachMagicV6')}});
    try{await navigator.clipboard.writeText(data);alert('Sauvegarde copiée. Garde ce texte jusqu’à ce que la nouvelle version soit installée.');}
    catch(_){prompt('Copie cette sauvegarde :',data)}
  }
  function restoreData(){
    const raw=prompt('Colle ici la sauvegarde Coach Magic :');if(!raw)return;
    try{const data=JSON.parse(raw);if(data.format!=='coach-magic-backup-v1')throw new Error('format');if(data.storage&&data.storage.coachMagicV6)localStorage.setItem('coachMagicV6',data.storage.coachMagicV6);alert('Sauvegarde restaurée.');location.reload();}
    catch(_){alert('Sauvegarde invalide.')}
  }
  function addSettingsButton(){const row=document.querySelector('.top .row');if(!row||document.getElementById('settingsTopButton'))return;const right=row.lastElementChild,btn=document.createElement('button');btn.id='settingsTopButton';btn.className='ib';btn.type='button';btn.textContent='⚙️';btn.title='Réglages';btn.onclick=openSettings;row.insertBefore(btn,right)}
  function startupCheck(){if(!autoEnabled())return;const last=Number(localStorage.getItem(LAST_CHECK_KEY)||0);if(Date.now()-last<CHECK_INTERVAL)return;setTimeout(()=>checkForUpdates(true),1400)}
  addSettingsButton();startupCheck();window.CoachMagicUpdates={openSettings,checkForUpdates,downloadLatest};
})();
