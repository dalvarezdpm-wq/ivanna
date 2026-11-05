import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,doc,getDoc,setDoc,collection,onSnapshot,writeBatch,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {getStorage,ref,uploadBytes,getDownloadURL} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

let U,FID,ROLE,stRef,evCol,remoteSt='',remote=new Map(),unsubs=[],gotSt=false,gotEv=false,auth,db,storage;
const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:1)):v);
const show=h=>{window.cloudReady=false;$('#app').innerHTML=`<div class="top"><h1>${esc(S.app)}</h1></div>`+h;$('#bar').innerHTML=''};
const note=m=>{let d=$('#sync');if(!d){d=document.createElement('div');d.id='sync';d.className='warn';d.style.cssText='position:fixed;top:8px;left:8px;right:8px;z-index:9;max-width:540px;margin:0 auto';document.body.append(d)}d.textContent=m;d.hidden=!m};
const EMPTY=()=>({babies:[],events:[],meds:[],vax:[],vxc:[],gr:[],rut:[],cur:null,app:'Mi bebé'});

function gate(msg=''){show(`<section class="empty"><h2>Inicia sesión</h2><p>Los datos de tu bebé se guardan en tu cuenta y solo los ven las personas que invites.</p><label>Correo<input id="a_e" type="email" autocomplete="email"></label><label>Contraseña (mínimo 8 caracteres)<input id="a_p" type="password" autocomplete="current-password"></label><div class="err">${esc(msg)}</div><div class="row"><button class="g" onclick="authGo(false)">Crear cuenta</button><button class="p" onclick="authGo(true)">Entrar</button></div><p><a href="#" onclick="authReset();return false" style="color:var(--acc)">Olvidé mi contraseña</a></p></section>`)}
function famGate(msg=''){show(`<section class="empty"><h2>Tu espacio familiar</h2><p>Crea uno para tu bebé, o únete con el código que te compartió el otro padre o cuidador.</p><button class="p" onclick="famNew()">Crear espacio familiar</button><label>Código de invitación<input id="a_c" autocapitalize="characters"></label><div class="err">${esc(msg)}</div><button class="g" onclick="famJoin()">Unirme con código</button><p><a href="#" onclick="logout();return false" style="color:var(--acc)">Cerrar sesión</a></p></section>`)}
const MSG={'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/email-already-in-use':'Ese correo ya tiene una cuenta. Usa Entrar.','auth/invalid-email':'Revisa el correo.','auth/too-many-requests':'Demasiados intentos. Espera unos minutos.'};
async function authGo(login){const e=$('#a_e').value.trim(),p=$('#a_p').value;if(!e||p.length<8)return gate('Escribe tu correo y una contraseña de al menos 8 caracteres.');try{login?await signInWithEmailAndPassword(auth,e,p):await createUserWithEmailAndPassword(auth,e,p)}catch(x){gate(MSG[x.code]||'No se pudo completar. Inténtalo de nuevo.')}}
async function authReset(){const e=$('#a_e').value.trim();if(!e)return gate('Escribe tu correo y vuelve a tocar «Olvidé mi contraseña».');try{await sendPasswordResetEmail(auth,e)}catch(x){}gate('Si el correo existe, recibirás un enlace para restablecerla.')}
async function famNew(){try{const fid=crypto.randomUUID();await setDoc(doc(db,'families',fid),{owner:U.uid,created:serverTimestamp()});await setDoc(doc(db,'families',fid,'members',U.uid),{role:'admin',email:U.email,created:serverTimestamp()});await setDoc(doc(db,'users',U.uid),{fid});start(fid)}catch(e){console.error(e);famGate('No se pudo crear el espacio. Inténtalo de nuevo.')}}
async function famJoin(){const c=($('#a_c').value||'').trim().toUpperCase();if(!c)return famGate('Escribe el código.');try{const iv=await getDoc(doc(db,'invites',c));if(!iv.exists()||iv.data().exp<Date.now())return famGate('El código no es válido o ya venció.');const fid=iv.data().fid;await setDoc(doc(db,'families',fid,'members',U.uid),{role:'member',code:c,email:U.email,created:serverTimestamp()});await setDoc(doc(db,'users',U.uid),{fid});start(fid)}catch(e){console.error(e);famGate('No se pudo unir con ese código.')}}
async function invite(){if(ROLE!=='admin')return err('Solo quien creó el espacio puede invitar.');const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',c=[...crypto.getRandomValues(new Uint8Array(10))].map(x=>A[x%32]).join('');try{await setDoc(doc(db,'invites',c),{fid:FID,by:U.uid,exp:Date.now()+7*864e5});$('#er').style.color='var(--acc)';$('#er').textContent='Código para el otro cuidador (válido 7 días): '+c}catch(e){err('No se pudo crear la invitación.')}}
async function logout(){await signOut(auth)}

const ready=()=>{if(gotSt&&gotEv){window.cloudReady=true;if(!$('#sh').innerHTML)render()}};
const onErr=e=>{console.error(e);note('No se pudo sincronizar ('+(e.code||'error')+'). Tus cambios se reintentarán al volver la conexión.')};
function onState(s){gotSt=true;if(s.exists()&&!s.metadata.hasPendingWrites){const j=s.data().json;if(j!==remoteSt){remoteSt=j;const cur=S.cur;Object.assign(S,JSON.parse(j));S.cur=S.babies.some(b=>b.id===cur)?cur:S.babies[0]?.id||null}}if(!S.cur&&S.babies.length)S.cur=S.babies[0].id;note('');ready()}
function onEv(s){gotEv=true;S.events=s.docs.map(d=>({...d.data(),id:d.id}));remote=new Map(S.events.map(e=>[e.id,canon(e)]));ready()}
async function start(fid){FID=fid;stRef=doc(db,'families',fid,'data','state');evCol=collection(db,'families',fid,'events');
 try{ROLE=(await getDoc(doc(db,'families',fid,'members',U.uid))).data()?.role}catch(e){}
 S.user=localStorage.getItem('bebe-user')||U.email.split('@')[0];
 show('<p class="soon" style="text-align:center;padding:30px">Cargando…</p>');
 unsubs.push(onSnapshot(stRef,onState,onErr),onSnapshot(evCol,onEv,onErr))}
window.cloudSync=async()=>{if(!FID||!gotSt||!gotEv)return;
 try{localStorage.setItem('bebe-user',S.user||'')}catch(e){}
 const st=JSON.stringify({babies:S.babies,meds:S.meds,vax:S.vax,vxc:S.vxc,gr:S.gr,rut:S.rut||[],app:S.app}),ops=[];
 if(st!==remoteSt){remoteSt=st;ops.push(b=>b.set(stRef,{json:st,by:U.uid,updated:serverTimestamp()}))}
 const cur=new Map(S.events.map(e=>[e.id,canon(e)]));
 for(const [id,j] of cur)if(remote.get(id)!==j){remote.set(id,j);ops.push(b=>b.set(doc(evCol,id),JSON.parse(j)))}
 for(const id of [...remote.keys()])if(!cur.has(id)){remote.delete(id);ops.push(b=>b.delete(doc(evCol,id)))}
 try{for(let i=0;i<ops.length;i+=400){const b=writeBatch(db);ops.slice(i,i+400).forEach(f=>f(b));await b.commit()}}catch(e){onErr(e)}};

window.upFile=async(f,kind)=>{if(!FID)throw new Error('sin sesión');const r=ref(storage,`families/${FID}/${kind}/${U.uid}-${Date.now()}-${f.name.replace(/[^\w.-]/g,'_')}`);await uploadBytes(r,f,{contentType:f.type});return getDownloadURL(r)};
Object.assign(window,{authGo,authReset,famNew,famJoin,invite,logout});
if(firebaseConfig.apiKey.startsWith('PEGA')){show('<section class="empty"><h2>Falta configurar Firebase</h2><p>Pega los datos de tu proyecto en firebase-config.js y vuelve a publicar.</p></section>')}
else{
 const app=initializeApp(firebaseConfig);auth=getAuth(app);storage=getStorage(app);
 db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
 onAuthStateChanged(auth,async u=>{
  unsubs.forEach(f=>f());unsubs=[];FID=null;gotSt=gotEv=false;remote=new Map();remoteSt='';U=u;
  if(!u){Object.assign(S,EMPTY());S.user='';return gate()}
  try{const m=await getDoc(doc(db,'users',u.uid));m.exists()?start(m.data().fid):famGate()}catch(e){onErr(e);famGate('No se pudo leer tu cuenta. Revisa tu conexión.')}})}
