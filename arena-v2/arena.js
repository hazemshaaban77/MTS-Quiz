
"use strict";
const role=document.body.dataset.role,app=document.getElementById("app"),$=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search),initialRoom=(qs.get("room")||"").replace(/[^a-z0-9]/gi,"");
const escA=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const msg=(s,cl="lead")=>{app.innerHTML='<div class="panel '+cl+'">'+escA(s)+'</div>'};
const uid=()=>auth.currentUser?.uid||"";
const trainer=u=>!!u&&!u.isAnonymous;
const roomPath=id=>"rooms/"+id;
let room=initialRoom,state=null,votes={},attached=false,roomListener=null,voteListener=null,roomRef=null,voteRef=null,lastKey="",timer=null,transition=null,loading=false;
let playlist=[],hostAnswers=[],draft=null;
const startTemplate=()=>({type:"quiz",title:"تحدي المعرفة",q:"ما المستند الذي يصدره الناقل ويثبت استلام البضاعة؟",options:["بوليصة الشحن","إيصال سداد","شهادة منشأ","عقد إيجار"],correct:0,seconds:30});
function saveDraft(){try{localStorage.setItem("mtsArenaV2Draft",JSON.stringify(playlist))}catch(e){}}
function loadDraft(){try{const d=JSON.parse(localStorage.getItem("mtsArenaV2Draft")||"null");playlist=Array.isArray(d)?d:[startTemplate(),{type:"poll",title:"صوتك يهمنا",q:"ما النشاط اللي تحب نركز عليه؟",options:["Quiz","Order It","Match It","Team Battle"],seconds:0}]}catch(e){playlist=[startTemplate()]}}
function saveSession(){try{localStorage.setItem("mtsArenaV2Room",room);localStorage.setItem("mtsArenaV2Playlist:"+room,JSON.stringify(playlist))}catch(e){}}
function restoreSession(){try{room=localStorage.getItem("mtsArenaV2Room")||"";const saved=JSON.parse(localStorage.getItem("mtsArenaV2Playlist:"+room)||"null");if(Array.isArray(saved))playlist=saved}catch(e){room=""}}
function urls(){const u=new URL("index.html",location.href);u.searchParams.set("room",room);const s=new URL("screen.html",location.href);s.searchParams.set("room",room);return {join:u.href,screen:s.href}}
function openExternal(u){window.open(u,"_blank","noopener,noreferrer")}
function detach(){if(roomRef&&roomListener)roomRef.off("value",roomListener);if(voteRef&&voteListener)voteRef.off("value",voteListener);roomRef=voteRef=null;roomListener=voteListener=null;attached=false;clearInterval(timer);timer=null;clearTimeout(transition)}
function attach(){
 detach();if(!room)return;attached=true;
 roomRef=db.ref(roomPath(room));roomListener=s=>{state=s.val();if(!state){msg("الجلسة غير موجودة أو تم إنهاؤها");return}if(state.meta?.platform!=="arena-v2"){msg("الرابط ده خاص بنسخة أخرى من المنصة");return}render()};
 roomRef.on("value",roomListener,()=>msg("تعذّر قراءة الجلسة. راجع اتصال Firebase"));
 if(role==="instructor"){voteRef=db.ref("ans/"+room);voteListener=s=>{votes=s.val()||{};if(state)renderStats()};voteRef.on("value",voteListener,()=>{})}
}
function optionsHtml(opts,disabled=false,selected=-1){return opts.map((o,i)=>'<button class="option'+(selected===i?' selected':'')+'" data-choice="'+i+'" '+(disabled?"disabled":"")+'><b>'+"ABCD"[i]+'</b><span>'+escA(o)+'</span></button>').join("")}
function choiceCounts(){const a=Object.values(votes[state?.ctl?.i]||{}),len=state?.current?.options?.length||0;const counts=Array(len).fill(0);for(const v of a)if(Number.isInteger(v.k)&&v.k>=0&&v.k<len)counts[v.k]++;return counts}
function chart(opts,counts){const total=counts.reduce((a,b)=>a+b,0);return opts.map((o,i)=>'<div class="stat"><div class="barline"><b>'+escA(o)+'</b><span>'+counts[i]+' • '+(total?Math.round(100*counts[i]/total):0)+'%</span></div><div class="meter"><i style="width:'+(total?100*counts[i]/total:0)+'%"></i></div></div>').join("")}
function ranks(){return Object.values(state.players||{}).sort((a,b)=>(b.score||0)-(a.score||0)||String(a.name||"").localeCompare(String(b.name||""))).map((p,i)=>'<div class="rank" style="animation-delay:'+Math.min(i,10)*.06+'s"><span>'+(i+1)+'. '+escA(p.name||"")+'</span><b>'+Number(p.score||0)+'</b></div>').join("")}
function render(){if(role==="instructor")drawInstructor();else if(role==="screen")drawScreen();else drawParticipant()}
auth.onAuthStateChanged(async u=>{
 if(role==="instructor"){
  if(!trainer(u)){login();return}
  if(!playlist.length)loadDraft();
  if(!room)restoreSession();
  if(room&&!attached)attach();else if(!room)builder();
 }else{
  if(!room){msg("امسح QR من شاشة المدرب عشان تدخل الجلسة");return}
  if(!u){try{await auth.signInAnonymously()}catch(e){msg("تعذّر تسجيل الدخول المجهول. راجع إعدادات Firebase Auth")};return}
  if(!attached)attach();
 }
});
function login(){app.innerHTML='<h1 class="hero">لوحة تحكم المدرب</h1><div class="panel"><label>البريد الإلكتروني<input id="email" type="email" dir="ltr"></label><label>كلمة المرور<input id="password" type="password"></label><button class="btn" id="sign">دخول المدرب</button><p id="error" class="error"></p></div>';$("sign").onclick=()=>auth.signInWithEmailAndPassword($("email").value.trim(),$("password").value).catch(()=>{$("error").textContent="راجع بيانات الدخول"})}
function builder(){
 room="";lastKey="builder";
 const cards=playlist.map((a,i)=>'<article class="activity"><span class="pill">'+(a.type==="poll"?"POLL":"QUIZ")+'</span><h3>'+escA(a.title||a.q)+'</h3><p class="muted small">'+escA(a.q)+'</p><div class="actions"><button class="btn ghost" data-edit="'+i+'">تعديل</button><button class="btn ghost" data-up="'+i+'">↑</button><button class="btn ghost" data-down="'+i+'">↓</button><button class="btn ghost danger" data-remove="'+i+'">حذف</button></div></article>').join("");
 app.innerHTML='<h1 class="hero">جهّز عرضك. شغّل الحماس.</h1><p class="lead">QR واحد، جلسة واحدة، وأنشطة متتالية من غير ما المتدرب يخرج.</p><div class="actions"><button class="btn" id="newquiz">+ Quiz Challenge</button><button class="btn ghost" id="newpoll">+ Live Poll</button></div><div class="cards">'+cards+'</div><div id="editor"></div><div class="panel"><label>عنوان الجلسة<input id="sessionTitle" maxlength="70" value="MTS Training Arena"></label><button id="launch" class="btn" '+(!playlist.length?'disabled':'')+'>إنشاء الجلسة وQR واحد لكل الأنشطة</button><p id="error" class="error"></p></div>';
 $("newquiz").onclick=()=>edit(-1,"quiz");$("newpoll").onclick=()=>edit(-1,"poll");
 app.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(+b.dataset.edit));
 app.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{playlist.splice(+b.dataset.remove,1);saveDraft();builder()});
 app.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>move(+b.dataset.up,-1));
 app.querySelectorAll("[data-down]").forEach(b=>b.onclick=()=>move(+b.dataset.down,1));
 $("launch").onclick=launch;
}
function move(i,delta){const j=i+delta;if(j<0||j>=playlist.length)return;[playlist[i],playlist[j]]=[playlist[j],playlist[i]];saveDraft();builder()}
function edit(i,type){const x=i<0?{type,title:type==="poll"?"تصويت سريع":"تحدي جديد",q:"",options:["","","",""],correct:0,seconds:30}:playlist[i];const poll=x.type==="poll";$("editor").innerHTML='<div class="panel"><h2>'+(poll?"إعداد Live Poll":"إعداد Quiz Arena")+'</h2><label>اسم النشاط<input id="actTitle" maxlength="70" value="'+escA(x.title)+'"></label><label>السؤال<textarea id="question" maxlength="400" rows="2">'+escA(x.q)+'</textarea></label>'+[0,1,2,3].map(k=>'<label>اختيار '+(k+1)+'<input id="opt'+k+'" maxlength="140" value="'+escA(x.options[k]||"")+'"></label>').join("")+(poll?"":'<label>الإجابة الصحيحة<select id="correct">'+[0,1,2,3].map(k=>'<option value="'+k+'" '+(x.correct===k?"selected":"")+'>'+(k+1)+'</option>').join("")+'</select></label><label>وقت السؤال (ثانية)<input id="seconds" type="number" min="10" max="120" value="'+(x.seconds||30)+'"></label>')+'<button class="btn" id="saveactivity">حفظ النشاط</button><button class="btn ghost" id="canceledit">إلغاء</button><p class="error" id="editerror"></p></div>';
 $("canceledit").onclick=()=>{$("editor").innerHTML=""};
 $("saveactivity").onclick=()=>{const q=$("question").value.trim(),opts=[0,1,2,3].map(k=>$("opt"+k).value.trim());while(opts.length&&opts[opts.length-1]==="")opts.pop();const correct=poll?null:+$("correct").value;if(!q||opts.length<2||opts.some(v=>!v)||(!poll&&correct>=opts.length)){$("editerror").textContent="راجع السؤال والاختيارات والإجابة الصحيحة";return}const a={type:x.type,title:$("actTitle").value.trim()||"Activity",q,options:opts,correct,seconds:poll?0:Math.min(120,Math.max(10,+$("seconds").value||30))};if(i<0)playlist.push(a);else playlist[i]=a;saveDraft();builder()};
 $("editor").scrollIntoView({behavior:"smooth",block:"start"});
}
async function launch(){if(loading||!playlist.length)return;loading=true;$("launch").disabled=true;
 const title=$("sessionTitle").value.trim()||"MTS Training Arena",id="a"+Math.random().toString(36).slice(2,9);
 try{const ref=db.ref(roomPath(id));if((await ref.once("value")).exists())throw Error("Collision");
 await ref.set({meta:{title,platform:"arena-v2",total:playlist.length},ctl:{phase:"lobby",i:0,type:"",startedAt:null,lock:null},current:null,players:{}});
 room=id;saveSession();loading=false;attach();
 }catch(e){loading=false;const el=$("error");if(el)el.textContent="تعذّر إنشاء الجلسة. راجع صلاحيات Firebase وحساب المدرب";if($("launch"))$("launch").disabled=false}}
