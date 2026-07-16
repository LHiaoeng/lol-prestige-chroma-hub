# 臻彩展示站数据源与 JSON 结构

本文只说明 `prestige-chromas.json` 的生成方式、数据结构，以及修改结构时两个系统需要同步调整的位置。

## 1. 生成方式

### 1.1 数据生产方

`prestige-chromas.json` 由臻彩皮肤管理系统生成：

```text
D:\IdeaProjects\light-shadow-wallpaper-admin
```

管理后台从 `lol_prestige_chroma` 对应的数据列表读取记录，按列表顺序完成字段映射、格式校验和唯一性校验，然后序列化为 UTF-8 JSON 数组。生成逻辑不会从当前展示站反向读取或补全业务字段。

### 1.2 推荐：直接写入展示站

在管理前端的“臻彩皮肤管理”页面中：

1. 点击“展示站数据”。
2. 选择“写入指定文件夹”。
3. 保持默认目录：

   ```text
   D:\WebstormProjects\lol-prestige-chroma-hub\data\
   ```

4. 点击“写入”。

后端调用：

```http
POST /lol/prestige-chroma/hub-json/write
Content-Type: application/json

{
  "directory": "D:\\WebstormProjects\\lol-prestige-chroma-hub\\data\\"
}
```

后端固定追加文件名 `prestige-chromas.json`，最终写入：

```text
D:\WebstormProjects\lol-prestige-chroma-hub\data\prestige-chromas.json
```

目标目录必须已存在、可写，并且只能是上述 `data` 目录或其子目录。目标文件已存在时会被完整覆盖。

### 1.3 备用：下载 JSON

在同一“展示站数据”菜单中选择“导出 JSON 文件”，管理前端会调用：

```http
GET /lol/prestige-chroma/hub-json/download
```

浏览器下载的文件名固定为 `prestige-chromas.json`。下载后手动替换展示站的：

```text
D:\WebstormProjects\lol-prestige-chroma-hub\data\prestige-chromas.json
```

直接写入和下载使用同一个生成服务，因此 JSON 内容和校验规则一致。

## 2. JSON 顶层结构

文件顶层是数组，每个元素表示一条臻彩记录：

```json
[
  {
    "id": 473,
    "skinId": 887034,
    "instanceId": "0dc7b925-be59-4904-ae5c-cad7502efbad",
    "nameZh": "女帝 格温 纹章之刻印·强运",
    "nameEn": "Battle Queen Gwen (Rose Quartz)",
    "heroId": "887",
    "heroNameZh": "灵罗娃娃 格温",
    "heroNameEn": "The Hallowed Seamstress Gwen",
    "sourceSkinId": 887030,
    "skinSets": [
      {
        "id": 137,
        "nameZh": "女帝无双",
        "nameEn": "Battle Queens",
        "descriptionZh": null,
        "descriptionEn": null
      }
    ],
    "universes": [
      {
        "id": 40,
        "nameZh": "女帝无双",
        "nameEn": "Battle Queens",
        "descriptionZh": "女帝无双宇宙中文描述",
        "descriptionEn": "Battle Queens universe description"
      }
    ],
    "skinNameZh": "女帝 格温",
    "skinNameEn": "Battle Queen Gwen",
    "categoryId": "2",
    "categoryName": "钻石臻彩",
    "tagId": "2",
    "gameVer": "26.13",
    "isNew": true,
    "rank": 450,
    "images": {
      "large": "assets/chromas/0dc7b925-be59-4904-ae5c-cad7502efbad/site3.jpg",
      "small": "assets/chromas/0dc7b925-be59-4904-ae5c-cad7502efbad/site4.jpg",
      "medium": "assets/chromas/0dc7b925-be59-4904-ae5c-cad7502efbad/site5.jpg",
      "tag": "assets/tags/x-2.png"
    }
  }
]
```

序列化格式固定为：UTF-8、两个空格缩进、LF 换行，并在文件末尾保留一个 LF。字段顺序固定为示例中的顺序。

## 3. 字段定义与映射

