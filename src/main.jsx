import React,{useState,useEffect,useContext} from 'react';
import {createRoot} from 'react-dom/client';
import {App as AntApp,ConfigProvider,theme as antTheme,Dropdown,Drawer,Select,Alert,Spin} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import {ArrowUpRight,Menu,Sun,Moon,ChevronDown,Maximize,LogOut,UserRound} from 'lucide-react';
import {settings,token,logout,useRoute,navigate,LocaleContext,getLocale,persistLocale,languageOptions,AuthContext,useResource,useT,Action} from './core';
import {AuthPage} from './auth';
import {Dashboard} from './dashboard';
import {Plans,PlanDetail,Orders,OrderDetail} from './commerce';
import {Profile,Invite} from './account';
import {Nodes,Traffic,Knowledge,Tickets} from './support';
import './style.css';

class ErrorBoundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return{error}}render(){return this.state.error?<div className="fatal-error"><h1>页面暂时无法显示</h1><p>请刷新重试，或联系站点管理员。</p><Action onClick={()=>location.reload()}>重新加载</Action></div>:this.props.children}}
function Workspace({route,dark,setDark}){
 const t=useT(),{locale,setLocale}=useContext(LocaleContext),user=useResource('/user/info'),config=useResource('/user/comm/config'),subscribe=useResource('/user/getSubscribe');const [menu,setMenu]=useState(false);
 const reload=()=>{user.reload();subscribe.reload()};const [pathname,search='']=route.split('?'),parts=pathname.split('/').filter(Boolean),page=parts[0]||'dashboard',id=parts[1],query=new URLSearchParams(search);
 const nav=[['dashboard','总览'],['plan','购买订阅'],['node','节点状态'],['invite','我的邀请'],['knowledge','使用文档'],['ticket','我的工单']];
 useEffect(()=>setMenu(false),[route]);
 const error=user.error||config.error||subscribe.error;
 if(error)return <div className="fatal-error"><Alert type="error" title={error}/><Action onClick={()=>{reload();config.reload()}}>{t('重试')}</Action><button className="text-button" onClick={logout}>{t('返回登入')}</button></div>;
 if(!user.value||!config.value||!subscribe.value)return <div className="boot-screen"><span className="brand-icon">h.</span><Spin/><p>{t('加载中')}</p></div>;
 const screens={dashboard:<Dashboard/>,plan:id?<PlanDetail key={id+search} id={id} query={query}/>:<Plans/>,order:id?<OrderDetail key={id} trade={id}/>:<Orders/>,node:<Nodes/>,traffic:<Traffic/>,invite:<Invite/>,profile:<Profile/>,knowledge:<Knowledge/>,ticket:<Tickets key={id||'list'} id={id}/>};
 const accountItems=[{key:'profile',label:t('个人中心')},{key:'order',label:t('我的订单')},{key:'traffic',label:t('流量明细')},{type:'divider'},{key:'fullscreen',label:t('全屏')},{key:'logout',label:t('退出登录'),danger:true}];
 const accountClick=({key})=>{if(key==='logout')logout();else if(key==='fullscreen'){const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();p?.catch(()=>{})}else navigate('/'+key)};
 return <AuthContext.Provider value={{user:user.value,config:config.value,subscribe:subscribe.value,reload}}><div className="app-shell"><a href="#main-content" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main-content').focus()}}>跳到主要内容</a><header className="site-header"><div className="header-inner"><a href="#/dashboard" className="brand"><span className="brand-icon">{settings.logo?<img src={settings.logo} alt=""/>:'h.'}</span><span>{settings.title||'HeroRui'}</span></a><nav className="desktop-nav" aria-label="主导航">{nav.map(([key,label])=><a key={key} className={page===key?'active':''} href={'#/'+key}>{t(label)}</a>)}</nav><div className="header-tools"><button className="icon-button" aria-label={dark?'切换浅色':'切换深色'} onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><Dropdown menu={{items:accountItems,onClick:accountClick}} trigger={['click']}><button className="account-trigger" aria-label="账户菜单"><span>{user.value.email?.[0]?.toUpperCase()}</span><ChevronDown size={13}/></button></Dropdown><button className="icon-button mobile-menu" aria-label="打开导航" onClick={()=>setMenu(true)}><Menu size={22}/></button></div></div></header><div className="section-rail"><span>HERORUI / MEMBER SPACE</span><a href="#/order">{t('我的订单')} <ArrowUpRight size={12}/></a></div><main id="main-content" tabIndex={-1} className="main-content" key={page}>{screens[page]||<><h1>404</h1><a href="#/dashboard">{t('返回首页')}</a></>}</main><footer className="site-footer"><span>© {new Date().getFullYear()} {settings.title||'HeroRui'}</span><span className="footer-motto">A LITTLE LESS. A LITTLE BETTER.</span><Select aria-label="Language" value={locale} options={languageOptions} onChange={setLocale} variant="borderless"/></footer><Drawer title={settings.title||'HeroRui'} open={menu} onClose={()=>setMenu(false)} placement="right"><nav className="drawer-nav">{[...nav,['order','我的订单'],['traffic','流量明细'],['profile','个人中心']].map(([key,label],i)=><a key={key} className={page===key?'active':''} href={'#/'+key}><span>{String(i+1).padStart(2,'0')}</span>{t(label)}<ArrowUpRight size={18}/></a>)}</nav></Drawer></div></AuthContext.Provider>
}
function Root(){const route=useRoute(),[authenticated,setAuthenticated]=useState(!!token()),[locale,setLocaleValue]=useState(getLocale),[dark,setDarkValue]=useState(()=>localStorage.getItem('herorui-mode')==='dark');
 const setLocale=value=>{persistLocale(value);setLocaleValue(value)};const setDark=value=>{localStorage.setItem('herorui-mode',value?'dark':'light');setDarkValue(value)};
 useEffect(()=>{const change=()=>setAuthenticated(!!token());addEventListener('authchange',change);return()=>removeEventListener('authchange',change)},[]);
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='fa-IR'?'rtl':'ltr';document.documentElement.classList.toggle('dark',dark);document.documentElement.dataset.theme=dark?'dark':'light';document.title=settings.title||'HeroRui'},[locale,dark]);
 const isAuth=/^\/(login|register|forgetpassword)(\?|$)/.test(route);
 useEffect(()=>{if(!authenticated&&!isAuth)navigate('/login?redirect='+encodeURIComponent(route));else if(authenticated&&isAuth&&/^#\/(login|register|forgetpassword)(\?|$)/.test(location.hash))navigate('/dashboard')},[authenticated,isAuth,route]);
 return <LocaleContext.Provider value={{locale,setLocale}}><ConfigProvider button={{autoInsertSpace:false}} locale={locale.startsWith('zh')?zhCN:enUS} direction={locale==='fa-IR'?'rtl':'ltr'} theme={{algorithm:dark?antTheme.darkAlgorithm:antTheme.defaultAlgorithm,token:{colorPrimary:'#ce303b',colorInfo:'#ce303b',borderRadius:10,fontFamily:'Inter, "Segoe UI", "Microsoft YaHei", sans-serif',controlHeight:44,colorBgContainer:dark?'#211e20':'#ffffff'},components:{Table:{headerBg:dark?'#292426':'#f8f6f5'},Tabs:{inkBarColor:'#ce303b'}}}}><AntApp><ErrorBoundary>{authenticated?<Workspace route={route} dark={dark} setDark={setDark}/>:<AuthPage route={isAuth?route:'/login'}/>}</ErrorBoundary></AntApp></ConfigProvider></LocaleContext.Provider>
}
createRoot(document.getElementById('root')).render(<Root/>);
