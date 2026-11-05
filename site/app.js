(()=>{
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.mobile-nav');
 if(toggle&&nav){
  const close=()=>{toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть навигацию');nav.hidden=true;};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть навигацию':'Открыть навигацию');nav.hidden=!open;});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!nav.hidden){close();toggle.focus();}});
  document.addEventListener('click',e=>{if(!nav.hidden&&!e.target.closest('.site-header'))close();});
  matchMedia('(min-width: 761px)').addEventListener('change',close);
 }
 // Album strip with full-image links. Native dialog handles focus and Escape.
 const gallery=document.querySelector('.photo-gallery');
 const viewer=document.querySelector('.photo-viewer');
 if(gallery&&viewer){
  const track=gallery.querySelector('.gallery-track');
  const cards=[...gallery.querySelectorAll('[data-photo-open]')];
  const previous=gallery.querySelector('[data-gallery-prev]'),next=gallery.querySelector('[data-gallery-next]');
  const progress=gallery.querySelector('.gallery-progress>span');
  let frame=0;
  const updateAlbum=()=>{
   frame=0;const max=Math.max(0,track.scrollWidth-track.clientWidth);
   const start=Math.max(0,track.firstElementChild.offsetLeft-track.offsetLeft);
   previous.disabled=track.scrollLeft<=start+2;next.disabled=track.scrollLeft>=max-2;
   progress.style.transform=`scaleX(${Math.min(1,(track.scrollLeft+track.clientWidth)/track.scrollWidth)})`;
  };
  const moveAlbum=direction=>track.scrollTo({left:track.scrollLeft+direction*track.clientWidth*.8,behavior:motion.matches?'instant':'smooth'});
  previous.addEventListener('click',()=>moveAlbum(-1));next.addEventListener('click',()=>moveAlbum(1));
  track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateAlbum);},{passive:true});
  track.addEventListener('keydown',event=>{
   if(event.target!==track)return;
   if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();moveAlbum(event.key==='ArrowRight'?1:-1);}
   if(event.key==='Home'||event.key==='End'){event.preventDefault();track.scrollTo({left:event.key==='Home'?0:track.scrollWidth,behavior:motion.matches?'instant':'smooth'});}
  });
  window.addEventListener('resize',updateAlbum);updateAlbum();
  const image=viewer.querySelector('.viewer-image'),canvas=viewer.querySelector('.viewer-canvas');
  const caption=viewer.querySelector('.viewer-caption'),count=viewer.querySelector('.viewer-count');
  const zoomButton=viewer.querySelector('[data-viewer-zoom]'),closeButton=viewer.querySelector('[data-viewer-close]');
  const loading=viewer.querySelector('.viewer-loading');
  let current=0,opener=null,zoomed=false,pointer=null,ignoreClickUntil=0,fallback=false;
  const setZoom=enabled=>{
   const fittedWidth=image.getBoundingClientRect().width;
   zoomed=enabled;viewer.classList.toggle('is-zoomed',enabled);zoomButton.setAttribute('aria-pressed',String(enabled));
   zoomButton.setAttribute('aria-label',enabled?'Уменьшить фото':'Увеличить фото');zoomButton.querySelector('span').textContent=enabled?'Целиком':'Приблизить';
   if(enabled){
    image.style.width=`${Math.min(image.naturalWidth,Math.max(fittedWidth*2,canvas.clientWidth*1.3))}px`;
    requestAnimationFrame(()=>{canvas.scrollLeft=Math.max(0,(image.clientWidth-canvas.clientWidth)/2);canvas.scrollTop=Math.max(0,(image.clientHeight-canvas.clientHeight)/2);});
   }else{image.style.removeProperty('width');canvas.scrollTo({left:0,top:0,behavior:'instant'});}
  };
  const showPhoto=index=>{
   current=(index+cards.length)%cards.length;setZoom(false);fallback=false;loading.hidden=false;image.style.opacity='0';zoomButton.disabled=true;
   const card=cards[current],preview=card.querySelector('img');
   image.alt=preview.alt;caption.textContent=card.querySelector('.album-caption').textContent;count.textContent=`${current+1} / ${cards.length}`;
   image.src=card.href;
  };
  image.addEventListener('load',()=>{if(!viewer.open)return;loading.hidden=true;image.style.opacity='1';zoomButton.disabled=false;});
  image.addEventListener('error',()=>{
   if(!viewer.open)return;
   if(!fallback){fallback=true;image.src=cards[current].querySelector('img').src;}
   else{loading.textContent='Не удалось открыть фото';loading.hidden=false;}
  });
  cards.forEach((card,index)=>card.addEventListener('click',event=>{
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();opener=card;viewer.showModal();document.documentElement.classList.add('viewer-open');
   loading.textContent='Открываем момент…';showPhoto(index);closeButton.focus({preventScroll:true});syncAmbient();
  }));
  closeButton.addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>{document.documentElement.classList.remove('viewer-open');setZoom(false);image.removeAttribute('src');loading.hidden=true;syncAmbient();if(opener)opener.focus({preventScroll:true});});
  viewer.querySelector('[data-viewer-prev]').addEventListener('click',()=>showPhoto(current-1));
  viewer.querySelector('[data-viewer-next]').addEventListener('click',()=>showPhoto(current+1));
  zoomButton.addEventListener('click',()=>{if(image.complete&&image.naturalWidth)setZoom(!zoomed);});
  viewer.addEventListener('keydown',event=>{
   if(!zoomed&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();showPhoto(current+(event.key==='ArrowRight'?1:-1));}
  });
  canvas.addEventListener('click',event=>{
   if(Date.now()<ignoreClickUntil)return;
   if(event.target===image&&image.complete&&image.naturalWidth)setZoom(!zoomed);
   else if(event.target===canvas)viewer.close();
  });
  canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&!zoomed)pointer={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('pointerup',event=>{
   if(!pointer||zoomed)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;
   if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){ignoreClickUntil=Date.now()+450;showPhoto(current+(dx<0?1:-1));}
  });
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  window.addEventListener('resize',()=>{if(viewer.open)setZoom(false);});
 }
 const contactChooser=document.querySelector('.contact-chooser');
 if(contactChooser){
  document.addEventListener('click',event=>{if(contactChooser.open&&!contactChooser.contains(event.target))contactChooser.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&contactChooser.open){contactChooser.open=false;contactChooser.querySelector('summary').focus();}});
 }
 if('IntersectionObserver'in window&&!motion.matches){
  document.documentElement.classList.add('js-motion');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.06});
  document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
 }
 // Observe only entry/exit; no per-frame JavaScript is needed for ambient motion.
 const regions=[...document.querySelectorAll('[data-motion-region]')];
 const visibleRegions=new Set();
 document.documentElement.classList.add('js-ambient');
 function syncAmbient(){
  const paused=motion.matches||document.hidden||document.documentElement.classList.contains('viewer-open');
  document.documentElement.dataset.motionState=paused?'paused':'enabled';
  regions.forEach(region=>region.classList.toggle('motion-active',!paused&&visibleRegions.has(region)));
 }
 if('IntersectionObserver'in window){
  const ambientObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting)visibleRegions.add(entry.target);else visibleRegions.delete(entry.target);});
   syncAmbient();
  },{threshold:.01});
  regions.forEach(region=>ambientObserver.observe(region));
 }else{regions.forEach(region=>visibleRegions.add(region));}
 document.addEventListener('visibilitychange',syncAmbient);
 syncAmbient();
 const links=[...document.querySelectorAll('[data-category]')];
 const sections=links.map(a=>document.getElementById(a.dataset.category));
 const bar=document.querySelector('.category-nav');
 let scheduled=false;
 function track(){
  scheduled=false;if(!bar||!sections.length)return;
  const offset=document.querySelector('.site-header').offsetHeight+bar.offsetHeight+55;
  let active=sections[0];
  for(const section of sections)if(section.getBoundingClientRect().top<=offset)active=section;
  if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)active=sections[sections.length-1];
  links.forEach(a=>{const selected=a.dataset.category===active.id;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  const selected=links.find(a=>a.dataset.category===active.id),container=bar.firstElementChild;
  if(selected){const r=selected.getBoundingClientRect(),b=container.getBoundingClientRect();if(r.left<b.left||r.right>b.right)container.scrollTo({left:selected.offsetLeft-container.offsetLeft-20,behavior:motion.matches?'instant':'smooth'});}
 }
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(track);}},{passive:true});
 window.addEventListener('resize',track);
 motion.addEventListener('change',()=>{if(motion.matches)document.documentElement.classList.remove('js-motion');syncAmbient();track();});
 track();
})();