| JSON 字段 | 类型 | 管理系统来源 | 规则与用途 |
| --- | --- | --- | --- |
| `id` | number | `id` | 非负整数，管理系统记录主键 |
| `skinId` | number | `skinId` | 正整数；文件内唯一 |
| `instanceId` | string | `instanceId` | 非空安全标识；文件内唯一；只允许字母、数字、下划线和连字符 |
| `nameZh` | string | `itemName` | 非空，臻彩中文名称 |
| `nameEn` | string | `itemNameEng` | 非空，臻彩英文名称；参与详情页 slug 计算 |
| `descriptionZh` | string \| null | `description` | 臻彩中文描述；数据库为空或空白时输出 `null` |
| `descriptionEn` | string \| null | `descriptionEng` | 臻彩英文描述；数据库为空或空白时输出 `null` |
| `colors` | string[] | `colors` | 去重后的大写 HEX 颜色数组；数据库为空时输出空数组 |
| `heroId` | string | `heroId` | 管理系统中为正整数，生成时转换成字符串 |
| `heroNameZh` | string | `heroName` | 非空，英雄中文名称 |
| `heroNameEn` | string | `heroNameEng` | 非空，英雄英文名称；参与详情页 slug 计算 |
| `sourceSkinId` | number | `sourceSkinId` | 正整数，原皮肤业务 ID |
| `skinSets` | object[] | `sourceSkinSkinlineIdSet` + 皮肤套装表 | 按业务 ID 升序、去重；没有关联时输出空数组 |
| `universes` | object[] | `sourceSkinUniverseIdSet` + 皮肤宇宙表 | 按业务 ID 升序、去重；没有关联时输出空数组 |
| `skinNameZh` | string | `sourceSkinName` | 非空，原皮肤中文名称 |
| `skinNameEn` | string | `sourceSkinNameEng` | 非空，原皮肤英文名称 |
| `categoryId` | string | `categoryId` | 非空安全标识 |
| `categoryName` | string | `categoryName` | 非空，分类显示名称 |
| `tagId` | string | `tagId` | 非空安全标识，用于分类图标定位 |
| `gameVer` | string | `gameVer` | 去掉可选的 `Ver ` 前缀后必须匹配 `N.N`，例如 `26.13` |
| `isNew` | boolean | `isNew` | 管理系统只接受 `0` 或 `1`，生成时转换为布尔值 |
| `rank` | number | `rank` | 整数，用于列表排序 |
| `images` | object | 生成器计算 | 图片仓库相对路径，结构见下一节 |

展示站还会根据 `heroNameEn`、`nameEn` 和 `skinId` 计算 slug。生成管理系统和展示站使用相同规则，并校验文件内 slug 不重复；slug 本身不写入 JSON。

## 4. `skinSets` 与 `universes` 对象结构

两个数组使用相同的对象结构：

| 字段 | 类型 | 规则与来源 |
| --- | --- | --- |
| `id` | number | 正整数业务 ID；`skinSets` 使用皮肤套装表的 `riotSkinlineId`，`universes` 使用皮肤宇宙表的 `lolUniverseId` |
| `nameZh` | string | 对应数据库记录的中文名称，必填且非空 |
| `nameEn` | string | 对应数据库记录的英文名称，必填且非空 |
| `descriptionZh` | string \| null | 对应数据库记录的中文描述；数据库为空或空白时固定输出 JSON `null` |
| `descriptionEn` | string \| null | 对应数据库记录的英文描述；数据库为空或空白时固定输出 JSON `null` |

生成器会先解析臻彩记录保存的关联 ID，再批量从对应数据库表补全名称和描述。关联 ID 在对应表中不存在、业务 ID 重复、名称缺失时停止生成，不使用展示站默认值补全。

## 5. `images` 结构

| 字段 | 类型 | 固定路径规则 |
| --- | --- | --- |
| `large` | string | `assets/chromas/{instanceId}/site3.jpg` |
| `small` | string | `assets/chromas/{instanceId}/site4.jpg` |
| `medium` | string | `assets/chromas/{instanceId}/site5.jpg` |
| `tag` | string | `assets/tags/{tagImgUrl 中的实际安全 PNG 文件名}` |

