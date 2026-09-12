export const plan = {id:1,name:'探索者 Pro',transfer_enable:200,speed_limit:500,device_limit:5,month_price:2900,quarter_price:7900,half_year_price:14900,year_price:27900,two_year_price:null,three_year_price:null,onetime_price:null,reset_price:900,content:'<p>为日常工作与生活，保持顺畅连接。</p><p>✓ 200 GB 高速流量 / 月</p><p>✓ 全球多地区接入</p><p>✓ 最多 5 台设备</p><p>✓ 全平台客户端支持</p>',reset_traffic_method:0};
export const user = {email:'hello@example.com',uuid:'preview-user',avatar_url:'',balance:8800,commission_balance:2600,plan_id:1,expired_at:1820000000,transfer_enable:200*1073741824,u:2*1073741824,d:26.5*1073741824,remind_expire:1,remind_traffic:1,discount:0,commission_rate:20,telegram_id:null};
export const order = {trade_no:'202609120001',plan_id:1,plan,period:'month_price',type:1,status:0,total_amount:2900,discount_amount:0,balance_amount:0,surplus_amount:0,refund_amount:0,handling_amount:0,created_at:1789171200};
export async function mockAPI(page, requests = []) {
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const endpoint = url.pathname.replace('/api/v1','');
    requests.push({endpoint,method:req.method(),body:req.postData(),query:url.search});
    let data;
    switch(endpoint) {
      case '/guest/comm/config': data={is_email_verify:0,is_invite_force:0,email_whitelist_suffix:[],captcha_enable:0,captcha_type:'none',tos_url:'',telegram_login_enable:0}; break;
      case '/user/comm/config': data={currency:'CNY',currency_symbol:'¥',withdraw_methods:['支付宝'],withdraw_close:0,commission_distribution_enable:0}; break;
      case '/passport/auth/login': case '/passport/auth/register': data={auth_data:'preview-token',token:'preview-token',is_admin:0};break;
      case '/user/info': data={...user};break;
      case '/user/getSubscribe': data={...user,plan,subscribe_url:'https://example.invalid/s/preview',reset_day:18};break;
      case '/user/getStat': data=[1,1,0];break;
      case '/user/notice/fetch': data=[{id:1,title:'欢迎来到你的连接空间',content:'<p>在这里管理订阅、查看用量，随时开始新的探索。</p>',img_url:'',show:1,created_at:1789171200}];break;
      case '/user/plan/fetch': data=url.searchParams.has('id')?plan:[{...plan,id:2,name:'轻享 Starter',month_price:1200,transfer_enable:60},plan,{...plan,id:3,name:'无限可能 Max',month_price:5900,transfer_enable:500}];break;
      case '/user/order/fetch': data=[order,{...order,trade_no:'202608120001',status:3}];break;
      case '/user/order/detail': data=order;break;
      case '/user/order/getPaymentMethod': data=[{id:1,name:'支付宝',payment:'alipay',icon:null,handling_fee_fixed:0,handling_fee_percent:0}];break;
      case '/user/order/save': data=order.trade_no;break;
      case '/user/order/checkout': return route.fulfill({json:{data:'https://example.invalid/pay/preview',type:1}});
      case '/user/order/check': data=0;break;
      case '/user/coupon/check': data={id:1,code:'HERO500',type:1,value:500,limit_plan_ids:null,limit_period:null};break;
      case '/user/server/fetch': data=[{id:1,name:'香港 · Hong Kong 01',type:'vless',rate:'1.0',is_online:1,cache_key:'hk',tags:['推荐','香港']},{id:2,name:'日本 · Tokyo 01',type:'shadowsocks',rate:'1.0',is_online:1,cache_key:'jp',tags:['日本']},{id:3,name:'新加坡 · Singapore 01',type:'trojan',rate:'1.5',is_online:0,cache_key:'sg',tags:['新加坡']}];break;
      case '/user/ticket/fetch': data=url.searchParams.has('id')?{id:1,subject:'客户端连接咨询',level:1,status:0,message:[{id:1,is_me:1,message:'请问如何导入订阅？',created_at:1789171200},{id:2,is_me:0,message:'您好，请在仪表盘点击一键订阅。',created_at:1789171300}]}:[{id:1,subject:'客户端连接咨询',level:1,status:0,reply_status:1,created_at:1789171200,updated_at:1789171300}];break;
      case '/user/invite/fetch': data={codes:[{code:'HERO2026',created_at:1789171200}],stat:[12,6800,1200,20,2600]};break;
      case '/user/invite/details': data=[{created_at:1789171200,get_amount:580,trade_no:'202609120001'}];break;
      case '/user/knowledge/fetch': data=url.searchParams.has('id')?{id:1,title:'开始使用：导入订阅',body:'<h2>开始使用</h2><p>在仪表盘选择一键订阅，导入客户端。</p>'}:{'快速入门':[{id:1,title:'开始使用：导入订阅',category:'快速入门',updated_at:1789171200}]};break;
      case '/user/stat/getTrafficLog': data=[{record_at:1789171200,u:1073741824,d:3*1073741824,server_rate:1}];break;
      default: data=true;
    }
    await route.fulfill({json:{data}});
  });
}
export async function authenticate(page) {
  await page.addInitScript(() => localStorage.setItem('VUE_NAIVE_ACCESS_TOKEN',JSON.stringify({value:'preview-token',time:Date.now(),expire:null})));
}
