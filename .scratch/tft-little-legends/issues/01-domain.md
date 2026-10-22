Status: completed
Part of: ../spec.md

# 小小英雄资料投影

实现小小英雄字段校验、按当前语言投影、稳定排序、筛选与分页纯逻辑；图片地址沿用 CommunityDragon 通道转换。

## 验收

固定夹具覆盖三种类别收录、类别与稀有度枚举校验、正整数唯一 `itemId`、同名记录保留、必需字段校验，以及搜索/筛选/排序/50 项分页。补充相邻行为测试。

## 结果与验证

已实现三种 companion 类别和四种稀有度的来源字段校验、投影、同名记录保留、稳定排序、组合筛选、50 项分页和同通道图片 URL。真实 PBE 数据包含 `speciesId: 0` 的 River Sprite 记录；实现保留该来源值并覆盖回归测试。`pnpm exec vitest run src/domain/little-legends.test.ts` 通过。
