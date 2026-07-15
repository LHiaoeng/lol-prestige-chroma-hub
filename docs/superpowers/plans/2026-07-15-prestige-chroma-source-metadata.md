# Prestige Chroma Source Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `sourceSkinId`, localized skin-set objects, and localized universe objects to the generated prestige chroma JSON and validate the same contract in the Hub.

**Architecture:** The management backend remains the source of truth. It bulk-loads prestige rows, `lol_skinline`, and `lol_universe`, maps stored association ID sets to stable localized objects, and emits one strict JSON contract; the Hub rejects the legacy contract and consumes the new fields through Zod-derived types. Missing localized metadata is resolved from the corresponding management database tables, never synthesized in the Hub.

**Tech Stack:** Java 8, Spring Boot, MyBatis-Plus, Jackson, JUnit 5, Mockito, TypeScript 6, Zod 4, Vitest 4, Astro 7.

---

### Task 1: Lock the producer contract with failing tests

**Files:**
- Modify: `D:/IdeaProjects/light-shadow-wallpaper-admin/admin/src/test/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogServiceTest.java`

- [ ] **Step 1: Add mapper fixtures and expected metadata**

Mock `SkinlineMapper` and `UniverseMapper`, pass them to `PrestigeChromaHubCatalogService`, and add helpers that create database rows with Riot IDs, localized names, and descriptions. Extend `validRow()` with:

```java
row.setSourceSkinId(1001L);
row.setSourceSkinSkinlineIdSet("20,10,20");
row.setSourceSkinUniverseIdSet("8");
```

Stub bulk database lookup:

```java
when(skinlineMapper.selectList(null)).thenReturn(Arrays.asList(
        skinline(10L, "星之守护者", "Star Guardian", "中文描述", "English description"),
        skinline(20L, "睡衣守护者", "Pajama Guardian", null, " ")));
when(universeMapper.selectList(null)).thenReturn(Collections.singletonList(
        universe(8L, "星之守护者", "Star Guardian", "宇宙描述", "Universe description")));
```

- [ ] **Step 2: Assert the new successful contract**

In `mapsEveryHubFieldAndProducesStableUtf8Json()`, assert:

```java
assertEquals(1001L, item.getSourceSkinId());
assertEquals(Arrays.asList(10L, 20L), item.getSkinSets().stream()
        .map(PrestigeChromaHubRelation::getId).collect(Collectors.toList()));
assertEquals("Star Guardian", item.getSkinSets().get(0).getNameEn());
assertNull(item.getSkinSets().get(1).getDescriptionZh());
assertNull(item.getSkinSets().get(1).getDescriptionEn());
assertEquals(8L, item.getUniverses().get(0).getId());
assertTrue(json.indexOf("\"sourceSkinId\"") < json.indexOf("\"skinNameZh\""));
```

- [ ] **Step 3: Add producer validation tests**

Add focused tests for empty association strings producing empty arrays, missing source skin IDs, malformed association IDs, unresolved database IDs, duplicate Riot IDs in lookup rows, and blank localized names. Each failure must contain the prestige record ID and the failing field name.

- [ ] **Step 4: Run the focused test and verify RED**

Run:

```powershell
cd D:\IdeaProjects\light-shadow-wallpaper-admin
mvn -pl admin "-Dspring-javaformat.skip=true" "-Dtest=PrestigeChromaHubCatalogServiceTest" test
```

Expected: compilation fails because `PrestigeChromaHubRelation`, new item getters, and the expanded service constructor do not exist.

### Task 2: Implement management-side lookup and serialization

**Files:**
- Create: `D:/IdeaProjects/light-shadow-wallpaper-admin/admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubRelation.java`
- Modify: `D:/IdeaProjects/light-shadow-wallpaper-admin/admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubItem.java`
- Modify: `D:/IdeaProjects/light-shadow-wallpaper-admin/admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogService.java`
- Test: `D:/IdeaProjects/light-shadow-wallpaper-admin/admin/src/test/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogServiceTest.java`

