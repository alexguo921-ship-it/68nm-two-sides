# 68海里 · 两面

> A Cross-Strait Cultural Translation Project · 基于方言连续体的数字人文文旅产品方案

2026 复旦大学青春文旅设计大赛 · 决赛参赛作品  
作者：郭嘉 · 复旦大学外国语言文学学院 · 翻译硕士 MTI · 25210120088

---

## 在线预览

部署后，访问 Netlify 提供的地址即可（如 `https://<your-site>.netlify.app`）。

## 项目结构

```
.
├── index.html            产品官网首页（含 CN/EN/TC 三语切换）
├── ppt.html              24 页答辩 deck
├── ppt.pptx              答辩 deck 的 PowerPoint 备用版本
├── video.html            60 秒产品介绍片
├── wxapp.html            小程序原型（精简版）
├── wxapp_demo.html       小程序原型（完整版）
├── demo_translator.html  AI 方言翻译器演示
├── demo_vlm.html         VLM 场景智能解读演示
├── demo_dashboard.html   运营画像与分润大屏演示
├── 操作演示.html         90 秒分镜动画引导
├── 评委组打开说明.html   评委入口页
├── 评委组打开说明.docx   评委入口页（Word 备用）
├── netlify.toml          Netlify 部署配置
└── assets/               图片、JS、CSS、字典
```

## 本地运行

```bash
# 克隆后进入目录
cd 68haili_demo

# 启动本地静态服务（任选其一）
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

## 部署

本项目已配置 `netlify.toml`，无需构建步骤。在 Netlify 选择"从 Git 导入"
连接本仓库即可一键部署，Publish directory 保持默认 `.`。

每次本地 `git push` 到 `main` 分支，Netlify 会自动触发部署。

## License

仅供 2026 复旦大学青春文旅设计大赛 · 决赛展示用途。  
商业落地版本将完成商标 / 专利注册后正式发布。
