# HeroRui 验证记录

本地环境：Windows、Node.js 24、Chrome Headless、Vite 生产构建。

## 已完成

- 32 项主流程浏览器检查全部通过：认证兼容、公告、订阅复制及协议过滤、套餐分类、周期与优惠券、旧订单取消、订单保存、支付手续费、二维码结算、轮询、零元订单、节点过滤、流量倍率换算、知识库、工单、密码、订阅重置、通知、邀请、佣金、移动布局、深浅色、多语言、错误重试、空账户和登录失效。
- 6 项集成契约检查全部通过：Turnstile、reCAPTCHA v2、reCAPTCHA v3、Telegram 登录回调、Stripe 卡 token，以及收银台跳转。第三方 SDK 和支付均使用模拟响应，没有进行真实付款。
- 桌面与 390px 手机端截图检查。十个业务路由无页面级横向溢出；数据表格保留内部横向滚动。
- 生产构建通过；主流程未捕获浏览器 JavaScript 异常。
- ZIP CRC 校验及全部文件 SHA-256 与 manifest 一致。config.json 主题名为 HeroRui，根目录有 dashboard.blade.php，Blade 引用的所有静态文件均在包内。
- ZIP 中没有原版 umi.js、模拟数据、开发依赖和测试代码。
- 原版 theme/Xboard/assets/umi.js SHA-256 保持为 `69ff1e68dd44b84f803e631367b6fc9dfd52e79d049067fa52cfa859031f20dc`。

## 验证范围

浏览器测试拦截 API，按当前仓库 PHP 控制器及资源结构提供响应，并检查实际点击产生的请求。没有 PHP / Laravel 运行环境，没有真实站点凭据，因此后台上传、邮件送达、第三方验证码的真实挑战、真实客户端唤起及真实支付到账尚未进行线上联调。

原版支持的主要语言字典已迁移；新增的少量提示在缺少译文时回退到中文。

## 复现

在本仓库根目录执行：

```sh
npm ci
npx playwright install chromium
npm test
node tests/preview.mjs
```

测试 JSON 和页面截图输出到 dist/HeroRui-preview。安装包输出到 dist/HeroRui.zip。
