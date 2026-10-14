const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LET=["أ","ب","ج","د"];
const sh=a=>{a=[...a];for(let i=a.length;i-->1;){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
firebase.initializeApp(FB_CONFIG);
const db=firebase.database(),auth=firebase.auth();
let OFF=0;db.ref(".info/serverTimeOffset").on("value",s=>OFF=s.val()||0);
const now=()=>Date.now()+OFF;
const roomId=()=>(new URLSearchParams(location.search).get("room")||"").replace(/[^a-z0-9]/gi,"");
let AC;
function snd(t){try{
  AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
  const o=AC.createOscillator(),g=AC.createGain(),T=AC.currentTime,f={tick:[800,800,.04,.04],ok:[523,659,.2,.08],bad:[220,110,.25,.08]}[t];
  o.connect(g);g.connect(AC.destination);o.frequency.setValueAtTime(f[0],T);o.frequency.exponentialRampToValueAtTime(f[1],T+f[2]);
  g.gain.setValueAtTime(f[3],T);o.start();o.stop(T+f[2]);
}catch(e){}}
// P: players {uid:{name,score}}, R: results of one question {uid:points} (>0 right, 0 wrong, -1 no answer) or null
function board(P,R,me,max,kick){
  return Object.entries(P||{}).map(([u,p])=>({u,n:p.name||"",s:p.score||0,r:R?R[u]:undefined})).sort((a,b)=>b.s-a.s).map((p,i)=>
  `<div class="lr${p.u===me?" me":""}"><div class="l1"><span class="rk">${i+1}</span><span class="nm">${esc(p.n)}</span>${kick?`<button class="del" data-k="${p.u}" aria-label="استبعاد">✕</button>`:""}${R?`<span class="chip ${p.r>0?"ok":p.r===0?"bad":"no"}">${p.r>0?"✓":p.r===0?"✕":"–"}</span>${p.r>0?`<span class="d">+${p.r}</span>`:""}`:""}<b>${p.s}</b></div><div class="track"><i class="bar" style="width:${Math.max(3,p.s/Math.max(max,1)*100)}%"></i></div></div>`).join("");
}
const rights=(RES,u,n)=>{let c=0;for(let i=0;i<n;i++)if(((RES||{})[i]||{})[u]>0)c++;return c};
const lbShow=(m,i,n)=>{const k=m&&m.lb!==undefined?+m.lb:1;return i+1>=n||(k>0&&(i+1)%k===0)};