- [ ] **Step 1: Add the shared relation model**

Create an immutable Jackson model:

```java
@JsonPropertyOrder({ "id", "nameZh", "nameEn", "descriptionZh", "descriptionEn" })
public final class PrestigeChromaHubRelation {
    private final long id;
    private final String nameZh;
    private final String nameEn;
    private final String descriptionZh;
    private final String descriptionEn;
    // constructor and getters
}
```

- [ ] **Step 2: Extend the top-level Hub item**

Add fields and getters to `PrestigeChromaHubItem`:

```java
private final long sourceSkinId;
private final List<PrestigeChromaHubRelation> skinSets;
private final List<PrestigeChromaHubRelation> universes;
```

Update `@JsonPropertyOrder` so these fields appear after `heroNameEn` and before `skinNameZh`. Defensively copy and expose unmodifiable lists in the constructor.

- [ ] **Step 3: Bulk-load lookup tables once per generation**

Inject `SkinlineMapper` and `UniverseMapper`. In `generate()`, call `selectList(null)` once for each mapper and build maps keyed by `riotSkinlineId` and `lolUniverseId`. Reject null/non-positive or duplicate business IDs with `PrestigeChromaHubValidationException`.

- [ ] **Step 4: Parse association IDs and resolve database metadata**

Add a helper that treats null/blank sets as empty, otherwise splits on comma, trims, parses positive longs, deduplicates, and sorts ascending. Resolve every ID from the lookup map. Use existing `requireText` semantics for names and a new nullable normalizer:

```java
private static String optionalText(String value) {
    return value == null || value.trim().isEmpty() ? null : value.trim();
}
```

Build `PrestigeChromaHubRelation` objects from database `name`, `engName`, `description`, and `engDescription`. Do not default missing names or descriptions from JSON or hardcoded values.

- [ ] **Step 5: Run the producer test and verify GREEN**

Run the focused Maven command from Task 1. Expected: all `PrestigeChromaHubCatalogServiceTest` tests pass.

- [ ] **Step 6: Format and commit only producer files**

Run:

```powershell
mvn spring-javaformat:apply
git add admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubRelation.java `
        admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/model/PrestigeChromaHubItem.java `
        admin/src/main/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogService.java `
        admin/src/test/java/com/breadj/lightshadowwallpaper/admin/lol/prestige/hub/PrestigeChromaHubCatalogServiceTest.java
git commit -m ":new: feat(lol): 扩展臻彩来源元数据"
```

Do not stage `application-dev.yml`, logs, or unrelated existing docs.

### Task 3: Lock and implement the Hub consumer contract

**Files:**
- Modify: `D:/WebstormProjects/lol-prestige-chroma-hub/src/domain/chroma.test.ts`
- Modify: `D:/WebstormProjects/lol-prestige-chroma-hub/src/domain/chroma.ts`
- Modify: `D:/WebstormProjects/lol-prestige-chroma-hub/scripts/import-data.test.ts`

- [ ] **Step 1: Add new fields to test fixtures**

Use this fixture shape in both test files:

```ts
sourceSkinId: 1001,
skinSets: [{
  id: 10,
  nameZh: '星之守护者',
  nameEn: 'Star Guardian',
  descriptionZh: '中文描述',
  descriptionEn: null,
}],
universes: [{
  id: 8,
  nameZh: '星之守护者',
  nameEn: 'Star Guardian',
  descriptionZh: null,
  descriptionEn: 'Universe description',
}],
```

- [ ] **Step 2: Add failing validation and import assertions**

Assert that parsing rejects a missing `sourceSkinId`, non-positive relation IDs, duplicate or descending relation IDs, blank names, and non-string/non-null descriptions. Assert that `importData()` preserves `sourceSkinId`, `skinSets`, and `universes` in the normalized output.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```powershell
pnpm.cmd vitest run src/domain/chroma.test.ts scripts/import-data.test.ts
```

Expected: new rejection assertions fail because the Schema does not yet define the fields.

- [ ] **Step 4: Implement the Zod contract**

Add:

```ts
const relationSchema = z.object({
  id: z.number().int().positive(),
  nameZh: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  descriptionZh: z.string().trim().nullable(),
  descriptionEn: z.string().trim().nullable(),
});

