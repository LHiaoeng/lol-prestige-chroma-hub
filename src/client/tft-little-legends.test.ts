import { describe, expect, it } from "vitest";
import { TFT_COMPANION_TYPE_ORDER } from "../domain/little-legends";
import { tftCompanionDisplayName, tftCompanionTypeLabel } from "./tft-little-legends";

describe("TFT companion labels", () => {
  it("appends a star suffix only when the companion has multiple star levels", () => {
    const item = { name: "我是啵啵龙 羽饰骑士", level: 3 };
    expect(tftCompanionDisplayName(item, true, "zh_cn")).toBe(
      "我是啵啵龙 羽饰骑士 3星",
    );
    expect(tftCompanionDisplayName(item, false, "zh_cn")).toBe(item.name);
    expect(tftCompanionDisplayName({ name: "Poro", level: 3 }, true, "default")).toBe(
      "Poro 3 stars",
    );
  });

  it("uses localized names for each companion type", () => {
    expect(tftCompanionTypeLabel("kLittleLegend", "zh_cn")).toBe("小小英雄");
    expect(tftCompanionTypeLabel("kChibi", "zh_cn")).toBe("英雄级小小英雄");
    expect(tftCompanionTypeLabel("kStyle2", "zh_cn")).toBe("不朽弈士形象");
    expect(tftCompanionTypeLabel("kLittleLegend", "default")).toBe("Little Legends");
    expect(tftCompanionTypeLabel("kChibi", "default")).toBe("Chibis");
    expect(tftCompanionTypeLabel("kStyle2", "default")).toBe("Unbound");
  });

  it("orders companion type filters from highest to lowest", () => {
    expect(TFT_COMPANION_TYPE_ORDER.map((type) =>
      tftCompanionTypeLabel(type, "zh_cn"),
    )).toEqual(["不朽弈士形象", "英雄级小小英雄", "小小英雄"]);
  });
});
