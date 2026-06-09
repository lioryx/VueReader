# 静读 · JingDu

一款基于 Vue 3 + PWA 的轻量级 TXT 小说阅读器，专为移动端离线阅读场景打造。

受 [Legado（阅读）](https://github.com/gedoor/legado) 启发，但聚焦于"把本地 TXT 读得舒服"这一件事，追求极简、流畅、可离线的纯粹阅读体验。

🔗 **在线体验**：[https://lioryx.github.io/VueReader/](https://lioryx.github.io/VueReader/)

## ✨ 特性

- 📚 **本地导入** — 支持 TXT 文件拖拽/选择导入，自动识别 UTF-8 / GBK / GB18030 编码
- 🔖 **智能分章** — 自动识别"第X章""序章""楔子"等常见章节格式
- 🎨 **个性化阅读** — 字号、行距、字体、背景主题、夜间模式自由调节
- 📱 **PWA 离线** — 可安装到手机桌面，断网也能读，体验接近原生 App
- 💾 **本地存储** — 基于 IndexedDB，数据完全本地化，隐私无忧
- 👆 **手势操作** — 左右滑动翻页、点击分区控制、支持滚动和分页两种模式
- 📑 **书签与进度** — 自动记忆阅读进度，支持多书签与目录跳转
- 🔊 **TTS 朗读** — 基于浏览器 Web Speech API，支持后台朗读
- 🌙 **护眼常亮** — 屏幕常亮锁定（Wake Lock API），多种护眼主题
- 🔍 **全文搜索** — 快速搜索书中内容
- 📝 **笔记批注** — 支持添加阅读笔记
- ⏱️ **阅读统计** — 记录阅读时长，了解阅读习惯
- 🎯 **E-ink 模式** — 针对电子墨水屏优化，去除动画和阴影
- ⌨️ **键盘导航** — 支持方向键翻页、空格键翻页、Esc 返回

## 🛠️ 技术栈

| 分类 | 选型 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 8 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 5 |
| 样式 | Tailwind CSS 4 |
| 本地存储 | Dexie.js (IndexedDB) |
| PWA | vite-plugin-pwa (Workbox) |
| 工具库 | @vueuse/core |
| Lint | ESLint + OxLint |
| 格式化 | oxfmt |

## 📂 项目结构

```
src/
├── views/                    # 页面级组件
│   ├── BookshelfView.vue     # 书架主页
│   ├── BookDetailView.vue    # 书籍详情
│   ├── ReaderView.vue        # 阅读器（核心）
│   ├── ReaderCatalogView.vue # 目录页
│   ├── SettingsView.vue      # 设置主页
│   └── settings/             # 设置子页面
│       ├── ThemeSettingsView.vue
│       ├── ThemeModeSettingsView.vue
│       ├── BackupSettingsView.vue
│       ├── BookmarksSettingsView.vue
│       ├── ReadingRecordsSettingsView.vue
│       ├── FileManagementSettingsView.vue
│       ├── RuleSettingsView.vue
│       ├── OtherSettingsView.vue
│       └── AboutSettingsView.vue
├── components/               # 通用组件
│   ├── BookCard.vue          # 书籍卡片
│   ├── BookshelfBookList.vue # 书架列表
│   ├── ChapterDrawer.vue     # 目录抽屉
│   ├── SearchDrawer.vue      # 搜索抽屉
│   ├── BookmarkDrawer.vue    # 书签抽屉
│   ├── ReaderTopBar.vue      # 阅读器顶部栏
│   ├── ReaderBottomBar.vue   # 阅读器底部栏
│   ├── ReaderSettingsPanel.vue # 阅读设置面板
│   └── BottomTabBar.vue      # 底部导航栏
├── stores/                   # Pinia 状态管理
│   ├── useBookStore.ts       # 书籍状态
│   ├── useReaderStore.ts     # 阅读器状态
│   └── useSettingsStore.ts   # 设置状态（主题、字体等）
├── db/                       # 数据层
│   └── index.ts              # Dexie 实例与表定义
├── utils/                    # 工具函数
│   ├── encoding.ts           # 编码识别
│   ├── chapterParser.ts      # 章节切分
│   └── pagination.ts         # 分页计算
├── workers/                  # Web Worker
│   └── parser.worker.ts      # 文件解析 Worker
└── router/                   # 路由配置
    └── index.ts
```

## 🗄️ 数据模型

使用 IndexedDB 存储，表结构如下：

- **books** — 书籍元数据（书名、作者、大小、编码、导入时间等）
- **contents** — 书籍正文（与元数据分表，优化书架加载速度）
- **chapters** — 章节索引（标题 + 偏移量，按需取正文片段）
- **progress** — 阅读进度（章节索引 + 字符偏移 + 百分比 + 阅读时长）
- **bookmarks** — 书签（位置 + 备注 + 创建时间）
- **settings** — 全局设置（主题、字体、手势配置等）

## 🚀 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- pnpm（推荐）

### 安装与运行

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建（包含类型检查）
pnpm build

# 预览构建产物
pnpm preview

# 仅类型检查
pnpm type-check

# 代码检查并修复
pnpm lint

# 代码格式化
pnpm format
```

开发模式下 PWA 功能默认关闭，需通过 `pnpm build && pnpm preview` 测试离线能力。

## 📱 浏览器支持

- Chrome / Edge 90+
- Safari 14+（iOS 14+）
- Firefox 90+
- 移动端：Android Chrome、iOS Safari

## ⚠️ 已知限制

- **iOS Safari 存储风险** — iOS 的 IndexedDB 在长期不访问或清理数据时可能被回收，建议定期使用"导出备份"功能
- **后台朗读限制** — 浏览器切换标签页后 TTS 可能被暂停，非 App 能完全替代
- **大文件性能** — 超过 50 MB 的 TXT 在低端安卓机上首次解析可能需要几秒钟
- **字体限制** — 为控制体积，默认使用系统字体栈，不内置自定义中文字体

## 🗺️ 开发规划

### 已完成 ✅

- [x] 项目脚手架搭建（Vite + Vue 3 + TS + Tailwind CSS）
- [x] PWA 基础配置（manifest + Service Worker）
- [x] Dexie 数据库初始化与表结构定义
- [x] 书架页面 UI（拖拽导入、排序、安装引导）
- [x] TXT 文件导入（文件选择 + 拖拽）
- [x] 编码自动识别（UTF-8 / GBK / GB18030）
- [x] 章节自动切分（正则匹配常见格式）
- [x] 大文件分片读取 + Web Worker 解析
- [x] 阅读器页面（滚动模式 + 分页模式）
- [x] 章节切换与内容渲染
- [x] 阅读进度自动保存与恢复
- [x] 字号 / 行距 / 字体调节
- [x] 主题切换（日间 / 夜间 / 护眼绿 / 自定义主题）
- [x] 设置页面（主题、备份、书签、阅读记录、文件管理等）
- [x] 书架增删改与排序
- [x] 触摸手势（滑动翻页 + 分区点击）
- [x] 目录抽屉组件（章节跳转）
- [x] 书签添加与管理
- [x] 屏幕常亮（Wake Lock API）
- [x] 数据导入导出（JSON 备份）
- [x] PWA 安装引导
- [x] 分页模式（按视口分页 + 翻页动画）
- [x] TTS 朗读（Web Speech API）
- [x] 全文搜索
- [x] 笔记与批注
- [x] 阅读时长统计
- [x] E-ink 模式优化
- [x] 键盘导航支持

### 未来版本

- 📖 EPUB 支持（基于 epub.js）
- 🌐 书源系统（需配合后端代理或桌面端）
- ☁️ WebDAV 同步
- 🖥️ Tauri 桌面版

## 📄 License

MIT

## 🙏 致谢

- [Legado](https://github.com/gedoor/legado) — 灵感来源
- [Vue.js](https://vuejs.org/) / [Vite](https://vitejs.dev/) / [Dexie.js](https://dexie.org/) — 基石工具
- [Tailwind CSS](https://tailwindcss.com/) — CSS 框架
