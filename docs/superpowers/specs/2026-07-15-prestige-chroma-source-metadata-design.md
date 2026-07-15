# 臻彩原皮、套装与宇宙元数据设计

## 目标

扩展 `prestige-chromas.json` 契约，新增原皮 ID、皮肤套装对象数组和皮肤宇宙对象数组。管理系统负责生成完整对象，展示系统负责严格校验和消费；两个系统在同一次变更中升级契约。

## JSON 契约

每条臻彩记录新增：

```json
{
  "sourceSkinId": 887030,
  "skinSets": [
    {
      "id": 54,
      "nameZh": "女帝",
      "nameEn": "Battle Queens",
      "descriptionZh": "中文套装描述",
      "descriptionEn": "English skin set description"
    }
  ],
  "universes": [
    {
      "id": 8,
      "nameZh": "另一个符文之地",
      "nameEn": "Alternate Runeterra",
      "descriptionZh": "中文宇宙描述",
      "descriptionEn": "English universe description"
    }
  ]
}
```

字段规则：

- `sourceSkinId` 是正整数且必填。
- `skinSets` 和 `universes` 始终存在；没有关联项时输出空数组。
- 对象 `id` 使用 Riot 业务 ID：套装使用 `riotSkinlineId`，宇宙使用 `lolUniverseId`，不使用数据库主键。
- `nameZh`、`nameEn` 是去除首尾空白后的非空字符串。
- `descriptionZh`、`descriptionEn` 是去除首尾空白后的字符串或 `null`；空白描述规范化为 `null`。
- 同一记录的对象数组按 ID 升序输出并按 ID 去重，保证序列化稳定。

新增字段放在现有原皮名称字段之前，顺序为 `sourceSkinId`、`skinSets`、`universes`。

## 管理系统：生产端

项目：`D:\IdeaProjects\light-shadow-wallpaper-admin`。

`LolPrestigeChroma` 已保存 `sourceSkinId`、`sourceSkinSkinlineIdSet` 和 `sourceSkinUniverseIdSet`，不新增数据库字段。

`PrestigeChromaHubCatalogService` 在一次生成中：

1. 读取排序后的全部臻彩记录。
2. 批量读取 `lol_skinline` 和 `lol_universe`，分别按 Riot 业务 ID 建立映射，避免逐条查询。
3. 解析臻彩记录中的逗号分隔 ID 集合，去除空值和重复值并排序。
4. 将 ID 映射为包含中英文名称、描述的 JSON 对象。
5. 与现有字段一起执行校验并稳定序列化。

新增独立的关联对象模型，供 `skinSets` 和 `universes` 共用。若 `sourceSkinId` 缺失或非正整数、关联 ID 非法、关联记录不存在、业务 ID 重复或中英文名称缺失，生成失败并指出臻彩记录 ID 和错误字段。描述缺失不会导致失败。

直接写入和下载继续复用同一个生成服务，因此两个出口自动得到相同结构。接口路径、数据库表结构和管理前端交互不变。

## 展示系统：消费端

项目：`D:\WebstormProjects\lol-prestige-chroma-hub`。

`src/domain/chroma.ts` 新增关联对象 Schema，并将三个字段设为必填。Schema 验证正整数 ID、必填名称、可空描述、数组 ID 唯一和升序。`ChromaSource` 类型由 Schema 自动推导。

`scripts/import-data.ts` 保留新增字段，只继续规范化 `images`。现有目录数据从管理系统重新生成，禁止通过默认值兼容旧 JSON；旧契约应在验证阶段明确失败。

页面和 Worker 当前不要求展示这三类元数据，只需保证构建数据可读取。未来展示或筛选时直接使用已类型化字段。

同步更新 `docs/数据源与JSON结构.md` 的示例、字段表和跨系统修改点。

## 测试与验证

管理系统先写失败测试，再实现：

- 正常映射原皮 ID、套装和宇宙完整对象。
- 多个 ID 去重并按 ID 升序。
- 空 ID 集合输出空数组。
- 空白描述输出 `null`。
- 原皮 ID 非法、关联不存在、业务 ID 重复或名称缺失时生成失败。
- JSON 字段顺序和重复生成字节稳定。

展示系统先写失败测试，再实现：

- 新结构解析成功。
- 缺少三个新字段时失败。
- 非法原皮 ID、重复/乱序关联 ID、空名称和非法描述类型失败。
- 导入流程保留新增字段并生成既有 `images` 路径。

最终验证命令：

```powershell
# 管理系统
mvn -pl admin "-Dspring-javaformat.skip=true" "-Dtest=PrestigeChromaHubCatalogServiceTest" test
mvn spring-javaformat:apply
mvn -pl admin -DskipTests package

# 展示系统
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd data:validate
pnpm.cmd build
```

管理系统当前存在与本任务无关的未提交文件，实施时只修改本设计列出的相关 Java、测试和文档文件，不覆盖或提交用户现有改动。
