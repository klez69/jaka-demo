/* WERSJA POKAZOWA: dane z panelu demonstracyjnego (localStorage tej przeglądarki), wersja danych 4 */
function demoLoad(k){try{if(localStorage.getItem('jakaDemo.v')!=='4'){localStorage.removeItem('jakaDemo.houses');localStorage.removeItem('jakaDemo.photos');localStorage.setItem('jakaDemo.v','4')}var v=localStorage.getItem('jakaDemo.'+k);return v?JSON.parse(v):null}catch(e){return null}}
function demoSaveMessage(f){
  try{
    var m=JSON.parse(localStorage.getItem('jakaDemo.messages')||'[]'),g=function(n){var e=f.elements[n];return e?e.value:''},d=new Date(),p=function(n){return String(n).padStart(2,'0')};
    m.unshift({name:g('name'),email:g('email'),phone:g('phone'),house:g('house'),message:g('message'),date:d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes()),read:false});
    localStorage.setItem('jakaDemo.messages',JSON.stringify(m));
  }catch(e){}
  return {ok:true,msg:'Wersja pokazowa: wiadomość nie została wysłana, ale zapisała się w panelu demonstracyjnym (w tej przeglądarce).'};
}
/* DANE PRZYKŁADOWE: wszystkie domy, metraże i ceny poniżej to makieta. Do podmiany na dane JAKA Sp. z o.o. */
const HOUSES_DEMO = [
  {id:'A1',type:'Wolnostojący',area:117.83,plot:520,rooms:4,price:null,status:'free'},
  {id:'A2',type:'Wolnostojący',area:117.83,plot:540,rooms:4,price:null,status:'res'},
  {id:'A3',type:'Wolnostojący',area:117.83,plot:505,rooms:4,price:null,status:'free'},
  {id:'A4',type:'Wolnostojący',area:117.83,plot:560,rooms:4,price:null,status:'free'},
  {id:'A5',type:'Wolnostojący',area:117.83,plot:530,rooms:4,price:null,status:'sold'},
  {id:'A6',type:'Wolnostojący',area:117.83,plot:610,rooms:4,price:null,status:'free'}
];
const HOUSES = (function(){var s=demoLoad('houses');return s?s.filter(function(h){return h.published!==false}):HOUSES_DEMO})();
const STATUS = {free:'Wolny',res:'Rezerwacja',sold:'Sprzedany'};
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf = new Intl.NumberFormat('pl-PL');

const HOUSE_IMGS = ['img/dom-2.webp','img/dom-3.webp','img/dom-4.webp','img/dom-5.webp','img/dom-1.webp'];
const IMG_POS = ['50% 50%','25% 50%','75% 50%'];
const TYPES = ['Szeregowiec','Bliźniak','Wolnostojący'];
const grid = document.getElementById('houses');
const segType = document.getElementById('seg-type');
const fArea = document.getElementById('f-area');
const fSort = document.getElementById('f-sort');
const freeBtn = document.getElementById('f-free');
const countEl = document.getElementById('f-count');
let typeSel = '', onlyFree = false, list = [];

const priceTxt = h => h.price ? nf.format(h.price)+' zł' : 'Cena na zapytanie';
const imgFor = h => HOUSE_IMGS[Math.max(0, HOUSES.indexOf(h)) % HOUSE_IMGS.length];

/* pasek dostępności */
(function(){
  const c = {free:0,res:0,sold:0}; HOUSES.forEach(h=>{ if(c[h.status]!==undefined) c[h.status]++ });
  const total = HOUSES.length || 1;
  document.getElementById('avail-bar').innerHTML = ['free','res','sold'].map(k=>`<span class="seg-${k}" data-w="${(c[k]/total*100).toFixed(2)}"></span>`).join('');
  document.getElementById('avail-legend').innerHTML =
    `<li><i class="dot free"></i><b>${c.free}</b> wolne</li><li><i class="dot res"></i><b>${c.res}</b> w rezerwacji</li><li><i class="dot sold"></i><b>${c.sold}</b> sprzedane</li>`;
  const bar = document.getElementById('avail');
  new IntersectionObserver((es,ob)=>es.forEach(e=>{ if(e.isIntersecting){
    bar.querySelectorAll('[data-w]').forEach(s=>s.style.width=s.dataset.w+'%'); ob.disconnect() }}),{threshold:.4}).observe(bar);
})();

