const API="https://graphql.anilist.co";
const state={queue:[],current:null,saved:JSON.parse(localStorage.getItem("animex_saved")||"[]"),filter:"ALL",lastPage:"discover"};
const Q=`query($page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(type:ANIME,isAdult:false,sort:POPULARITY_DESC){id title{romaji english native userPreferred} description(asHtml:false) genres status format episodes duration averageScore popularity coverImage{extraLarge large} startDate{year month day} season seasonYear nextAiringEpisode{airingAt timeUntilAiring episode} studios(isMain:true){nodes{name}} externalLinks{id url site type} siteUrl}}}`;
const DETAIL=`query($id:Int){Media(id:$id,type:ANIME){id title{romaji english native userPreferred} description(asHtml:false) genres status format episodes duration averageScore popularity coverImage{extraLarge large} bannerImage startDate{year month day} endDate{year month day} season seasonYear studios(isMain:true){nodes{name}} nextAiringEpisode{airingAt timeUntilAiring episode} externalLinks{id url site type} streamingEpisodes{title thumbnail url site} siteUrl}}`;
const SCHEDULE=`query($page:Int,$from:Int,$to:Int){Page(page:$page,perPage:50){pageInfo{hasNextPage} airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){id airingAt episode media{id title{userPreferred romaji} coverImage{medium large}}}}}`;
async function gql(query,variables={}){const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({query,variables})});if(!r.ok)throw new Error("Network error");const j=await r.json();if(j.errors)throw new Error(j.errors[0]?.message||"API error");return j.data}
function title(a){return a?.title?.english||a?.title?.userPreferred||a?.title?.romaji||"Unknown anime"}
function save(){localStorage.setItem("animex_saved",JSON.stringify(state.saved))}
function isSaved(id){return state.saved.some(x=>x.id===id)}
function cleanHtml(s){const d=document.createElement("div");d.innerHTML=s||"";return d.textContent||""}
function fmtTime(ts){return new Date(ts*1000).toLocaleString([], {weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
function show(page){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(page).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));state.lastPage=page}
function renderCard(){const s=document.getElementById("swipeStack");if(!state.current){s.innerHTML='<div class="loading-card">No more anime. Refresh to load more.</div>';return}const a=state.current;s.innerHTML=`<article class="anime-card" id="card"><img class="anime-cover" src="${a.coverImage.extraLarge||a.coverImage.large}" alt=""><div class="card-body"><h2 class="card-title">${title(a)}</h2><div class="card-meta">${a.format||"ANIME"} · ${a.averageScore?("★ "+(a.averageScore/10).toFixed(1)):"No score"} · ${a.episodes||"?"} eps</div><div class="tags">${(a.genres||[]).slice(0,4).map(g=>`<span class="tag">${g}</span>`).join("")}</div><p class="card-desc">${cleanHtml(a.description)}</p></div></article>`;attachSwipe(document.getElementById("card"))}
async function next(){
  if(state.queue.length===0){
    state.current=null;
    renderCard();
    await loadDiscover(true);
    return;
  }
  state.current=state.queue.shift();
  renderCard();
  // Keep the deck filled before it reaches zero.
  if(state.queue.length<6) loadDiscover(true).catch(()=>{});
}
function actSave(){if(!state.current)return;if(!isSaved(state.current.id)){state.saved.unshift({...state.current,status:"PLANNING"});save()}next()}
function actSkip(){next()}
async function loadDiscover(append=false){
  const seen=new Set();
  state.queue.forEach(x=>seen.add(x.id));
  if(state.current) seen.add(state.current.id);
  state.saved.forEach(x=>seen.add(x.id));

  const pages=[];
  while(pages.length<3){
    const p=Math.floor(Math.random()*50)+1;
    if(!pages.includes(p)) pages.push(p);
  }

  let added=[];
  for(const page of pages){
    try{
      const d=await gql(Q,{page,perPage:30});
      for(const x of (d.Page?.media||[])){
        if(x && x.id && !seen.has(x.id)){
          seen.add(x.id);
          added.push(x);
        }
      }
    }catch(e){}
  }

  added.sort(()=>Math.random()-.5);
  state.queue.push(...added);

  if(state.queue.length===0 && !append){
    try{
      const d=await gql(Q,{page:1,perPage:50});
      state.queue=(d.Page?.media||[]).filter(x=>x&&x.id);
      state.queue.sort(()=>Math.random()-.5);
    }catch(e){
      document.getElementById("swipeStack").innerHTML='<div class="loading-card">Could not reach AniList.<br>Check your internet connection.</div>';
      document.getElementById("status").textContent="OFFLINE";
      return;
    }
  }

  document.getElementById("status").textContent="LIVE";
  if(!state.current) await next();
}
function attachSwipe(card){let sx=0,sy=0,dx=0;card.onpointerdown=e=>{sx=e.clientX;sy=e.clientY;card.setPointerCapture(e.pointerId);card.classList.add("dragging")};card.onpointermove=e=>{if(!sx)return;dx=e.clientX-sx;card.style.transform=`translateX(${dx}px) rotate(${dx/20}deg)`};card.onpointerup=e=>{card.classList.remove("dragging");if(Math.abs(dx)>100){card.style.transition=".2s";card.style.transform=`translateX(${dx>0?900:-900}px) rotate(${dx/10}deg)`;setTimeout(dx>0?actSave:actSkip,180)}else{card.style.transform="";if(Math.abs(e.clientY-sy)<15)showDetails(state.current.id)}sx=sy=dx=0}}

function ytLinks(a){
  const links = (a.externalLinks||[]).filter(x => {
    const s = `${x.site||""} ${x.url||""}`.toLowerCase();
    return s.includes("youtube.com") || s.includes("youtu.be") || s.includes("youtube");
  });
  const groups = {};
  links.forEach(x => {
    const lang = (x.language||"Other / unspecified").trim();
    const key = lang || "Other / unspecified";
    (groups[key] ||= []).push(x);
  });
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(title(a)+" explanation anime")}`;
  const review = `https://www.youtube.com/results?search_query=${encodeURIComponent(title(a)+" review anime")}`;
  const keys = Object.keys(groups).sort((a,b) => a.localeCompare(b));
  return `<section class="youtube-section">
    <h3>YouTube</h3>
    <p class="section-note">Videos are separated by language. This includes official videos and other linked YouTube content, including explanation/review videos when available.</p>
    ${keys.length ? keys.map(lang => `
      <div class="youtube-language">
        <div class="youtube-language-title">${lang}</div>
        <div class="links">${groups[lang].map(x =>
          `<a class="link youtube-link" href="${x.url}" target="_blank" rel="noopener">${x.site||"YouTube video"}${x.notes?` · ${x.notes}`:""}</a>`
        ).join("")}</div>
      </div>`).join("") : `<div class="youtube-language">
        <div class="youtube-language-title">Search by language</div>
        <div class="links"><a class="link youtube-link" href="${search}" target="_blank" rel="noopener">Explanation videos</a><a class="link youtube-link" href="${review}" target="_blank" rel="noopener">Reviews / discussion</a></div>
      </div>`}
  </section>`;
}