前三个路径只由 `instanceId` 计算。`tag` 路径保留管理记录 `tagImgUrl` 中的实际 PNG 文件名，例如源地址以 `x-2.png` 结尾时输出 `assets/tags/x-2.png`，与管理后端同步到 R2 的对象键 `tags/x-2.png` 一致。`tagImgUrl` 缺失时，生成器按 `x-{tagId}.png` 计算源文件名。文件名必须是安全 PNG 文件名；所有路径必须是安全的仓库相对路径，不能包含反斜杠、`..`、盘符或以 `/` 开头。

## 6. 修改 JSON 结构时的同步位置

JSON 是两个系统之间的契约。新增、删除、改名或改变字段类型时，应在同一次结构变更中同步更新以下位置。

本次新增的 `descriptionZh`、`descriptionEn`、`colors` 由管理系统同步 CommunityDragon 数据后入库；管理前端可人工编辑，Hub 生成器负责把空白描述规范化为 `null`，并把数据库中的颜色 JSON 转换为数组。

### 6.1 管理系统：JSON 生产方

项目：

```text
D:\IdeaProjects\light-shadow-wallpaper-admin
```

主要修改点：

| 文件 | 作用 |
| --- | --- |
| `admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubItem.java` | 顶层记录字段、Java 类型和 JSON 字段顺序 |
| `admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubImagePaths.java` | `images` 字段结构和顺序 |
| `admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubRelation.java` | 皮肤套装、皮肤宇宙的中英文名称与描述结构 |
| `admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogService.java` | 数据库字段映射、格式转换、唯一性与必填校验 |
| `admin/src/test/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogServiceTest.java` | 字段映射、序列化稳定性和非法数据测试 |

如果生成接口或写入参数也发生变化，再同步修改 `LolPrestigeChromaAdminController`；单纯调整 JSON 字段时无需修改接口路径。

### 6.2 展示系统：JSON 消费方

项目：

```text
D:\WebstormProjects\lol-prestige-chroma-hub
```

主要修改点：

| 文件 | 作用 |
| --- | --- |
| `src/domain/chroma.ts` | Zod Schema、TypeScript 类型、路径约束、唯一性与 slug 校验 |
| `src/data/catalog.ts` | 构建时直接加载并校验 `data/prestige-chromas.json` |
| `scripts/validate-data.ts`、`src/domain/chroma.test.ts` | 发布前数据契约与结构校验 |
| `scripts/import-data.ts`、`scripts/import-data.test.ts` | 可选的外部 JSON 规范化工具；只有导入器仍需兼容新结构时才同步修改 |
| 使用具体字段的 `src/components/`、`src/pages/` | 字段改名、删除或语义变化时同步修改消费代码 |

管理后台已经输出最终契约时，正常更新方式是直接完整覆盖 `data/prestige-chromas.json`，不需要运行导入器，也不需要在本地保存 `images` 所指向的图片文件。`pnpm data:validate` 与 `pnpm release:build` 会在构建时校验 JSON；推送 `main` 后 Cloudflare Workers Builds 自动重新构建和部署。图片由管理后台维护在 `img.chromaart.lol` 对应的 R2 Bucket 中。

### 6.3 推荐修改顺序

1. 先确定新 JSON 示例和兼容策略。
2. 同步修改管理系统的数据模型、映射和测试。
3. 同步修改展示系统的 Schema、类型、消费代码和测试。
4. 从管理系统重新生成 `data/prestige-chromas.json`。
5. 在展示系统执行 `pnpm data:validate` 和 `pnpm release:build`，确认新契约可被读取且发布产物安全。
6. 提交 JSON 并推送到 `main`，等待 Workers Builds 完成重新部署。

不要只手工修改生成后的 JSON 来引入长期字段；否则下次从管理系统生成时，手工字段会被覆盖。