/* przyciski typu zabudowy z licznikami */
const TYPES_USED = TYPES.filter(t=>HOUSES.some(h=>h.type===t));
if(TYPES_USED.length<2) segType.style.display='none';
const bucket = h => h.area<120?'s':h.area<150?'m':'l';
if(new Set(HOUSES.map(bucket)).size<2) fArea.style.display='none';
segType.innerHTML = [''].concat(TYPES_USED).map(t=>{
  const n = t ? HOUSES.filter(h=>h.type===t).length : HOUSES.length;
  return `<button type="button" data-v="${esc(t)}" class="${t===''?'on':''}">${t||'Wszystkie'} <i>${n}</i></button>`;
}).join('');
segType.addEventListener('click',e=>{
  const b = e.target.closest('button'); if(!b) return;
  typeSel = b.dataset.v; segType.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); render();
});

function filtered(){
  const a = fArea.value, s = fSort.value;
  const l = HOUSES.filter(h =>
    (!typeSel || h.type===typeSel) &&
    (!a || (a==='s' ? h.area<120 : a==='m' ? h.area>=120 && h.area<150 : h.area>=150)) &&
    (!onlyFree || h.status==='free'));
  if(s==='area-asc') l.sort((x,y)=>x.area-y.area);
  else if(s==='area-desc') l.sort((x,y)=>y.area-x.area);
  else if(s==='plot-desc') l.sort((x,y)=>y.plot-x.plot);
  return l;
}

function render(){
  list = filtered();
  countEl.textContent = 'Pokazano '+list.length+' z '+HOUSES.length;
  if(!list.length){
    grid.innerHTML = '<div class="empty">Brak domów spełniających kryteria.<br><button type="button" class="btn sm-btn" id="f-reset">Wyczyść filtry</button></div>';
    return;
  }
  grid.innerHTML = list.map((h,i)=>`
    <article class="card hcard enter" style="--d:${i*70}ms" tabindex="0" role="button" data-idx="${i}" aria-label="Dom ${esc(h.id)}, pokaż szczegóły">
      <div class="img"><img src="${imgFor(h)}" alt="" loading="lazy" style="object-position:${IMG_POS[i%3]}">
        <span class="badge ${esc(h.status)}">${esc(STATUS[h.status])}</span><span class="peek">Zobacz szczegóły</span></div>
      <div class="body">
        <div class="ctype">${esc(h.type)}</div>
        <h3>Dom ${esc(h.id)}</h3>
        <div class="meta"><span><b>${esc(nf.format(h.area))}</b> m²</span><span>działka <b>${esc(h.plot)}</b> m²</span><span><b>${esc(h.rooms)}</b> pokoi</span></div>
        <div class="row"><span class="price">${priceTxt(h)}</span><button type="button" class="ask" data-house="${esc(h.id)}">Zapytaj</button></div>
      </div></article>`).join('');
}

function resetFilters(){
  typeSel=''; onlyFree=false; fArea.value=''; fSort.value='';
  freeBtn.classList.remove('on'); freeBtn.setAttribute('aria-pressed','false');
  segType.querySelectorAll('button').forEach((x,k)=>x.classList.toggle('on',k===0)); render();
}
fArea.addEventListener('change',render); fSort.addEventListener('change',render);
freeBtn.addEventListener('click',()=>{ onlyFree=!onlyFree; freeBtn.classList.toggle('on',onlyFree); freeBtn.setAttribute('aria-pressed',onlyFree); render(); });

/* zapytanie o dom: wypełnia formularz i przewija do kontaktu */
function askAbout(code){
  const hh=document.getElementById('c-house'); if(hh) hh.value=code;
  const f=document.getElementById('c-msg'); if(f) f.value='Dzień dobry, interesuje mnie dom '+code+'.';
  closeModal(); document.getElementById('kontakt').scrollIntoView({behavior:'smooth'});
}