async function showDetails(id){show("details");const el=document.getElementById("detailsContent");el.innerHTML='<div class="loading">Loading…</div>';try{const a=(await gql(DETAIL,{id})).Media;el.innerHTML=`<div class="detail-hero"><img class="detail-cover" src="${a.coverImage.extraLarge||a.coverImage.large}" alt=""><div><h1 class="detail-title">${title(a)}</h1><div class="detail-native">${a.title.native||a.title.romaji||""}</div><div class="tags">${(a.genres||[]).map(g=>`<span class="tag">${g}</span>`).join("")}</div></div></div><div class="facts"><div class="fact"><b>Status</b><span>${a.status||"—"}</span></div><div class="fact"><b>Score</b><span>${a.averageScore?("★ "+(a.averageScore/10).toFixed(1)):"—"}</span></div><div class="fact"><b>Episodes</b><span>${a.episodes||"—"}</span></div><div class="fact"><b>Studio</b><span>${a.studios.nodes.map(x=>x.name).join(", ")||"—"}</span></div><div class="fact"><b>Format</b><span>${a.format||"—"}</span></div><div class="fact"><b>Season</b><span>${a.season?`${a.season} ${a.seasonYear||""}`:"—"}</span></div></div><h3>Synopsis</h3><p class="detail-text">${cleanHtml(a.description)||"No synopsis available."}</p>${a.nextAiringEpisode?`<h3>Next episode</h3><p class="detail-text">Episode ${a.nextAiringEpisode.episode} · ${fmtTime(a.nextAiringEpisode.airingAt)}</p>`:""}${ytLinks(a)}<h3>Where to watch / links</h3><div class="links">${(a.streamingEpisodes||[]).map(x=>`<a class="link" href="${x.url}" target="_blank" rel="noopener">${x.site||"Watch"}</a>`).join("")}${(a.externalLinks||[]).map(x=>`<a class="link" href="${x.url}" target="_blank" rel="noopener">${x.site||"External link"}</a>`).join("")}<a class="link" href="${a.siteUrl}" target="_blank" rel="noopener">AniList</a></div><div style="margin-top:18px"><button class="link" id="detailSave">${isSaved(a.id)?"Saved":"Add to library"}</button></div>`;document.getElementById("detailSave").onclick=()=>{if(!isSaved(a.id)){state.saved.unshift({...a,status:"PLANNING"});save();renderLibrary();document.getElementById("detailSave").textContent="Saved"}}}catch(e){el.innerHTML='<div class="loading">Could not load anime details.</div>'}}
async function loadSchedule(reset=true){
  const list=document.getElementById("scheduleList");
  if(!state.schedule) state.schedule={page:1,days:14,rows:[],loading:false,hasNext:true};

  if(state.schedule.loading) return;
  state.schedule.loading=true;

  if(reset){
    state.schedule.page=1;
    state.schedule.days=14;
    state.schedule.rows=[];
    list.innerHTML='<div class="loading">Loading schedule…</div>';
  }

  try{
    const now=Math.floor(Date.now()/1000);
    const to=now + state.schedule.days*86400;
    const d=await gql(SCHEDULE,{
      page:state.schedule.page,
      from:now-3600,
      to
    });

    const rows=d.Page?.airingSchedules||[];
    const existing=new Set(state.schedule.rows.map(x=>x.id));
    state.schedule.rows.push(...rows.filter(x=>x && !existing.has(x.id)));
    state.schedule.hasNext=!!d.Page?.pageInfo?.hasNextPage;

    renderSchedule();

    // If the current page was full, automatically make another page available.
    if(rows.length>=50) state.schedule.hasNext=true;
  }catch(e){
    if(!state.schedule.rows.length){
      list.innerHTML='<div class="loading">Could not load schedule. Check your internet connection.</div>';
    }
  }finally{
    state.schedule.loading=false;
  }
}

