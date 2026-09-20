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
          ? "CommunityDragon 请求失败。"
          : "The CommunityDragon request failed.",
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
        ? "没有找到对应的 CommunityDragon 资料。"
        : "That CommunityDragon reference was not found.";
    case "network":
      return chinese
        ? "无法连接 CommunityDragon，请检查网络后重试。"
        : "CommunityDragon could not be reached. Check the network and retry.";
    case "http":
      return chinese
        ? `CommunityDragon 返回了 HTTP ${error.status ?? "错误"}。`
        : `CommunityDragon returned HTTP ${error.status ?? "an error"}.`;
    case "schema":
      return chinese
        ? "CommunityDragon 返回的资料格式无法识别。"
        : "CommunityDragon returned an unrecognized data shape.";
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