/* okno szczegółów domu */
const hm=document.getElementById('hm'); let mi=0, mFocus=null;
function showModal(i){
  mi=(i+list.length)%list.length; const h=list[mi];
  const img=document.getElementById('hm-img'); img.src=imgFor(h); img.alt='Wizualizacja domu '+h.id; img.style.objectPosition=IMG_POS[mi%3];
  const b=document.getElementById('hm-badge'); b.className='badge '+h.status; b.textContent=STATUS[h.status];
  document.getElementById('hm-type').textContent=h.type;
  document.getElementById('hm-title').textContent='Dom '+h.id;
  document.getElementById('hm-specs').innerHTML=
    `<div><dt>Powierzchnia</dt><dd>${esc(nf.format(h.area))} m²</dd></div><div><dt>Działka</dt><dd>${esc(h.plot)} m²</dd></div>`+
    `<div><dt>Pokoje</dt><dd>${esc(h.rooms)}</dd></div><div><dt>Zabudowa</dt><dd>${esc(h.type)}</dd></div>`;
  document.getElementById('hm-price').textContent=priceTxt(h);
  const ask=document.getElementById('hm-ask');
  ask.textContent = h.status==='sold' ? 'Zapytaj o podobny dom' : 'Zapytaj o ten dom';
  ask.onclick=e=>{e.preventDefault(); askAbout(h.id)};
  document.getElementById('hm-pos').textContent=(mi+1)+' / '+list.length;
}
function openModal(i){ mFocus=document.activeElement; hm.hidden=false; document.body.classList.add('lb-open'); showModal(i); document.getElementById('hm-close').focus({preventScroll:true}); }
function closeModal(){ if(hm.hidden) return; hm.hidden=true; document.body.classList.remove('lb-open'); if(mFocus&&mFocus.focus) mFocus.focus(); }
grid.addEventListener('click',e=>{
  if(e.target.closest('#f-reset')){ resetFilters(); return; }
  const ask=e.target.closest('.ask'); if(ask){ askAbout(ask.dataset.house); return; }
  const c=e.target.closest('.hcard'); if(c) openModal(+c.dataset.idx);
});
grid.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ') && e.target.classList.contains('hcard')){ e.preventDefault(); openModal(+e.target.dataset.idx) }
});
document.getElementById('hm-close').addEventListener('click',closeModal);
hm.addEventListener('click',e=>{ if(e.target===hm) closeModal() });
document.getElementById('hm-prev').addEventListener('click',()=>showModal(mi-1));
document.getElementById('hm-next').addEventListener('click',()=>showModal(mi+1));
document.addEventListener('keydown',e=>{
  if(hm.hidden) return;
  if(e.key==='Escape') closeModal(); else if(e.key==='ArrowLeft') showModal(mi-1); else if(e.key==='ArrowRight') showModal(mi+1);
});
render();

/* menu mobilne */
const burger=document.querySelector('.burger'),nav=document.querySelector('nav.main');
burger.addEventListener('click',()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

/* pasek liczb: liczony z danych domów (nic na stałe) */
(function(){
  const box=document.getElementById('stats'); if(!box) return;
  if(!HOUSES.length){ box.closest('section').style.display='none'; return; }
  const areas=HOUSES.map(h=>h.area), minA=Math.min(...areas), maxA=Math.max(...areas);
  const free=HOUSES.filter(h=>h.status==='free').length;
  const rooms=Math.max(...HOUSES.map(h=>h.rooms));
  const tiles=[[HOUSES.length,'domów'],[free,'wolnych']];
  if(minA===maxA){ tiles.push([minA,'m² powierzchni użytkowej'],[rooms,'pokoje']); }
  else { tiles.push([minA,'m² od'],[maxA,'m² do']); }
  box.innerHTML=tiles.map(t=>'<div class="stat reveal"><b data-count="'+t[0]+'" data-dec="'+(Number.isInteger(t[0])?0:2)+'">0</b><span>'+esc(t[1])+'</span></div>').join('');
})();

/* reveal + count-up (powtarza się przy ponownym wjechaniu) */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  e.target.classList.toggle('in-view',e.isIntersecting);
  const c=e.target.dataset.count?e.target:e.target.querySelector('[data-count]');
  if(c){ if(e.isIntersecting) countUp(c); else c.textContent='0'; }
}),{threshold:.2});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
function countUp(el){
  const to=+el.dataset.count, dec=+(el.dataset.dec||0), t0=performance.now(), d=1400;
  const fmt=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=fmt.format(to);return}
  (function step(t){const p=Math.min((t-t0)/d,1);const v=to*(1-Math.pow(1-p,3));el.textContent=fmt.format(dec?v:Math.round(v));if(p<1)requestAnimationFrame(step)})(t0);
}