function renderSchedule(){
  const list=document.getElementById("scheduleList");
  const rows=(state.schedule?.rows||[]).slice().sort((a,b)=>a.airingAt-b.airingAt);

  if(!rows.length){
    list.innerHTML='<div class="loading">No upcoming episodes are currently listed.</div>';
    return;
  }

  list.innerHTML=rows.map(x=>{
    const date=new Date(x.airingAt*1000);
    const when=date.toLocaleString([],{
      weekday:"short",month:"short",day:"numeric",
      hour:"2-digit",minute:"2-digit"
    });
    return `<button class="schedule-item schedule-click" data-id="${x.media.id}">
      <img class="thumb" src="${x.media.coverImage?.large||x.media.coverImage?.medium||""}" alt="">
      <div class="schedule-main">
        <div class="schedule-title">${title(x.media)}</div>
        <div class="schedule-meta">Episode ${x.episode} · ${when}</div>
        <div class="schedule-countdown" data-time="${x.airingAt}"></div>
      </div>
      <span class="schedule-arrow">›</span>
    </button>`;
  }).join("") + `
    <button id="scheduleMore" class="schedule-more">
      ${state.schedule.hasNext ? "Load more episodes" : "Load the next 14 days"}
    </button>`;

  list.querySelectorAll(".schedule-click").forEach(item=>{
    item.onclick=()=>showDetails(Number(item.dataset.id));
  });

  const more=document.getElementById("scheduleMore");
  more.onclick=async()=>{
    if(state.schedule.hasNext){
      state.schedule.page++;
      await loadSchedule(false);
    }else{
      state.schedule.days+=14;
      state.schedule.page=1;
      await loadSchedule(false);
    }
  };

  updateScheduleCountdowns();
}

