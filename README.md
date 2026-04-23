# 静读 · JingDu

一款基于 Vue 3 + PWA 的轻量级 TXT 小说阅读器，专为移动端离线阅读场景打造。

受 [Legado（阅读）](https://github.com/gedoor/legado) 启发，但聚焦于"把本地 TXT 读得舒服"这一件事，追求极简、流畅、可离线的纯粹阅读体验。

## ✨ 特性

- 📚 **本地导入** — 支持 TXT 文件拖拽/选择导入，自动识别 UTF-8 / GBK / GB18030 编码
- 🔖 **智能分章** — 自动识别"第X章""序章""楔子"等常见章节格式
- 🎨 **个性化阅读** — 字号、行距、字体、背景主题、夜间模式自由调节
- 📱 **PWA 离线** — 可安装到手机桌面，断网也能读，体验接近原生 App
- 💾 **本地存储** — 基于 IndexedDB，数据完全本地化，隐私无忧
- 👆 **手势操作** — 左右滑动翻页、点击分区控制、支持滚动和分页两种模式
- 📑 **书签与进度** — 自动记忆阅读进度，支持多书签与目录跳转
- 🔊 **朗读功能** — 基于浏览器 TTS，支持后台朗读（规划中）
- 🌙 **护眼常亮** — 屏幕常亮锁定，多种护眼主题

## 🛠️ 技术栈

| 分类 | 选型 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 样式 | Konsta UI + Tailwind CSS |
| 本地存储 | Dexie.js (IndexedDB) |
| PWA | vite-plugin-pwa (Workbox) |
| 工具库 | @vueuse/core |

## 📂 项目结构

```
src/
├── views/           # 页面级组件
│   ├── BookshelfView.vue    # 书架
│   ├── ReaderView.vue       # 阅读器
│   └── SettingsView.vue     # 设置
├── components/      # 通用组件
│   ├── BookCard.vue
│   ├── ReaderToolbar.vue
│   ├── ChapterDrawer.vue
│   └── ThemePanel.vue
├── stores/          # Pinia 状态
│   ├── useBookStore.ts
│   ├── useReaderStore.ts
│   └── useSettingsStore.ts
├── db/              # 数据层
│   ├── index.ts            # Dexie 实例
│   └── repositories/       # 各表操作
├── utils/           # 工具函数
│   ├── encoding.ts         # 编码识别
│   ├── chapterParser.ts    # 章节切分
│   └── pagination.ts       # 分页计算
├── composables/     # 组合式函数
│   ├── useReader.ts
│   ├── useGesture.ts
│   └── useTheme.ts
└── pwa/             # PWA 资源
    ├── manifest.ts
    └── icons/
```

## 🗄️ 数据模型

使用 IndexedDB 存储，表结构如下：

- **books** — 书籍元数据（书名、作者、大小、编码、导入时间等）
- **contents** — 书籍正文（与元数据分表，优化书架加载速度）
- **chapters** — 章节索引（标题 + 偏移量，按需取正文片段）
- **progress** — 阅读进度（章节索引 + 字符偏移 + 百分比）
- **bookmarks** — 书签（位置 + 备注 + 创建时间）
- **settings** — 全局设置（主题、字体、手势配置等）

## 🗺️ 开发规划

### 第一阶段：核心功能

**目标：** 能把书导进来，能看见章节。

- [ ] 项目脚手架搭建（Vite + Vue 3 + TS + UnoCSS）
- [ ] PWA 基础配置（manifest + Service Worker）
- [ ] Dexie 数据库初始化与表结构定义
- [ ] 书架页面 UI
- [ ] TXT 文件导入（文件选择 + 拖拽）
- [ ] 编码自动识别（UTF-8 / GBK / GB18030）
- [ ] 章节自动切分（正则匹配常见格式）
- [ ] 大文件分片读取 + Web Worker 解析

### 第二阶段：阅读体验

**目标：** 核心阅读闭环跑通。

- [ ] 阅读器页面（滚动模式优先）
- [ ] 章节切换与内容渲染
- [ ] 阅读进度自动保存与恢复
- [ ] 字号 / 行距 / 字体调节
- [ ] 主题切换（日间 / 夜间 / 护眼黄）
- [ ] 设置页面
- [ ] 书架增删改与排序

### 第三阶段：交互打磨

**目标：** 移动端体验打磨到位。

- [ ] 触摸手势（滑动翻页 + 分区点击）
- [ ] 目录抽屉组件（章节跳转）
- [ ] 书签添加与管理
- [ ] 屏幕常亮（Wake Lock API）
- [ ] 数据导入导出（JSON 备份）
- [ ] PWA 安装引导
- [ ] iOS Safari 兼容性测试

### 第四阶段：进阶功能

**目标：** 向精品阅读器靠拢。

- [ ] 分页模式（按视口分页 + 翻页动画）
- [ ] TTS 朗读（Web Speech API）
- [ ] 全文搜索
- [ ] 笔记与批注
- [ ] 阅读时长统计
- [ ] 性能优化（长文本渲染、低端机适配）

### 未来版本

- 📖 EPUB 支持（基于 epub.js）
- 🌐 书源系统（需配合后端代理或桌面端）
- ☁️ WebDAV 同步
- 🖥️ Tauri 桌面版

## ⚠️ 已知限制

- **iOS Safari 存储风险** — iOS 的 IndexedDB 在长期不访问或清理数据时可能被回收，建议定期使用"导出备份"功能
- **后台朗读限制** — 浏览器切换标签页后 TTS 可能被暂停，非 App 能完全替代
- **大文件性能** — 超过 50 MB 的 TXT 在低端安卓机上首次解析可能需要几秒钟
- **字体限制** — 为控制体积，默认使用系统字体栈，不内置自定义中文字体

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

开发模式下 PWA 功能默认关闭，需通过 `pnpm build && pnpm preview` 测试离线能力。

## 📱 浏览器支持

- Chrome / Edge 90+
- Safari 14+（iOS 14+）
- Firefox 90+
- 移动端：Android Chrome、iOS Safari

## 📄 License

MIT

## 🙏 致谢

- [Legado](https://github.com/gedoor/legado) — 灵感来源
- [Vue.js](https://vuejs.org/) / [Vite](https://vitejs.dev/) / [Dexie.js](https://dexie.org/) — 基石工具