/* kalkulator rat (orientacyjny) */
const cp=document.getElementById('k-price'),cd=document.getElementById('k-down'),cy=document.getElementById('k-years'),cr=document.getElementById('k-rate');
function calc(){
  const price=+cp.value||0, down=Math.min(+cd.value||0,100), years=+cy.value||1, rate=(+cr.value||0)/100/12;
  const loan=price*(1-down/100), n=years*12;
  const pay = rate? loan*rate/(1-Math.pow(1+rate,-n)) : loan/n;
  document.getElementById('k-out').textContent = nf.format(Math.round(pay))+' zł / mies.';
  document.getElementById('k-yv').textContent = years+' lat';
}
[cp,cd,cy,cr].forEach(i=>i.addEventListener('input',calc));calc();

/* formularz kontaktowy: wysyłka do api/contact.php */
document.getElementById('contact-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.target,m=document.getElementById('form-msg'),btn=f.querySelector('button[type=submit]');
  btn.disabled=true;m.style.display='block';m.style.color='';m.textContent='Wysyłanie...';
  try{
    const r={};
    const d=demoSaveMessage(f);
    m.textContent=d.msg;m.style.color=d.ok?'#9ee0b6':'#f2a5a0';
    if(d.ok)f.reset();
  }catch(err){m.textContent='Nie udało się wysłać. Spróbuj ponownie później.';m.style.color='#f2a5a0'}
  btn.disabled=false;
});
document.getElementById('year').textContent=new Date().getFullYear();

/* pokaz zdjęć
   Aby użyć prawdziwych zdjęć, ustaw src, np. {src:'img/dom-a1.jpg',alt:'Dom A1, elewacja'}.
   Wpisy bez src dostają grafikę zastępczą. */
const PHOTOS_DEMO = [
  {src:'img/dom-1.webp',alt:'Parterowy dom z grafitowym dachem kopertowym i garażem o zachodzie słońca'},
  {src:'img/dom-2.webp',alt:'Dom parterowy z grafitowym dachem kopertowym, białą elewacją i garażem, widok od strony podjazdu'},
  {src:'img/dom-3.webp',alt:'Dom parterowy z garażem w bryle i wejściem w niszy z szarą okładziną'},
  {src:'img/dom-4.webp',alt:'Dom parterowy z otwartym garażem, podjazdem z kostki i ogrodem'},
  {src:'img/dom-5.webp',alt:'Dom parterowy z dachem kopertowym wśród zieleni i brzóz'}
];
const PHOTOS = (function(){var s=demoLoad('photos');return s?s.filter(function(p){return p.published!==false}).map(function(p){return {src:p.src,alt:p.alt}}):PHOTOS_DEMO})();
function photoHtml(p,i){
  if(p.src) return `<img src="${esc(p.src)}" alt="${esc(p.alt)}" ${i>0?'loading="lazy"':''}>`;
  return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.alt)}"><rect width="600" height="400" fill="${p.c}"/><rect y="290" width="600" height="110" fill="#a9ad9a"/><path d="M${120+i*20} 290V190l${110}-60 110 60v100z" fill="#f4f3f1"/><path d="M${105+i*20} 194l125-70 125 70" fill="none" stroke="#2a2a2a" stroke-width="9" stroke-linejoin="round"/><rect x="${215+i*20}" y="225" width="40" height="65" fill="#2a2a2a"/></svg>`;
}
const gal=document.getElementById('gallery'),lb=document.getElementById('lb'),lbImg=document.getElementById('lb-img'),
      lbCap=document.getElementById('lb-cap'),lbCount=document.getElementById('lb-count'),lbThumbs=document.getElementById('lb-thumbs'),lbPlay=document.getElementById('lb-play');