async function publishCurrent(i){if(loading)return;loading=true;try{
 const a=playlist[i];if(!a)throw Error("Missing activity");
 const p={q:a.q,options:a.options,title:a.title,type:a.type,seconds:a.seconds};
 const up={current:p,"ctl/i":i,"ctl/type":a.type,"ctl/phase":"q","ctl/startedAt":firebase.database.ServerValue.TIMESTAMP,"ctl/lock":true,"cnt":null};
 await db.ref(roomPath(room)).update(up);lastKey="";
 }catch(e){alert("تعذر بدء النشاط؛ حاول مجددًا")}finally{loading=false}}
async function reveal(){if(loading||!state||state.ctl.phase!=="q")return;loading=true;try{
 const i=state.ctl.i,a=playlist[i],snap=(await db.ref("ans/"+room+"/"+i).once("value")).val()||{};
 const counts=a.options.map(()=>0),results={},updates={};
 const players=state.players||{};
 for(const [id,answer] of Object.entries(snap)){if(!players[id]||!Number.isInteger(answer.k)||answer.k<0||answer.k>=counts.length)continue;counts[answer.k]++;if(a.type==="quiz"){const correct=answer.k===a.correct;results[id]=correct?1000:0;if(correct)updates["players/"+id+"/score"]=(players[id].score||0)+1000}}
 updates["cnt"]=counts;updates["ctl/phase"]="rev";updates["ctl/correct"]=a.type==="quiz"?a.correct:null;updates["ctl/revealedAt"]=firebase.database.ServerValue.TIMESTAMP;updates["res/"+i]=results;
 await db.ref(roomPath(room)).update(updates);
 }catch(e){alert("تعذّر عرض النتائج")}finally{loading=false}}