const relationArraySchema = z.array(relationSchema).superRefine((items, context) => {
  for (let index = 0; index < items.length; index += 1) {
    if (index > 0 && items[index - 1].id >= items[index].id) {
      context.addIssue({ code: 'custom', message: 'relation IDs must be unique and sorted' });
    }
  }
});
```

Add required `sourceSkinId`, `skinSets`, and `universes` fields to `chromaSourceSchema`. No change is needed in `normalizedRecord()` because its object spread preserves the metadata before replacing only `images`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the focused Vitest command. Expected: both test files pass.

- [ ] **Step 6: Commit the consumer contract**

```powershell
git add src/domain/chroma.ts src/domain/chroma.test.ts scripts/import-data.test.ts
git commit -m "feat: 扩展臻彩来源元数据契约"
```

### Task 4: Regenerate the catalog from the management database

**Files:**
- Modify: `D:/WebstormProjects/lol-prestige-chroma-hub/data/prestige-chromas.json`

- [ ] **Step 1: Generate through the management system**

Use “臻彩皮肤管理” → “展示站数据” → “写入指定文件夹”, targeting:

```text
D:\WebstormProjects\lol-prestige-chroma-hub\data\
```

This executes `POST /lol/prestige-chroma/hub-json/write` and resolves names/descriptions from `lol_skinline` and `lol_universe`. If the endpoint is unavailable locally, run the management application with its existing development database configuration and call the same endpoint; do not manufacture metadata in the Hub.

- [ ] **Step 2: Validate generated records**

Run:

```powershell
pnpm.cmd data:validate
```

Expected: prints `Validated <N> records` and exits 0. Spot-check that records with empty association sets contain `[]` and records with associations contain localized database values.

- [ ] **Step 3: Commit generated data**

```powershell
git add data/prestige-chromas.json
git commit -m "data: 更新臻彩来源元数据"
```

### Task 5: Update the shared contract document

**Files:**
- Modify: `D:/WebstormProjects/lol-prestige-chroma-hub/docs/数据源与JSON结构.md`

- [ ] **Step 1: Update JSON example and field tables**

Add `sourceSkinId`, `skinSets`, and `universes` using the approved object structure. Document Riot business IDs, nullable descriptions, empty arrays, sorting, uniqueness, and database lookup sources.

- [ ] **Step 2: Update synchronized edit locations**

Add `PrestigeChromaHubRelation.java`, `SkinlineMapper`, and `UniverseMapper` on the producer side, and relation Schema/tests on the consumer side. State that missing localized metadata must be corrected in `lol_skinline` or `lol_universe`, not patched into generated JSON.

- [ ] **Step 3: Verify and commit documentation**

Run `git diff --check`, then:

```powershell
git add docs/数据源与JSON结构.md
git commit -m ":memo: docs: 更新臻彩来源元数据结构"
```

### Task 6: Full cross-project verification

**Files:**
- Verify only; no planned source changes.

- [ ] **Step 1: Verify the management backend**

```powershell
cd D:\IdeaProjects\light-shadow-wallpaper-admin
mvn -pl admin "-Dspring-javaformat.skip=true" "-Dtest=PrestigeChromaHubCatalogServiceTest,LolPrestigeChromaAdminControllerTest" test
mvn -pl admin -DskipTests package
```

Expected: tests and package finish with `BUILD SUCCESS`.

- [ ] **Step 2: Verify the Hub**

```powershell
cd D:\WebstormProjects\lol-prestige-chroma-hub
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd data:validate
pnpm.cmd build
```

Expected: all tests pass, typecheck reports zero diagnostics, catalog validation succeeds, and Astro builds all pages.

- [ ] **Step 3: Audit repository state**

Confirm the Hub is clean. In the management repository, confirm all pre-existing unrelated modifications and untracked files remain unchanged and unstaged.
