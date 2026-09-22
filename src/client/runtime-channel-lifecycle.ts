import type { RuntimeChannel } from "../domain/communitydragon-runtime";

export interface RuntimeChannelHistory {
  readonly url: URL;
  push(url: URL): void;
  replace(url: URL): void;
  onPopState(listener: () => void): () => void;
}

export interface RuntimeChannelLoadContext<T> {
  readonly channel: RuntimeChannel;
  readonly target: T;
  readonly url: URL;
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}

export type RuntimeChannelParseResult<T> =
  | {
      readonly status: "valid";
      readonly channel: RuntimeChannel;
      readonly target: T;
    }
  | {
      readonly status: "invalid";
      readonly channel?: RuntimeChannel;
      readonly message: string;
    };

export interface RuntimeChannelView<T, R, E> {
  loading(
    preserveContent: boolean,
    context: RuntimeChannelLoadContext<T>,
  ): void;
  render(result: R, context: RuntimeChannelLoadContext<T>): void;
  invalid(message: string, channel?: RuntimeChannel): void;
  failure(
    error: E,
    retry: () => void,
    preserveContent: boolean,
  ): void;
  committed?(context: RuntimeChannelLoadContext<T>): void;
}

export interface RuntimeChannelLifecycleOptions<T, R, E> {
  readonly history: RuntimeChannelHistory;
  parse(url: URL): RuntimeChannelParseResult<T>;
  load(target: T, signal: AbortSignal): Promise<R>;
  normalizeError(error: unknown): E;
  isAborted(error: E): boolean;
  readonly view: RuntimeChannelView<T, R, E>;
}

/**
 * Coordinates the externally visible lifecycle of one channel-backed page.
 * Data loading and presentation remain in the caller; this class owns the
 * cancellation, stale-result protection, history commit, and retry rules.
 */
export class RuntimeChannelLifecycle<T, R, E> {
  private abortController: AbortController | undefined;
  private generation = 0;
  private hasContent = false;
  private committedUrl: URL | undefined;
  private unsubscribePopState: (() => void) | undefined;

  constructor(
    private readonly options: RuntimeChannelLifecycleOptions<T, R, E>,
  ) {}

  start(): Promise<void> {
    this.unsubscribePopState?.();
    this.committedUrl = new URL(this.options.history.url);
    this.unsubscribePopState = this.options.history.onPopState(() => {
      void this.load(this.options.history.url, false);
    });
    return this.load(this.options.history.url, false);
  }

  navigate(url: URL): Promise<void> {
    return this.load(url, true);
  }

  dispose(): void {
    this.unsubscribePopState?.();
    this.unsubscribePopState = undefined;
    this.abortController?.abort();
    this.abortController = undefined;
    this.generation += 1;
  }

  private async load(url: URL, commit: boolean): Promise<void> {
    const parsed = this.options.parse(url);
    if (parsed.status === "invalid") {
      this.invalidate();
      this.options.view.invalid(parsed.message, parsed.channel);
      return;
    }

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const generation = ++this.generation;
    const context: RuntimeChannelLoadContext<T> = {
      channel: parsed.channel,
      target: parsed.target,
      url: new URL(url),
      signal: controller.signal,
      isCurrent: () => generation === this.generation,
    };
    const preserveContent = this.hasContent;
    this.options.view.loading(preserveContent, context);

    try {
      const result = await this.options.load(parsed.target, controller.signal);
      if (!context.isCurrent()) return;
      this.options.view.render(result, context);
      this.commitUrl(url, commit);
      this.options.view.committed?.(context);
      this.hasContent = true;
    } catch (error) {
      if (!context.isCurrent()) return;
      const runtimeError = this.options.normalizeError(error);
      if (this.options.isAborted(runtimeError)) return;

      if (
        !commit &&
        this.committedUrl &&
        this.options.history.url.href === url.href &&
        this.committedUrl.href !== url.href
      ) {
        this.options.history.replace(this.committedUrl);
      }

      const retryCommit =
        commit || this.options.history.url.href !== url.href;
      const retry = () => {
        if (!context.isCurrent()) return;
        void this.load(url, retryCommit);
      };
      this.options.view.failure(runtimeError, retry, preserveContent);
    }
  }

  private invalidate(): void {
    this.abortController?.abort();
    this.abortController = undefined;
    this.generation += 1;
  }

  private commitUrl(url: URL, commit: boolean): void {
    if (commit && this.options.history.url.href !== url.href)
      this.options.history.push(url);
    this.committedUrl = new URL(url);
  }
}