let cur=0,timer=null,lastFocus=null;
gal.innerHTML=PHOTOS.map((p,i)=>`<button type="button" class="g reveal" data-i="${i}" aria-label="Powiększ: ${esc(p.alt)}">${photoHtml(p,i)}</button>`).join('');
lbThumbs.innerHTML=PHOTOS.map((p,i)=>`<button type="button" data-i="${i}" aria-label="Zdjęcie ${i+1}">${photoHtml(p,i)}</button>`).join('');
gal.querySelectorAll('.reveal').forEach(el=>io.observe(el));
function show(i){
  cur=(i+PHOTOS.length)%PHOTOS.length;
  lbImg.innerHTML=photoHtml(PHOTOS[cur],0);
  lbCap.textContent=PHOTOS[cur].alt;
  lbCount.textContent=(cur+1)+' / '+PHOTOS.length;
  lbThumbs.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===cur));
}
function stop(){clearInterval(timer);timer=null;lbPlay.innerHTML='Pokaz &#9654;'}
function play(){timer=setInterval(()=>show(cur+1),3500);lbPlay.innerHTML='Pauza &#10074;&#10074;'}
function openLb(i){lastFocus=document.activeElement;lb.hidden=false;document.body.classList.add('lb-open');show(i);document.getElementById('lb-close').focus()}
function closeLb(){stop();lb.hidden=true;document.body.classList.remove('lb-open');if(lastFocus)lastFocus.focus()}
gal.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)openLb(+b.dataset.i)});
lbThumbs.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b){show(+b.dataset.i);if(timer){stop();play()}}});
document.getElementById('lb-prev').addEventListener('click',()=>{show(cur-1);if(timer){stop();play()}});
document.getElementById('lb-next').addEventListener('click',()=>{show(cur+1);if(timer){stop();play()}});
lbPlay.addEventListener('click',()=>timer?stop():play());
document.getElementById('lb-close').addEventListener('click',closeLb);
document.addEventListener('keydown',e=>{
  if(lb.hidden)return;
  if(e.key==='Escape')closeLb();
  else if(e.key==='ArrowLeft')show(cur-1);
  else if(e.key==='ArrowRight')show(cur+1);
  else if(e.key===' '&&document.activeElement===document.body){e.preventDefault();timer?stop():play()}
});
let sx=null;
lb.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',e=>{if(sx===null)return;const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(cur+(d<0?1:-1));sx=null});

/* ===== HERO: pokaz slajdów, paralaksa, karta, nagłówek ===== */
(function(){
  const hero=document.getElementById('hero'); if(!hero) return;
  const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const slides=[...hero.querySelectorAll('.slide')], dotsBox=hero.querySelector('.hero-dots');
  dotsBox.innerHTML=slides.map((_,k)=>`<button type="button" aria-label="Zdjęcie ${k+1}" data-k="${k}"></button>`).join('');
  const dots=[...dotsBox.children]; let cur=0, timer=null;
  function go(n){
    slides[cur].classList.remove('on'); cur=(n+slides.length)%slides.length; slides[cur].classList.add('on');
    dots.forEach((d,k)=>{d.classList.remove('on'); if(k===cur){void d.offsetWidth; d.classList.add('on')}});
  }
  function start(){ if(!reduce && !timer) timer=setInterval(()=>go(cur+1),6500) }
  function stop(){ clearInterval(timer); timer=null }
  dotsBox.addEventListener('click',e=>{const b=e.target.closest('[data-k]'); if(b){go(+b.dataset.k); stop(); start()}});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  go(0); start();

  /* karta ze statystyką z danych o domach */
  const free=HOUSES.filter(h=>h.status==='free');
  if(free.length){
    document.getElementById('hc-num').textContent=free.length;
    document.getElementById('hc-sub').textContent='wolnych domów, od '+nf.format(Math.min(...free.map(h=>h.area)))+' m²';
    document.getElementById('hero-card').hidden=false;
  }

  /* paralaksa i przezroczysty nagłówek */
  const hdr=document.querySelector('header.site'); let tick=false;
  function onScroll(){
    tick=false; const y=window.scrollY;
    if(!reduce && y<1000) hero.style.setProperty('--py',(y*0.07).toFixed(1)+'px');
    hdr.classList.toggle('over', y<60 && !nav.classList.contains('open'));
  }
  window.addEventListener('scroll',()=>{ if(!tick){tick=true; requestAnimationFrame(onScroll)} },{passive:true});
  burger.addEventListener('click',onScroll);
  onScroll();
})();


