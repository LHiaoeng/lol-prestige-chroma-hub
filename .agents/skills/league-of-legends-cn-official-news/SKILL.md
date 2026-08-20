---
name: league-of-legends-cn-official-news
description: 获取并整理腾讯《英雄联盟》国服官网新闻详情。用于用户提供 lol.qq.com 的官方新闻链接或 docid，并需要标题、发布时间、正文和图片等内容时。
---

# 《英雄联盟》国服官网新闻内容获取

从腾讯《英雄联盟》国服官网 `lol.qq.com` 的社区新闻详情页获取文章内容，并以可核验的结构化结果交付。

## 获取方式

- 接受 `https://lol.qq.com/news/detail.shtml?docid=...` 链接或单独的 `docid`。
- 优先运行 [scripts/fetch_news.py](scripts/fetch_news.py)。详情页本身只提供空的文章容器，实际文章由其公开内容接口异步加载。
- 脚本请求 `https://apps.game.qq.com/cmc/zmMcnContentInfo`，并解析 JSONP 响应；不要从页面的空 `#article` 元素误判为文章无正文。
- 输出中保留原始 `content_html`，并另给出清理后的 `content_text`。不要擅自改写正文、丢弃图片或把 HTML 实体当作纯文本内容。

## 交付与核验

- 至少交付：来源链接、docid、标题、发布时间、作者、正文和正文图片 URL；没有的字段应明确为 `null` 或空列表。
- 说明内容获取时间；官网文章可能会更新，阅读量、点赞等易变字段仅在用户明确需要时返回。
- 请求失败、响应不是成功状态、或缺少 `data.result` 时明确报错，不要用搜索摘要、缓存片段或猜测填充文章。
- 仅处理公开内容；不执行登录、点赞、评论或其他有副作用的网页操作。