function updateScheduleCountdowns(){
  document.querySelectorAll(".schedule-countdown").forEach(el=>{
    const t=Number(el.dataset.time)*1000;
    const diff=t-Date.now();
    if(diff<=0){
      el.textContent="Airing now / recently aired";
      return;
    }
    const total=Math.floor(diff/1000);
    const d=Math.floor(total/86400);
    const h=Math.floor(total%86400/3600);
    const m=Math.floor(total%3600/60);
    el.textContent=`Starts in ${d?d+"d ":""}${h}h ${m}m`;
  });
}

function renderLibrary(){const el=document.getElementById("libraryList"),filter=state.filter;const arr=state.saved.filter(x=>filter==="ALL"||x.status===filter);document.getElementById("count").textContent=`${state.saved.length} saved`;el.innerHTML=arr.length?arr.map(a=>`<article class="library-card" data-id="${a.id}"><img src="${a.coverImage.large||a.coverImage.extraLarge}" alt=""><div class="library-info"><div class="library-title">${title(a)}</div><div class="library-sub">${a.status||"PLANNING"}</div></div></article>`).join(""):'<div class="loading" style="grid-column:1/-1">Your collection is empty.</div>';el.querySelectorAll(".library-card").forEach(c=>c.onclick=()=>showDetails(Number(c.dataset.id)))}
async function searchAnime(q){const el=document.getElementById("searchResults");el.innerHTML='<div class="loading">Searching…</div>';try{const data=await gql(`query($search:String!){Page(page:1,perPage:20){media(search:$search,type:ANIME,isAdult:false,sort:SEARCH_MATCH){id title{userPreferred english romaji} coverImage{large} averageScore episodes format}}}`,{search:q});el.innerHTML=data.Page.media.map(a=>`<article class="library-card" data-id="${a.id}"><img src="${a.coverImage.large}" alt=""><div class="library-info"><div class="library-title">${title(a)}</div><div class="library-sub">${a.format||""} · ${a.averageScore?("★ "+(a.averageScore/10).toFixed(1)):"—"}</div></div></article>`).join("")||'<div class="loading">No results.</div>';el.querySelectorAll(".library-card").forEach(c=>c.onclick=()=>showDetails(Number(c.dataset.id)))}catch(e){el.innerHTML='<div class="loading">Search failed.</div>'}}

// Background music (embedded in index.html)
const music = document.getElementById("bgMusic");
if (music) {
  music.volume = 0.35;
  music.loop = true;
}
let musicOn = false;

function musicUI(){
  const b=document.getElementById("musicBtn");
  if(!b) return;
  b.textContent=musicOn ? "🔊" : "♪";
  b.classList.toggle("music-on", musicOn);
}

async function playMusic(){
  if(!music) return;
  try{
    music.currentTime = 0;
    await music.play();
    musicOn=true;
  }catch(err){
    musicOn=false;
    console.warn("Music playback blocked:", err);
    alert("Tap the music button once to allow playback.");
  }
  musicUI();
}

function toggleMusic(){
  if(!music) return;
  if(music.paused) playMusic();
  else{
    music.pause();
    musicOn=false;
    musicUI();
  }
}

if(music){
  music.addEventListener("play",()=>{musicOn=true;musicUI()});
  music.addEventListener("pause",()=>{musicOn=false;musicUI()});
  music.addEventListener("error",()=>{musicOn=false;musicUI()});
}
musicUI();

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>show(b.dataset.page));
document.getElementById("skipBtn").onclick=actSkip;document.getElementById("saveBtn").onclick=actSave;document.getElementById("infoBtn").onclick=()=>state.current&&showDetails(state.current.id);document.getElementById("refreshBtn").onclick=loadDiscover;
document.getElementById("musicBtn").onclick=toggleMusic;
document.getElementById("searchBtn").onclick=()=>show("search");document.getElementById("backBtn").onclick=()=>show(state.lastPage==="details"?"discover":state.lastPage);document.getElementById("searchForm").onsubmit=e=>{e.preventDefault();const q=document.getElementById("searchInput").value.trim();if(q)searchAnime(q)};document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.filter=b.dataset.filter;renderLibrary()});
state.schedule={page:1,days:14,rows:[],loading:false,hasNext:true};renderLibrary();loadDiscover();loadSchedule(true);
setInterval(updateScheduleCountdowns,60*1000);setInterval(loadSchedule,5*60*1000);