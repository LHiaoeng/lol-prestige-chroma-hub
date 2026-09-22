import type { RuntimeChannelLoadContext } from "./runtime-channel-lifecycle";

export type RuntimePageCoreState<Core, Error> =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly value: Core }
  | {
      readonly status: "failed";
      readonly error: Error;
      readonly retry: () => void;
    };

export type RuntimePageSlotState<Value, Error> =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly value: Value }
  | { readonly status: "empty"; readonly value: Value }
  | {
      readonly status: "failed";
      readonly error: Error;
      readonly retry: () => void;
    };

export type RuntimePageSlotValues = object;

export type RuntimePageSlotStates<Values extends RuntimePageSlotValues, Error> =
  Partial<{
    readonly [Key in keyof Values]: RuntimePageSlotState<Values[Key], Error>;
  }>;

export interface RuntimePageState<
  Target,
  Core,
  Values extends RuntimePageSlotValues,
  Error,
> {
  readonly context: RuntimeChannelLoadContext<Target> | undefined;
  readonly core: RuntimePageCoreState<Core, Error>;
  readonly slots: RuntimePageSlotStates<Values, Error>;
}

export type RuntimePageSlotDefinition<
  Target,
  Core,
  Values extends RuntimePageSlotValues,
> = {
  [Key in keyof Values]: {
    readonly key: Key;
    readonly load: (
      context: RuntimeChannelLoadContext<Target>,
      core: Core,
    ) => Promise<Values[Key]>;
    readonly isEmpty?: (value: Values[Key]) => boolean;
  };
}[keyof Values];

export interface RuntimePageOrchestrationOptions<
  Target,
  Core,
  Values extends RuntimePageSlotValues,
  Error,
> {
  readonly plan: (
    context: RuntimeChannelLoadContext<Target>,
    core: Core,
  ) => readonly RuntimePageSlotDefinition<Target, Core, Values>[];
  readonly normalizeError: (error: unknown) => Error;
  readonly isAborted: (error: Error) => boolean;
  readonly onState: (
    state: RuntimePageState<Target, Core, Values, Error>,
  ) => void;
}

function defaultIsEmpty(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

/**
 * Owns the observable core/supplement state for one channel lifecycle context.
 * Cancellation and generation remain the lifecycle's responsibility; every
 * supplement still checks that context before it can publish a result.
 */
export class RuntimePageOrchestration<
  Target,
  Core,
  Values extends RuntimePageSlotValues,
  Error,
> {
  private context: RuntimeChannelLoadContext<Target> | undefined;
  private core: Core | undefined;
  private definitions = new Map<
    keyof Values,
    RuntimePageSlotDefinition<Target, Core, Values>
  >();
  private inFlight = new Set<keyof Values>();
  private currentState: RuntimePageState<Target, Core, Values, Error> = {
    context: undefined,
    core: { status: "loading" },
    slots: {},
  };

  constructor(
    private readonly options: RuntimePageOrchestrationOptions<
      Target,
      Core,
      Values,
      Error
    >,
  ) {}

  get state(): RuntimePageState<Target, Core, Values, Error> {
    return this.currentState;
  }

  begin(context: RuntimeChannelLoadContext<Target>): void {
    this.context = context;
    this.core = undefined;
    this.definitions.clear();
    this.inFlight.clear();
    this.publish({
      context,
      core: { status: "loading" },
      slots: {},
    });
  }

  ready(
    core: Core,
    context: RuntimeChannelLoadContext<Target>,
  ): void {
    if (!this.isCurrent(context)) return;
    this.core = core;
    this.definitions.clear();
    for (const definition of this.options.plan(context, core)) {
      if (this.definitions.has(definition.key))
        throw new Error(`Duplicate runtime page slot: ${String(definition.key)}`);
      this.definitions.set(definition.key, definition);
    }
    const slots = Object.fromEntries(
      [...this.definitions.keys()].map((key) => [key, { status: "loading" }]),
    ) as RuntimePageSlotStates<Values, Error>;
    this.publish({ context, core: { status: "ready", value: core }, slots });
    for (const key of this.definitions.keys()) void this.loadSlot(key, context);
  }

  failed(
    error: Error,
    retry: () => void,
    context: RuntimeChannelLoadContext<Target>,
  ): void {
    if (!this.isCurrent(context)) return;
    this.core = undefined;
    this.definitions.clear();
    this.inFlight.clear();
    this.publish({
      context,
      core: { status: "failed", error, retry },
      slots: {},
    });
  }

  invalidate(): void {
    this.context = undefined;
    this.core = undefined;
    this.definitions.clear();
    this.inFlight.clear();
  }

  private isCurrent(context: RuntimeChannelLoadContext<Target>): boolean {
    return this.context === context && context.isCurrent();
  }

  private publish(
    state: RuntimePageState<Target, Core, Values, Error>,
  ): void {
    this.currentState = state;
    this.options.onState(state);
  }

  private async loadSlot(
    key: keyof Values,
    context: RuntimeChannelLoadContext<Target>,
  ): Promise<void> {
    if (
      !this.isCurrent(context) ||
      this.inFlight.has(key) ||
      this.core === undefined
    )
      return;
    const definition = this.definitions.get(key);
    if (!definition) return;
    this.inFlight.add(key);
    try {
      const value = await definition.load(context, this.core);
      if (!this.isCurrent(context) || !this.inFlight.has(key)) return;
      this.inFlight.delete(key);
      const status = (definition.isEmpty ?? defaultIsEmpty)(value)
        ? "empty"
        : "ready";
      this.publishSlot(key, {
        status,
        value,
      } as RuntimePageSlotState<Values[typeof key], Error>);
    } catch (error) {
      if (!this.isCurrent(context) || !this.inFlight.has(key)) return;
      this.inFlight.delete(key);
      const normalized = this.options.normalizeError(error);
      if (this.options.isAborted(normalized)) return;
      const retry = () => {
        if (!this.isCurrent(context)) return;
        const slot = this.currentState.slots[key];
        if (!slot || slot.status !== "failed") return;
        this.setSlotLoading(key);
        void this.loadSlot(key, context);
      };
      this.publishSlot(key, { status: "failed", error: normalized, retry });
    }
  }

  private setSlotLoading(key: keyof Values): void {
    this.publishSlot(key, { status: "loading" });
  }

  private publishSlot(
    key: keyof Values,
    slot: RuntimePageSlotState<Values[typeof key], Error>,
  ): void {
    this.publish({
      context: this.context,
      core: this.currentState.core,
      slots: { ...this.currentState.slots, [key]: slot },
    });
  }
}

export { RuntimePageOrchestration as RuntimePageOrchestrator };
