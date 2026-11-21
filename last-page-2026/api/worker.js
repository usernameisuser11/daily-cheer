const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{...h,'Content-Type':'application/json; charset=utf-8'}});
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const hash=async t=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));
const bad=(message,status=400)=>{const e=new Error(message);e.status=status;throw e};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const secretRE=/^[A-Za-z0-9_-]{32}$/;
const cleanse=s=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
const allowHeaders=(origin,env)=>{const h={'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};if(origin&&(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).includes(origin)){h['Access-Control-Allow-Origin']=origin;h['Access-Control-Allow-Methods']='GET, POST, OPTIONS';h['Access-Control-Allow-Headers']='Content-Type, X-Admin-Key';h['Access-Control-Max-Age']='86400';}return h;};
async function read(req){if(Number(req.headers.get('content-length')||0)>10000)bad('요청이 너무 커.',413);let x;try{const raw=await req.text();if(raw.length>10000)bad('요청이 너무 커.',413);x=JSON.parse(raw)}catch(e){if(e.status)throw e;bad('JSON 요청만 가능해.')}if(!x||typeof x!=='object'||Array.isArray(x))bad('요청을 확인해 줘.');return x;}
function receipt(s){const m=typeof s==='string'&&/^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/i.exec(s.trim());if(!m||!uuid.test(m[1]))bad('열람 코드 형식을 확인해 줘.');return {id:m[1],secret:m[2]}}
async function owner(x,env){const r=receipt(x.receipt);const l=await env.DB.prepare('SELECT * FROM letters WHERE id=? AND secret_hash=?').bind(r.id,await hash(r.secret)).first();if(!l)bad('편지를 찾지 못했어.',404);return l}
async function create(req,env){const x=await read(req),now=Date.now();if(typeof x.id!=='string'||!uuid.test(x.id)||!secretRE.test(x.secret||''))bad('편지 인증 정보를 확인해 줘.');
if(typeof x.body!=='string'||!x.body.trim()||x.body.length>1500)bad('편지는 1~1500자로 작성해 줘.');
if(typeof x.nickname!=='string'||!x.nickname.trim()||x.nickname.length>20)bad('별명을 확인해 줘.');
if(!['ivory','blue','rose','sage'].includes(x.envelope)||!['public','private'].includes(x.audience))bad('편지 설정을 확인해 줘.');
const t=Date.parse(x.open_at);if(!Number.isFinite(t)||t<now-300000||t>Date.parse('2027-02-01T00:00:00+09:00'))bad('공개 날짜를 확인해 줘.');
const iphash=await hash(env.IP_SALT+'|'+(req.headers.get('CF-Connecting-IP')||'unknown'));
const start=new Date(now).toISOString().slice(0,10)+'T00:00:00.000Z';const ct=await env.DB.prepare('SELECT COUNT(*) n FROM letters WHERE submit_ip_hash=? AND created_at>=?').bind(iphash,start).first();if(Number(ct?.n||0)>=8)bad('오늘은 이 네트워크에서 작성 한도를 넘었어.',429);
await env.DB.prepare('INSERT INTO letters (id,body,nickname,envelope,audience,open_at,created_at,status,secret_hash,submit_ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(x.id,cleanse(x.body.trim()),cleanse(x.nickname.trim()),x.envelope,x.audience,new Date(t).toISOString(),new Date(now).toISOString(),x.audience==='public'?'pending':'approved',await hash(x.secret),iphash).run();return {ok:true,id:x.id,status:x.audience==='public'?'pending':'approved'};}
export default {async fetch(req,env){const origin=req.headers.get('origin'),h=allowHeaders(origin,env);if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h});if(origin&&h['Access-Control-Allow-Origin']!==origin)return json({error:'허용되지 않은 출처야.'},403,h);try{if(!env.DB||!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<32||!env.IP_SALT||env.IP_SALT.length<24||!env.ALLOWED_ORIGINS)bad('서버 설정이 완료되지 않았어.',503);
const p=new URL(req.url).pathname.replace(/\/$/,'');if(req.method==='GET'&&p==='/api/health')return json({ok:true,service:'last-page-api'},200,h);
if(req.method==='GET'&&p==='/api/gallery'){const now=new Date().toISOString();const {results=[]}=await env.DB.prepare("SELECT id,body,nickname,envelope,created_at,open_at FROM letters WHERE audience='public' AND status='approved' AND open_at<=? ORDER BY created_at DESC LIMIT 90").bind(now).all();const sealed=await env.DB.prepare("SELECT COUNT(*) n FROM letters WHERE audience='public' AND status='approved' AND open_at>?").bind(now).first();return json({letters:results,sealed_count:sealed?.n||0},200,h)}
if(req.method==='POST'&&p==='/api/letters')return json(await create(req,env),201,h);
if(req.method==='POST'&&p==='/api/letters/recover'){const l=await owner(await read(req),env);const closed=Date.parse(l.open_at)>Date.now();return json({letter:{id:l.id,body:closed?null:l.body,nickname:l.nickname,envelope:l.envelope,audience:l.audience,open_at:l.open_at,created_at:l.created_at,status:l.status,is_sealed:closed}},200,h)}
if(req.method==='POST'&&p==='/api/letters/delete'){const l=await owner(await read(req),env);await env.DB.prepare('DELETE FROM letters WHERE id=?').bind(l.id).run();return json({ok:true},200,h)}
if(p.startsWith('/api/admin/')){if(req.headers.get('X-Admin-Key')!==env.ADMIN_TOKEN)bad('운영진 인증이 필요해.',403);
if(req.method==='GET'&&p==='/api/admin/pending'){const {results=[]}=await env.DB.prepare("SELECT id,body,nickname,envelope,open_at,created_at FROM letters WHERE audience='public' AND status='pending' ORDER BY created_at ASC LIMIT 100").all();return json({letters:results},200,h)}
if(req.method==='POST'&&p==='/api/admin/moderate'){const x=await read(req);if(!uuid.test(x.id||'')||!['approved','rejected'].includes(x.status))bad('검토 요청을 확인해 줘.');const r=await env.DB.prepare("UPDATE letters SET status=? WHERE id=? AND audience='public' AND status='pending'").bind(x.status,x.id).run();if(!r.meta?.changes)bad('검토할 편지가 없어.',404);return json({ok:true},200,h)}
}bad('요청한 경로가 없어.',404);
}catch(e){if((e.status||500)>=500)console.error(e.message);return json({error:(e.status||500)>=500?'서버에서 문제가 발생했어.':e.message},e.status||500,h)}}}