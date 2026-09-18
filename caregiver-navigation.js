(()=>{'use strict';
if(window.__CCNER_CARE_NAV__)return;window.__CCNER_CARE_NAV__=true;
function pageItems(){return [...document.querySelectorAll('.side .nav button')].map(b=>({id:b.dataset.page,label:b.textContent.trim()}))}
function currentTitle(){return document.querySelector('.top h1')?.textContent?.trim()||'Dashboard'}
function build(){
 const shell=document.querySelector('.shell'),side=document.querySelector('.side'),main=document.querySelector('.main');
 if(!shell||!side||!main)return;
 let top=document.querySelector('.care-topbar');
 if(!top){
  const old=document.querySelector('.top');
  top=document.createElement('header');top.className='care-topbar';
  const menu=document.createElement('button');menu.className='care-menu-trigger';menu.type='button';menu.setAttribute('aria-label','Open menu');menu.setAttribute('aria-expanded','false');menu.innerHTML='☰<span>Menu</span>';menu.onclick=()=>toggle(true);
  const center=document.createElement('div');center.className='care-top-center';
  const actions=document.createElement('div');actions.className='care-top-actions';
  if(old){const heading=old.firstElementChild;if(heading)center.appendChild(heading);const role=old.querySelector('.role');if(role)actions.appendChild(role);old.remove()}
  top.append(menu,center,actions);main.prepend(top);
 }
 const titleEl=top.querySelector('.care-top-center h1');if(titleEl)titleEl.textContent=currentTitle();
 let drawer=document.getElementById('careDrawer');
 if(!drawer){
  drawer=document.createElement('aside');drawer.id='careDrawer';drawer.className='care-drawer';drawer.hidden=true;
  drawer.innerHTML='<div class="care-drawer-backdrop"></div><section class="care-drawer-panel" role="dialog" aria-modal="true" aria-label="Care workspace menu"><header class="care-drawer-head"><div><p class="care-drawer-kicker">CCNER CARE</p><h2 id="careDrawerTitle">Menu</h2><p>Caregiver & Doctor Workspace</p></div><button class="care-drawer-close" type="button" aria-label="Close menu">×</button></header><nav class="care-drawer-nav"></nav><div class="care-drawer-foot"><span id="careRoleLabel">Caregiver workspace</span><small>Patient information and activity are shown according to the selected workspace.</small></div></section></aside>';
  document.body.appendChild(drawer);drawer.querySelector('.care-drawer-backdrop').onclick=()=>toggle(false);drawer.querySelector('.care-drawer-close').onclick=()=>toggle(false);
 }
 const nav=drawer.querySelector('.care-drawer-nav'),items=pageItems();nav.innerHTML='';
 items.forEach(({id,label})=>{const b=document.createElement('button');b.type='button';b.dataset.page=id;const parts=label.match(/^(\S+)\s*(.*)$/)||['','•',label];b.innerHTML='<span class="care-nav-icon">'+parts[1]+'</span><span>'+parts[2]+'</span>';b.onclick=()=>{side.querySelector('.nav button[data-page="'+CSS.escape(id)+'"]')?.click();toggle(false)};nav.appendChild(b)});
 const active=document.querySelector('.role button.active')?.textContent.trim()||'Care';const roleLabel=drawer.querySelector('#careRoleLabel');if(roleLabel)roleLabel.textContent=active+' workspace';
}
function toggle(v){const d=document.getElementById('careDrawer');if(!d)return;d.hidden=!v;document.body.classList.toggle('care-drawer-open',v);document.querySelector('.care-menu-trigger')?.setAttribute('aria-expanded',String(v));if(v)document.querySelector('#careDrawer .care-drawer-nav button')?.focus()}
const observer=new MutationObserver(()=>{const shell=document.querySelector('.shell'),side=document.querySelector('.side'),drawer=document.getElementById('careDrawer');if(shell&&side){const count=side.querySelectorAll('.nav button').length,shown=drawer?.querySelectorAll('.care-drawer-nav button').length||0;if(!document.querySelector('.care-topbar')||count!==shown)build()}});
observer.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();