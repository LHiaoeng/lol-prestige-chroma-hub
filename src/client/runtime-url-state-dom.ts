import {
  formatRuntimeUrl,
  readRuntimeUrlState,
  type RuntimeUrlParameter,
} from "../domain/runtime-url-state";

const allRuntimeParameters: readonly RuntimeUrlParameter[] = [
  "id",
  "champion",
  "stage",
  "channel",
];
const channelOnly: readonly RuntimeUrlParameter[] = ["channel"];

function parametersForPath(pathname: string): readonly RuntimeUrlParameter[] {
  if (pathname.endsWith("/skins/detail/")) return allRuntimeParameters;
  if (
    pathname.endsWith("/champions/detail/") ||
    pathname.endsWith("/skinlines/detail/") ||
    pathname.endsWith("/universes/detail/")
  )
    return ["id", "channel"];
  return channelOnly;
}

function browserUrl(document: Document): URL | undefined {
  const href = document.defaultView?.location.href;
  return href ? new URL(href) : undefined;
}

function targetUrl(anchor: HTMLAnchorElement, currentUrl: URL): URL | undefined {
  const href = anchor.getAttribute("href");
  return href ? new URL(href, currentUrl) : undefined;
}

function updateAnchor(anchor: HTMLAnchorElement, target: URL): void {
  anchor.setAttribute("href", `${target.pathname}${target.search}${target.hash}`);
}

export function bindRuntimeLanguageToggle(
  document: Document,
  currentUrl = browserUrl(document),
): void {
  if (!currentUrl) return;
  const toggle = document.querySelector<HTMLAnchorElement>(".language-toggle");
  if (!toggle) return;
  const target = targetUrl(toggle, currentUrl);
  if (!target) return;
  updateAnchor(
    toggle,
    formatRuntimeUrl(
      target,
      readRuntimeUrlState(currentUrl),
      parametersForPath(target.pathname),
    ),
  );
}

export function bindRuntimeChannelLinks(
  document: Document,
  currentUrl = browserUrl(document),
): void {
  if (!currentUrl) return;
  const currentState = readRuntimeUrlState(currentUrl);
  document
    .querySelectorAll<HTMLAnchorElement>("[data-runtime-channel-link]")
    .forEach((anchor) => {
      const target = targetUrl(anchor, currentUrl);
      if (!target) return;
      const targetState = readRuntimeUrlState(target);
      updateAnchor(
        anchor,
        formatRuntimeUrl(
          target,
          {
            ...targetState,
            channel: currentState.channel,
            channelExplicit: currentState.channelExplicit,
          },
          parametersForPath(target.pathname),
        ),
      );
    });
}