/* ===== SEKCJA PROJEKT: wizualizacja danych z dokumentacji projektowej =====
   Dane liczbowe (powierzchnie pomieszczeń) według projektu. Suma pomieszczeń użytkowych = 117,83 m².
   Garaż i kotłownia są poza powierzchnią użytkową, razem z nią dają 142,20 m² parteru. */
(function(){
  const box=document.getElementById('pj-tiles'); if(!box) return;
  const nf2=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const P={
    usable:117.83,total:142.20,garage:19.53,boiler:4.84,
    groups:[
      {name:'Strefa dzienna',c:'#111111',rooms:[['Salon z jadalnią',33.31],['Kuchnia',12.96]]},
      {name:'Strefa nocna',c:'#b08d57',rooms:[['Pokój',13.24],['Pokój',11.47],['Pokój',9.06],['Łazienka',7.82],['Garderoba',2.55]]},
      {name:'Komunikacja',c:'#8a8a8a',rooms:[['Korytarz',9.91],['Wiatrołap',6.25],['Hol',4.41]]},
      {name:'Pomieszczenia pomocnicze',c:'#cfcac1',rooms:[['Pralnia',3.11],['Toaleta',2.01],['Spiżarnia',1.73]]}
    ]
  };
  const sum=a=>a.reduce((s,r)=>s+r[1],0);
  const totals=P.groups.map(g=>sum(g.rooms));
  /* udziały procentowe metodą największej reszty, żeby suma wynosiła 100 */
  const raw=totals.map(t=>t/P.usable*100), fl=raw.map(Math.floor);
  let left=100-fl.reduce((a,b)=>a+b,0);
  raw.map((v,i)=>[v-fl[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,left).forEach(p=>fl[p[1]]++);

  const tile=(v,u,l,sub)=>'<div class="pj-tile"><b>'+v+(u?'<small>'+u+'</small>':'')+'</b><span>'+l+'</span>'+(sub?'<em>'+sub+'</em>':'')+'</div>';
  box.innerHTML=
    tile(nf2.format(P.usable),'m²','powierzchnia użytkowa','suma pomieszczeń mieszkalnych')+
    tile(nf2.format(P.total),'m²','parter razem','z garażem i kotłownią')+
    tile('4','','pokoje','salon z jadalnią i trzy pokoje')+
    tile('2','','łazienka i toaleta','')+
    tile(nf2.format(P.garage),'m²','garaż w bryle domu','jednostanowiskowy')+
    tile('20,0 × 24,6','m','minimalne wymiary działki','');

  const share=document.getElementById('pj-share');
  share.innerHTML='<h3>Podział powierzchni użytkowej</h3><p class="pj-sub">Jak rozkłada się '+nf2.format(P.usable)+' m² domu</p>'+
    '<div class="stack" role="img" aria-label="Podział powierzchni użytkowej na strefy">'+
    P.groups.map((g,i)=>'<i style="--w:'+(totals[i]/P.usable*100).toFixed(2)+'%;background:'+g.c+'"></i>').join('')+'</div>'+
    '<ul class="legend">'+P.groups.map((g,i)=>'<li><span class="sw" style="background:'+g.c+'"></span>'+esc(g.name)+'<b>'+nf2.format(totals[i])+' m² <small>('+fl[i]+'%)</small></b></li>').join('')+'</ul>'+
    '<div class="pj-extra"><div><span>Garaż</span><b>'+nf2.format(P.garage)+' m²</b></div><div><span>Kotłownia</span><b>'+nf2.format(P.boiler)+' m²</b></div></div>';

  const max=Math.max(...P.groups.flatMap(g=>g.rooms.map(r=>r[1])));
  document.getElementById('pj-rooms').innerHTML='<h3>Pomieszczenia i ich powierzchnie</h3>'+
    P.groups.map(g=>'<div class="rg"><h4><span class="sw" style="background:'+g.c+'"></span>'+esc(g.name)+'</h4>'+
      g.rooms.map(r=>'<div class="room"><span>'+esc(r[0])+'</span><div class="bar"><i style="--w:'+(r[1]/max*100).toFixed(1)+'%;--c:'+g.c+'"></i></div><span class="v">'+nf2.format(r[1])+' m²</span></div>').join('')+'</div>').join('');
  document.querySelectorAll('#pj-share,#pj-rooms').forEach(el=>io.observe(el));
})();
