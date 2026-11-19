/* PWA install + offline update control. No frameworks; stays inside the published app scope. */
(() => {
  'use strict';
  const installBtn=document.getElementById('pwaInstall');
  const updateBar=document.getElementById('pwaUpdate');
  const applyBtn=document.getElementById('pwaApply');
  const laterBtn=document.getElementById('pwaLater');
  let deferredInstall=null, registration=null, updateAccepted=false;
  const installed=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;

  window.addEventListener('beforeinstallprompt', event=>{
    event.preventDefault();
    deferredInstall=event;
    if (installBtn && !installed()) installBtn.hidden=false;
  });
  window.addEventListener('appinstalled',()=>{
    deferredInstall=null;
    if (installBtn) installBtn.hidden=true;
  });
  installBtn?.addEventListener('click',async()=>{
    if (!deferredInstall) return;
    const prompt=deferredInstall;deferredInstall=null;
    installBtn.hidden=true;
    try {await prompt.prompt();await prompt.userChoice;} catch (_) { /* browser decides */ }
  });
  function showUpdate(){
    if (registration?.waiting && navigator.serviceWorker.controller && updateBar){
      updateBar.hidden=false;
    }
  }
  laterBtn?.addEventListener('click',()=>{if(updateBar)updateBar.hidden=true;});
  applyBtn?.addEventListener('click',()=>{
    if(!registration?.waiting)return;
    updateAccepted=true;
    registration.waiting.postMessage({type:'SKIP_WAITING'});
    applyBtn.disabled=true;
  });
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{
    if(updateAccepted){updateAccepted=false;location.reload();}
  });
  async function register(){
    if(!('serviceWorker' in navigator) || !window.isSecureContext)return;
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      if(registration.waiting)showUpdate();
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{
          if(worker.state==='installed')showUpdate();
        });
      });
      // Check once on load; then when the user returns to the app.
      registration.update().catch(()=>{});
      document.addEventListener('visibilitychange',()=>{
        if(!document.hidden)registration?.update().catch(()=>{});
      });
    }catch(error){console.warn('PWA registration unavailable:',error);}
  }
  if(document.readyState==='complete')register();
  else window.addEventListener('load',register,{once:true});
  window.__factorioPWAStatus=()=>({registered:Boolean(registration),waiting:Boolean(registration?.waiting),standalone:installed()});
})();