async function next(){if(loading)return;if(state.ctl.i+1>=playlist.length){loading=true;try{await db.ref(roomPath(room)+"/ctl").update({phase:"end",type:"end"})}catch(e){alert("تعذّر إنهاء الجلسة")}finally{loading=false}}else publishCurrent(state.ctl.i+1)}
async function finishRoom(){if(!confirm("سيتم حذف الغرفة والنتائج من Firebase نهائيًا. هل أكملت حفظ ما تحتاجه؟"))return;const id=room;detach();try{await Promise.all(["rooms","ans","eids"].map(n=>db.ref(n+"/"+id).remove()));room="";localStorage.removeItem("mtsArenaV2Room");loading=false;builder()}catch(e){room=id;attach();alert("تعذّر إنهاء الجلسة بالكامل")}}
function renderStats(){if(role!=="instructor"||!state)return;const el=$("answer-count");if(el)el.textContent=Object.keys(votes[state.ctl.i]||{}).length+" / "+Object.keys(state.players||{}).length}
function drawInstructor(){
 if(!state)return;const c=state.ctl,ph=c.phase,idx=c.i,link=urls(),people=Object.keys(state.players||{}).length;
 const qr='<div class="qr" id="qr"></div><div><div class="code">'+escA(room)+'</div><p class="small muted" dir="ltr">'+escA(link.join)+'</p><p>'+people+' مشارك</p></div>';
 if(ph==="lobby"){app.innerHTML='<h1 class="hero">الجلسة جاهزة. الجمهور يدخل الآن.</h1><div class="panel grid">'+qr+'</div><div class="actions"><button class="btn ghost" id="projector">فتح البروجيكتور</button><button class="btn" id="begin">ابدأ أول نشاط</button><button class="btn danger" id="end">إلغاء الجلسة</button></div><div class="panel"><h2>قائمة الأنشطة</h2>'+playlist.map((a,i)=>'<p>'+(i+1)+'. '+escA(a.title)+' — '+(a.type==="quiz"?"Quiz":"Poll")+'</p>').join("")+'</div>';if(window.QRCode)new QRCode($("qr"),{text:link.join,width:175,height:175});$("begin").onclick=()=>publishCurrent(0)}
 else if(ph==="q"||ph==="rev"){const a=playlist[idx],result=ph==="rev",counts=state.cnt||[];app.innerHTML='<span class="pill">'+(idx+1)+' / '+state.meta.total+' • '+(c.type==="poll"?"LIVE POLL":"QUIZ")+'</span><h1 class="hero">'+escA(a?.title||state.current.title)+'</h1><div class="panel"><h2>'+escA(state.current.q)+'</h2>'+(result?chart(state.current.options,counts):'<p class="muted">الاختيارات ظهرت عند المتدربين، ونتائجهم لسه مخفية.</p>')+'<p id="answer-count" class="status"></p></div><div class="actions"><button class="btn ghost" id="projector">البروجيكتور</button>'+(result?'<button class="btn" id="next">النشاط التالي ←</button>':'<button class="btn" id="reveal">إظهار النتائج</button>')+'<button class="btn danger" id="end">إنهاء الجلسة</button></div>';if(result)$("next").onclick=next;else $("reveal").onclick=reveal;renderStats()}
 else if(ph==="end"){app.innerHTML='<h1 class="hero">انتهت الجلسة 🏆</h1><div class="panel"><h2>الترتيب النهائي</h2>'+ranks()+'</div><button class="btn danger" id="end">إغلاق الجلسة وحذفها</button>'}
 if($("projector"))$("projector").onclick=()=>openExternal(link.screen);if($("end"))$("end").onclick=finishRoom;
}
function joinForm(){if(state.ctl.lock){msg("الانضمام للجلسة مغلق الآن");return}app.innerHTML='<h1 class="hero">أهلاً بيك في الـArena</h1><p class="lead">'+escA(state.meta.title)+'</p><div class="panel"><label>الاسم<input id="name" maxlength="30" placeholder="اكتب اسمك"></label><label>الرقم الوظيفي<input id="employee" maxlength="20" placeholder="Employee ID" dir="ltr"></label><button class="btn" id="join">انضم للجلسة</button><p id="error" class="error"></p></div>';$("join").onclick=async()=>{const n=$("name").value.trim(),id=$("employee").value.toUpperCase().replace(/[^A-Z0-9_-]/g,"");if(!n||!id){$("error").textContent="أدخل الاسم والرقم الوظيفي";return}const b=$("join");b.disabled=true;try{await db.ref("eids/"+room+"/"+id).set(uid());await db.ref(roomPath(room)+"/players/"+uid()+"/name").set(n)}catch(e){$("error").textContent="تعذر الانضمام، تأكد إن الرقم الوظيفي متاح والجلسة مفتوحة";b.disabled=false}}}
function pickStoreKey(){return "arenaV2Pick:"+room+":"+uid()+":"+state.ctl.i+":"+state.ctl.startedAt}
function selectedPick(){try{const v=localStorage.getItem(pickStoreKey());return v!==null&&/^[0-3]$/.test(v)?+v:-1}catch(e){return -1}}
async function submitChoice(k){const els=app.querySelectorAll("[data-choice]");els.forEach(b=>b.disabled=true);const status=$("status");status.textContent="جاري إرسال اختيارك...";try{await db.ref("ans/"+room+"/"+state.ctl.i+"/"+uid()).set({k,ts:firebase.database.ServerValue.TIMESTAMP});try{localStorage.setItem(pickStoreKey(),String(k))}catch(e){}status.textContent="تم تسجيل اختيارك ✓";els[k]?.classList.add("selected")}catch(e){status.textContent="تعذر إرسال الإجابة. حاول مجددًا.";els.forEach(b=>b.disabled=false)}}
function drawParticipant(){
 if(!state)return;const me=state.players?.[uid()];if(!me?.name){joinForm();return}
 const c=state.ctl,ph=c.phase,key=ph+":"+c.i+":"+c.startedAt;if(lastKey===key)return;lastKey=key;
 if(ph==="lobby"){msg("أهلاً "+me.name+"! أنت داخل الجلسة بنجاح. استنى المدرب يبدأ أول نشاط.");return}
 if(ph==="q"){const a=state.current,selected=selectedPick();app.innerHTML='<span class="pill">'+(a.type==="quiz"?"QUIZ CHALLENGE":"LIVE POLL")+'</span><h1 class="hero">'+escA(a.title)+'</h1><h2 class="question">'+escA(a.q)+'</h2><div id="choices">'+optionsHtml(a.options,selected>=0,selected)+'</div><p class="status" id="status">'+(selected>=0?"تم تسجيل اختيارك":"اختار إجابة واحدة")+'</p>';app.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>submitChoice(+b.dataset.choice));return}
 if(ph==="rev"){const a=state.current,counts=state.cnt||[];app.innerHTML='<span class="pill">RESULT REVEAL</span><h1 class="hero">'+escA(a.title)+'</h1><div class="panel"><h2>'+escA(a.q)+'</h2>'+chart(a.options,counts)+(a.type==="quiz"?'<p class="status">الإجابة الصحيحة: '+escA(a.options[c.correct]||"")+'</p><p>رصيدك: <b>'+Number(me.score||0)+'</b> نقطة</p>':'<p>شكرًا على تصويتك!</p>')+'</div><p class="muted">استنى النشاط التالي؛ مفيش QR تاني.</p>';return}
 if(ph==="end"){app.innerHTML='<h1 class="hero">انتهت الـArena 🏆</h1><p>شكرًا لمشاركتك يا '+escA(me.name)+'</p><div class="panel"><h2>النتيجة النهائية</h2>'+ranks()+'</div>'}
}
function drawScreen(){
 if(!state)return;const c=state.ctl,ph=c.phase,link=urls();const current=state.current||{};
 if(ph==="lobby"){if(lastKey!=="lobby"){app.innerHTML='<section class="hero-stage"><span class="pill">GET READY</span><h1 class="hero">'+escA(state.meta.title)+'</h1><h2>امسح QR وادخل المنافسة</h2><div class="qr" id="qr"></div><p class="code">'+escA(room)+'</p><p id="people"></p></section>';if(window.QRCode)new QRCode($("qr"),{text:link.join,width:250,height:250});lastKey="lobby"}if($("people"))$("people").textContent=Object.keys(state.players||{}).length+" مشارك جاهز";return}
 if(ph==="q"){const key=ph+":"+c.i+":"+c.startedAt;if(lastKey!==key){clearInterval(timer);timer=null;lastKey=key;app.innerHTML='<section class="hero-stage"><span class="pill">'+(current.type==="poll"?"LIVE POLL":"QUIZ ARENA")+' • '+(c.i+1)+'/'+state.meta.total+'</span><h1 class="hero">'+escA(current.title)+'</h1><h2 class="question">'+escA(current.q)+'</h2><div class="grid">'+current.options.map((x,i)=>'<div class="activity"><span class="pill">'+"ABCD"[i]+'</span><h2>'+escA(x)+'</h2></div>').join("")+'</div>'+(current.type==="quiz"?'<div class="countdown" id="clock"></div>':'<p class="lead">صوّت من موبايلك!</p>')+'</section>'}
 if(current.type==="quiz"&&!timer){timer=setInterval(()=>{if(!state||state.ctl.phase!=="q"){clearInterval(timer);timer=null;return}const left=Math.max(0,current.seconds-Math.floor((now()-c.startedAt)/1000));if($("clock"))$("clock").textContent=left},250)}return}
 clearInterval(timer);timer=null;
 const key=ph+":"+c.i;if(lastKey===key)return;lastKey=key;
 if(ph==="rev"){app.innerHTML='<section class="hero-stage"><span class="pill">RESULT REVEAL</span><h1 class="hero">'+escA(current.title)+'</h1><h2>'+escA(current.q)+'</h2><div class="panel">'+chart(current.options,state.cnt||[])+'</div>'+(current.type==="quiz"?'<h2 class="status">الإجابة الصحيحة: '+escA(current.options[c.correct]||"")+'</h2><div class="panel"><h2>لوحة الصدارة</h2>'+ranks()+'</div>':'<h2 class="status">كل صوت يصنع فرقًا</h2>')+'</section>'}
 else if(ph==="end"){app.innerHTML='<section class="hero-stage"><span class="pill">THE FINALS</span><h1 class="hero">أبطال الـArena 🏆</h1><div class="panel">'+ranks()+'</div></section>'}
}
