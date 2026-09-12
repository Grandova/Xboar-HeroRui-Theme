import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {mockAPI,authenticate} from './state.mjs';
const {preview}=await import('vite');const server=await preview({preview:{host:'127.0.0.1',port:4183,strictPort:true}});
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),headless:true}),page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mockAPI(page);await authenticate(page);await mkdir('dist/HeroRui-preview',{recursive:true});
for(const route of ['dashboard','plan','plan/1','order/202609120001','ticket/1','profile','knowledge','invite','node']){await page.goto('http://127.0.0.1:4183/#/'+route);await page.locator('h1').waitFor();await page.waitForTimeout(900);await page.screenshot({path:'dist/HeroRui-preview/'+route.replace('/','-')+'.png',fullPage:true});}
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4183/#/dashboard');await page.waitForTimeout(650);await page.screenshot({path:'dist/HeroRui-preview/mobile.png',fullPage:true});
const auth=await browser.newPage({viewport:{width:1440,height:1000}});await mockAPI(auth);auth.on('pageerror',e=>errors.push(e.message));await auth.goto('http://127.0.0.1:4183/#/login');await auth.getByRole('button',{name:'登入',exact:true}).waitFor();await auth.screenshot({path:'dist/HeroRui-preview/login.png',fullPage:true});
console.log(JSON.stringify({errors,text:await page.locator('body').innerText()},null,2));await browser.close();await new Promise(r=>server.httpServer.close(r));
