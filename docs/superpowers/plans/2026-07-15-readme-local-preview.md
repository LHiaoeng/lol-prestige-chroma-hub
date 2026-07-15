# README Local Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document and verify the two supported ways to view the site locally.

**Architecture:** README will distinguish Astro's hot-reload development server from Wrangler's preview of the built `dist/` assets. Commands and addresses will match the current `package.json`; remote R2 image behavior will be stated explicitly.

**Tech Stack:** Markdown, pnpm 10, Astro 7, Wrangler 4.

---

### Task 1: Document and verify local preview

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Record the missing documentation behavior**

Run:

```powershell
rg -n "localhost:4321|pnpm preview|Wrangler.*dist" README.md
```

Expected: no matches, proving README does not yet explain how to open either local preview.

- [ ] **Step 2: Add the two preview workflows**

Add concise sections under “本地开发” with these commands and meanings:

````markdown
### 开发模式（推荐日常使用）

```bash
pnpm dev
```

浏览器打开 `http://localhost:4321`。Astro 会监听文件变化并自动刷新；端口占用时以终端输出的地址为准。

### 生产产物预览（发布前检查）

```bash
pnpm build
pnpm preview
```

`pnpm preview` 对应 `wrangler dev`，预览刚生成的 `dist/`，行为更接近 Cloudflare Workers Static Assets。浏览器地址以 Wrangler 的终端输出为准。
````

补充说明页面图片仍从 `https://img.chromaart.lol` 加载；断网或远程对象缺失时使用现有回退/占位图。

- [ ] **Step 3: Verify the Astro development server**

Run `pnpm.cmd dev --host 127.0.0.1` as a temporary background process, wait for readiness, request the printed local URL, assert HTTP 200 and homepage title, then terminate the process.

Expected: Astro reports a local URL (normally `http://127.0.0.1:4321/`) and the homepage responds successfully.

- [ ] **Step 4: Verify the Wrangler production preview**

Run:

```powershell
pnpm.cmd build
pnpm.cmd preview --host 127.0.0.1
```

Start preview temporarily, wait for Wrangler readiness, request its printed local URL, assert HTTP 200 and homepage title, then terminate it.

Expected: Wrangler serves the generated `dist/` static assets without runtime bindings.

- [ ] **Step 5: Verify documentation and commit**

Run:

```powershell
rg -n "localhost:4321|pnpm preview|wrangler dev|img.chromaart.lol" README.md
git diff --check
git status --short
```

Expected: all required instructions are present and the diff has no whitespace errors.

```powershell
git add README.md
git commit -m "docs: explain local preview workflows"
```

## Plan self-review

- Spec coverage: both preview modes, current scripts, addresses, remote images, and actual startup checks are covered.
- Placeholder scan: no deferred or ambiguous steps remain.
- Consistency: commands exactly match `package.json` scripts `dev`, `build`, and `preview`.
