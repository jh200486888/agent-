# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # 后端 API 路由
│   │   │   ├── chat/       # 流式对话接口
│   │   │   ├── conversations/  # 对话管理
│   │   │   ├── models/     # 模型配置
│   │   │   └── admin/keys/ # API Key 管理
│   │   ├── admin/          # 后台管理页面
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 主对话页面
│   │   └── globals.css     # 全局样式
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── chat/           # 对话相关组件
│   │   │   ├── markdown-renderer.tsx  # Markdown 渲染
│   │   │   ├── message-bubble.tsx     # 消息气泡
│   │   │   ├── chat-input.tsx         # 聊天输入框
│   │   │   └── model-selector.tsx     # 模型选择器
│   │   ├── sidebar/        # 侧边栏组件
│   │   └── theme-provider.tsx  # 主题 Provider
│   ├── lib/                # 工具库
│   │   ├── types.ts        # 类型定义
│   │   ├── db.ts           # 数据库操作 (Supabase)
│   │   ├── llm.ts          # LLM 流式调用
│   │   └── utils.ts        # 通用工具函数
│   └── storage/database/   # Supabase 客户端
│       └── supabase-client.ts
├── DESIGN.md               # 设计规范
├── AGENTS.md               # 项目说明
└── tsconfig.json
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器。

## 核心功能

1. **多模型 AI 对话** - 通过 coze-coding-dev-sdk 调用 LLM，支持流式输出
2. **对话管理** - Supabase 存储对话和消息
3. **后台管理** - API Key 管理、模型配置、对话记录查看
4. **主题切换** - 深色/浅色/跟随系统

## API 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| /api/chat | POST | 流式对话（SSE） |
| /api/conversations | GET/POST | 对话列表/创建 |
| /api/conversations/[id] | GET/PATCH/DELETE | 单个对话操作 |
| /api/models | GET/POST/DELETE | 模型配置管理 |
| /api/admin/keys | GET/POST/DELETE | API Key 管理 |

## 开发规范

- 默认按 TypeScript strict 模式编写
- 使用 shadcn/ui 组件风格
- 深色主题为默认主题
- 所有数据库操作通过 src/lib/db.ts
