# Complete Prompt Template Schema

Always generate a complete prompt template for the episode. The viewer should be able to paste it into an AI coding assistant or ChatGPT-like tool.

## Template

# 角色
你是一名资深产品经理 + 前端工程师 + 用户体验设计师。

# 背景
我想解决的问题是：[从本期视频主题提取痛点]。
目标用户是：[目标用户]。
我希望用一个本地网页/工具来解决这个问题。

# 目标
请帮我生成一个可以直接在本地运行的网页工具，用来：[工具目标]。

# 功能要求
1. [核心功能1]
2. [核心功能2]
3. [核心功能3]
4. [保存/导入/导出/搜索/分类等数据能力]
5. [适合本期主题的额外功能]

# 内容/数据要求
- 如果需要示例数据，请内置一批高质量示例。
- 数据要能在浏览器本地保存，刷新后不丢失，优先使用 localStorage。
- 支持搜索、筛选、复制、编辑、删除。

# 页面设计要求
- 做成现代、干净、适合日常使用的工具界面。
- 不要做营销落地页，打开就是工具本身。
- 适配电脑和手机。
- 重点信息要易读，操作按钮要明确。

# 技术要求
- 优先生成一个单文件 HTML，包含 CSS 和 JavaScript。
- 不依赖后端服务。
- 如果必须依赖外部库，请说明原因。
- 代码结构清晰，关键逻辑加简短注释。

# 验收标准
- 我可以直接打开 HTML 使用。
- 可以新增、搜索、分类、编辑、删除内容。
- 页面刷新后数据仍然存在。
- 交互流畅，没有明显布局错位。

# 输出要求
请直接输出完整代码，并在最后给我 3 条后续可迭代优化建议。

## Generation Rules

- Replace bracketed fields with episode-specific details.
- Do not leave placeholders in the final complete_prompt_template.md.
- If the episode is not about building a webpage, adapt the sections to the relevant output type while preserving role/background/goal/requirements/acceptance criteria.
