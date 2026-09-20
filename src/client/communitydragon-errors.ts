import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
} from "../domain/communitydragon-runtime";

export function asCommunityDragonError(
  error: unknown,
  locale: CommunityDragonLocale,
): CommunityDragonRuntimeError {
  return error instanceof CommunityDragonRuntimeError
    ? error
    : new CommunityDragonRuntimeError(
        "network",
        locale === "zh_cn"
          ? "游戏资料请求失败。"
          : "The game reference request failed.",
        { cause: error },
      );
}

export function runtimeFailureMessage(
  error: CommunityDragonRuntimeError,
  locale: CommunityDragonLocale,
): string {
  const chinese = locale === "zh_cn";
  switch (error.code) {
    case "not-found":
      return chinese
        ? "没有找到对应的游戏资料。"
        : "That game reference was not found.";
    case "network":
      return chinese
        ? "无法连接游戏资料源，请检查网络后重试。"
        : "The game data source could not be reached. Check the network and retry.";
    case "http":
      return chinese
        ? `游戏资料源返回了 HTTP ${error.status ?? "错误"}。`
        : `The game data source returned HTTP ${error.status ?? "an error"}.`;
    case "schema":
      return chinese
        ? "游戏资料源返回的资料格式无法识别。"
        : "The game data source returned an unrecognized data shape.";
    case "unsafe-url":
      return chinese
        ? "资料来源链接不安全，已拒绝请求。"
        : "The reference URL was unsafe and the request was blocked.";
    case "invalid-request":
      return chinese ? "请求参数无效。" : "The reference request was invalid.";
    case "aborted":
      return chinese ? "资料加载已取消。" : "Reference loading was cancelled.";
  }
}
