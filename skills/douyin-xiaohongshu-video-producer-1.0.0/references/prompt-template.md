# Complete Prompt Template Schema

Always generate `complete_prompt_template.md`. It should let viewers reproduce the showcased tool or workflow in an AI coding assistant.

## Required Sections

Use these sections unless the episode clearly needs a different artifact type:

# 角色

Describe the assistant role needed for the episode, such as product manager, frontend engineer, UX designer, data analyst, automation expert, or domain specialist.

# 背景

Extract the real pain point from the recording and topic. Name the target user and usage situation.

# 目标

State what the AI should build or generate, and what problem it solves.

# 功能要求

List concrete features visible or implied in the episode. Include interactions, core modules, data flow, saving/exporting, and any AI summary behavior.

# 内容/数据要求

Specify sample data, fields, local storage, import/export, search, filters, sorting, and domain-specific constraints.

# 页面设计要求

Describe the actual product UI style the viewer should build. For app/tool episodes, prefer useful working interfaces over marketing pages.

# 技术要求

Specify whether to use single-file HTML, React, localStorage, APIs, mock data, or no backend. Keep the requirements runnable for a viewer.

# 验收标准

Turn the video’s promise into testable checks.

# 输出要求

Ask for complete usable output, not a vague plan.

## Rules

- Do not leave placeholders in the final file.
- Make the prompt episode-specific.
- For sensitive domains, add clear safety boundaries. For finance, require mock data or public data only and include “不构成投资建议”.
- If the episode is not about building software, adapt the sections while preserving role, background, goal, requirements, acceptance criteria, and output format.
