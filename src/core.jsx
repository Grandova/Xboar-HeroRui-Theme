import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import {App as AntApp,Alert,Skeleton,Empty,Button as AntButton} from 'antd';
import {Button,Card,Chip} from '@heroui/react';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import dictionaries from './translations.json';
export const settings=window.settings||{};
const tokenKey='VUE_NAIVE_ACCESS_TOKEN',localeKey='VUE_NAIVE_LOCALE';
export const storage={get(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}},remove(key){try{localStorage.removeItem(key)}catch{}}};
export function token(){const entry=storage.get(tokenKey);return entry && (!entry.expire || entry.expire>Date.now())?entry.value:null;}
export function saveToken(value){storage.set(tokenKey,{value,time:Date.now(),expire:Date.now()+21600000});}
export function logout(){storage.remove(tokenKey);location.hash='/login';window.dispatchEvent(new Event('authchange'));}
export function navigate(path){location.hash=path;}
export function useRoute(){const read=()=>location.hash.slice(1)||'/dashboard';const [route,setRoute]=useState(read);useEffect(()=>{const changed=()=>{setRoute(read());window.scrollTo(0,0)};addEventListener('hashchange',changed);return()=>removeEventListener('hashchange',changed)},[]);return route;}
export const LocaleContext=createContext({locale:'zh-CN',setLocale:()=>{}});
export function useT(){const {locale}=useContext(LocaleContext);return (key,params={})=>{let value=(dictionaries[locale]?.[key]||dictionaries['en-US']?.[key]||key);for(const [k,v]of Object.entries(params))value=value.replaceAll('{'+k+'}',v);return value;};}
export const getLocale=()=>storage.get(localeKey)?.value||'zh-CN';
export function persistLocale(locale){storage.set(localeKey,{value:locale,time:Date.now(),expire:null});}
export const languageOptions=[['zh-CN','简体中文'],['en-US','English'],['ja-JP','日本語'],['vi-VN','Tiếng Việt'],['ko-KR','한국어'],['zh-TW','繁體中文'],['fa-IR','فارسی']].map(([value,label])=>({value,label}));
export async function request(endpoint,{method='GET',data,signal}={}){
 const base=new URL(window.routerBase||'/',location.origin);if(!base.pathname.endsWith('/'))base.pathname+='/';
 const url=new URL('api/v1/'+endpoint.replace(/^\//,''),base);const headers={'Accept':'application/json','Content-Language':getLocale()};
 if(token())headers.Authorization=token();let body;
 if(method==='GET'){Object.entries(data||{}).forEach(([k,v])=>v!=null&&url.searchParams.set(k,v));url.searchParams.set('t',Date.now());}
 else{headers['Content-Type']='application/x-www-form-urlencoded';body=new URLSearchParams(Object.entries(data||{}).filter(([,v])=>v!=null)).toString();}
 const timeout=AbortSignal.timeout(20000);const response=await fetch(url,{method,headers,body,signal:signal?AbortSignal.any([signal,timeout]):timeout});
 let result;try{result=await response.json()}catch{throw Error('服务器返回了无效响应，请稍后重试。');}
 if(response.status===401 || response.status===403){if(!endpoint.includes('/passport/')&&!endpoint.includes('/guest/'))logout();}
 if(!response.ok || result.status==='fail'||result.status==='error'){throw Error(result.message||Object.values(result.errors||{}).flat().join('；')||`请求失败 (${response.status})`);}
 return result;
}
export const api=async(endpoint,data)=> (await request(endpoint,{data})).data;
export const post=async(endpoint,data)=> (await request(endpoint,{method:'POST',data})).data;
export function useResource(endpoint,params={}){
 const [value,setValue]=useState(),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,revise]=useState(0);const key=JSON.stringify(params);
 useEffect(()=>{if(!endpoint){setLoading(false);return}const controller=new AbortController();setLoading(true);setError('');request(endpoint,{data:JSON.parse(key),signal:controller.signal}).then(r=>{setValue(r.data);setLoading(false)}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setLoading(false)}});return()=>controller.abort()},[endpoint,key,revision]);
 return {value,error,loading,reload:useCallback(()=>revise(x=>x+1),[]),setValue};
}
export function useAction(){const {message}=AntApp.useApp();const [busy,setBusy]=useState(false),lock=useRef(false);const run=async(fn,success)=>{if(lock.current)return;lock.current=true;setBusy(true);try{const result=await fn();if(success)message.success(success);return result}catch(e){message.error(e.message);return undefined}finally{lock.current=false;setBusy(false)}};return{busy,run};}
export function Load({resource,children}){const t=useT();if(resource.loading&&!resource.value)return <Skeleton active paragraph={{rows:4}}/>;if(resource.error)return <Alert type="error" title={resource.error} action={<AntButton onClick={resource.reload}>{t('重试')}</AntButton>}/>;return children(resource.value);}
export function Panel({children,className='',...props}){return <Card className={'panel '+className} {...props}><Card.Content>{children}</Card.Content></Card>}
export function Action({children,onClick,loading,disabled,variant='primary',...props}){return <Button variant={variant} isPending={loading} isDisabled={disabled} onPress={onClick} {...props}>{children}</Button>}
export function Status({children,tone='default'}){return <Chip size="sm" variant="soft" className={'status status-'+tone}>{children}</Chip>}
export function Heading({kicker,title,children,action}){return <div className="page-heading"><div><span className="eyebrow">{kicker}</span><h1>{title}</h1>{children&&<p>{children}</p>}</div>{action}</div>}
export function Blank(){const t=useT();return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('暂无数据')}/>}
export function Rich({content=''}){
 const {run}=useAction(),t=useT();let html='';
 try{const rows=JSON.parse(content);if(Array.isArray(rows))return <ul className="features">{rows.map((r,i)=><li key={i} className={r.support===false?'muted':''}><span>{r.support===false?'−':'✓'}</span>{r.feature||r.name||r.text||r.value}</li>)}</ul>}catch{}
 // Preserve legacy knowledge copy/jump buttons without executing arbitrary inline JavaScript.
 const parsed=new DOMParser().parseFromString(marked.parse(String(content)),'text/html');
 for(const element of parsed.querySelectorAll('[onclick]')){const handler=element.getAttribute('onclick').trim();const jump=handler.match(/^(?:window\.)?jump\(\s*['"]?(\d+)['"]?\s*\)\s*;?$/),copy=handler.match(/^(?:window\.)?copy\(\s*(['"])([\s\S]*?)\1\s*\)\s*;?$/);if(jump)element.dataset.knowledgeId=jump[1];if(copy&&!copy[2].includes(copy[1]))element.dataset.copyText=copy[2];element.removeAttribute('onclick')}
 for(const a of parsed.querySelectorAll('a[target="_blank"]'))a.setAttribute('rel','noopener noreferrer');
 html=DOMPurify.sanitize(parsed.body.innerHTML,{ADD_ATTR:['target'],FORBID_TAGS:['style','form','input'],ALLOWED_URI_REGEXP:/^(?:(?:https?|mailto|tel|clash|hiddify|sub|stash|surge|quantumult-x):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i});
 return <div className="rich" onClick={e=>{const copy=e.target.closest('[data-copy-text]');if(copy){e.preventDefault();run(()=>copyText(copy.dataset.copyText),t('复制成功'))}}} dangerouslySetInnerHTML={{__html:html}}/>;
}
export function money(cents=0){return (Number(cents||0)/100).toFixed(2)}
export function bytes(n=0){n=Number(n)||0;const sizes=['B','KB','MB','GB','TB'];const i=n>0?Math.min(4,Math.floor(Math.log(n)/Math.log(1024))):0;return `${(n/1024**i).toFixed(i?2:0)} ${sizes[i]}`;}
export function date(n,includeTime=false){if(!n)return '—';return new Intl.DateTimeFormat(getLocale(),{year:'numeric',month:'2-digit',day:'2-digit',...(includeTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(n*1000));}
export const periodNames={month_price:'月付',quarter_price:'季付',half_year_price:'半年付',year_price:'年付',two_year_price:'两年付',three_year_price:'三年付',onetime_price:'一次性',reset_price:'重置流量包'};
export function availablePeriods(plan){return Object.keys(periodNames).filter(k=>plan?.[k]!=null)}
export const AuthContext=createContext({});
export function useAccount(){return useContext(AuthContext)}
export async function copyText(text){if(!text)throw Error('暂无可复制的内容');if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);const e=document.createElement('textarea');e.value=text;e.style.position='fixed';e.style.opacity='0';document.body.append(e);e.select();const ok=document.execCommand('copy');e.remove();if(!ok)throw Error('复制失败，请手动复制');}
export function safeURL(value){if(!value)return null;try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
