import { merge, Observable, Observer, OperatorFunction, Subject, Subscription } from "rxjs";

/**
 * Public read-only observable property exposed by a SAM store.
 *
 * @typeParam T - Runtime value held by the property.
 */
export interface Property<T> extends Observable<T> {
  /**
   * Returns whether this property has pending unpublished changes.
   *
   * @returns `true` when the property changed since the last broadcast.
   */
  hasChanged: () => boolean;

  /**
   * Returns the current property value.
   *
   * Object and array values are exposed as readonly values from the public API.
   *
   * @returns The current property value.
   */
  get: () => T extends {} | [] ? Readonly<T> : T;
}

/**
 * Writable model property implementation.
 *
 * `StoreProperty` is used internally by the model while exposing the public `Property<T>` contract to consumers.
 *
 * @typeParam T - Runtime value held by the property.
 */
export class StoreProperty<T> extends Subject<T> implements Property<T> {
  private changed = false;

  /**
   * Creates a writable store property.
   *
   * @param currentVal - Initial property value.
   */
  constructor(private currentVal: T) {
    super();
  }

  /**
   * Subscribes to future values and immediately emits the current value to the subscriber.
   *
   * @param observerOrNext - Observer object or callback invoked with the current and future values.
   * @returns The RxJS subscription.
   */
  subscribeAndGet(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    const subscription = super.subscribe(observerOrNext!);

    if (!subscription.closed) {
      if ((observerOrNext as Partial<Observer<T>>)?.next != undefined) {
        (observerOrNext as Partial<Observer<T>>).next!(this.currentVal);
      } else if (typeof observerOrNext === "function") {
        observerOrNext(this.currentVal);
      }
    }

    return subscription;
  }

  /**
   * Subscribes to future values.
   *
   * Unlike `subscribeAndGet`, this method does not immediately emit the current value.
   *
   * @param observerOrNext - Observer object or callback invoked with future values.
   * @returns The RxJS subscription.
   */
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    return super.subscribe(observerOrNext!);
  }

  /**
   * Returns whether this property has pending unpublished changes.
   *
   * @returns `true` when the property changed since the last broadcast.
   */
  hasChanged(): boolean {
    return this.changed;
  }

  /**
   * Returns the current property value.
   *
   * @returns The current property value.
   */
  get(): T extends {} | [] ? Readonly<T> : T {
    return this.currentVal as T extends {} | [] ? Readonly<T> : T;
  }

  /**
   * Mutates the current property value in place.
   *
   * The mutator must return `true` when it changed the value.
   *
   * @param mutator - Function that receives the actual writable value and reports whether it changed.
   * @returns `true` when the property was marked as changed.
   */
  mutate(mutator: (actual: T) => boolean): boolean {
    if (mutator(this.currentVal)) {
      this.changed = true;
      return true;
    }

    return false;
  }

  /**
   * Replaces the current property value.
   *
   * @param value - New value.
   */
  set(value: T): void {
    this.currentVal = value;
    this.changed = true;
  }

  /**
   * Emits the current value when the property has pending changes.
   */
  broadcast(): void {
    if (this.changed) {
      this.changed = false;
      super.next(this.currentVal);
    }
  }
}

/**
 * Error returned when an action is presented while the model is already notifying subscribers or running reactions.
 */
export class ReentrantPresentError extends Error {
  /**
   * Creates a reentrant transition error.
   */
  constructor() {
    super(
      "Cannot update the model from inside a state subscription. This creates a reentrant state transition. Use a reaction, or schedule the update after the current notification finishes.",
    );

    this.name = "ReentrantPresentError";
  }
}

/**
 * Error wrapper returned when action execution throws.
 */
export class ActionError extends Error {
  /**
   * Creates an action error.
   *
   * @param originalError - Original value thrown by the action.
   */
  constructor(public readonly originalError: unknown) {
    super(originalError instanceof Error ? originalError.message : String(originalError));
    this.name = "ActionError";
  }
}

/**
 * Public store shape exposed to consumers.
 */
export type PublicStore = Readonly<{
  /** Optional static state. */
  static?: Readonly<any>;

  /** Dynamic observable properties. */
  dyn: Readonly<Record<string, Property<any>>>;
}>;

/**
 * Internal writable dynamic property map.
 */
export type WritableDyn = Readonly<Record<string, StoreProperty<any>>>;

/**
 * Converts writable dynamic properties into their public read-only property shape.
 *
 * @typeParam Dyn - Writable dynamic property map.
 */
export type PublicDyn<Dyn extends WritableDyn> = Readonly<{
  [K in keyof Dyn]: Dyn[K] extends StoreProperty<infer T> ? Property<T> : never;
}>;

/**
 * Public model state type derived from writable dynamic properties and optional static state.
 *
 * @typeParam Dyn - Writable dynamic property map.
 * @typeParam Static - Optional static state type.
 */
export type ModelPublicState<Dyn extends WritableDyn, Static = undefined> = Readonly<{
  static?: Static extends undefined ? undefined : Readonly<Static>; dyn: PublicDyn<Dyn>;
}>;

/**
 * Extracts the runtime value type from a public property.
 *
 * @typeParam P - Property type.
 */
export type PropValue<P> = P extends Property<infer T> ? T : never;

/**
 * Converts a public store into its writable internal store shape.
 *
 * @typeParam S - Public store type.
 */
export type WritableStore<S extends PublicStore> = Omit<S, "dyn"> & {
  dyn: {
    [K in keyof S["dyn"]]: StoreProperty<PropValue<S["dyn"][K]>>;
  };
};

/**
 * Writable model state type derived from writable dynamic properties and optional static state.
 *
 * @typeParam Dyn - Writable dynamic property map.
 * @typeParam Static - Optional static state type.
 */
export type ModelWritableStore<Dyn extends WritableDyn, Static = undefined> = WritableStore<ModelPublicState<Dyn, Static>>;

/**
 * String keys of a public store dynamic property map.
 *
 * @typeParam S - Public store type.
 */
export type StoreKey<S extends PublicStore> = Extract<keyof S["dyn"], string>;

type NoInferValue<T> = [T][T extends any ? 0 : never];

/**
 * Union of all public dynamic properties in a store.
 *
 * @typeParam S - Public store type.
 */
export type StoreProp<S extends PublicStore> = S["dyn"][StoreKey<S>];

/**
 * Function used by mutating operators and actions to replace a property value.
 *
 * @typeParam S - Public store type.
 */
export type SetFn<S extends PublicStore> = <P extends StoreProp<S>>(prop: P, value: NoInferValue<PropValue<P>>) => void;

/**
 * Function used by mutating operators and actions to mutate a property value in place.
 *
 * @typeParam S - Public store type.
 */
export type MutateFn<S extends PublicStore> = <P extends StoreProp<S>>(prop: P, mutator: (actual: NoInferValue<PropValue<P>>) => boolean) => void;

/**
 * Any supported operator function.
 *
 * Operators either return values from readonly state or receive `set` and `mutate` helpers to update state.
 *
 * @typeParam S - Public store type.
 */
export type OperatorFn<S extends PublicStore> = ReadonlyOperatorFn<S> | MutatingOperatorFn<S>;

/**
 * Named operator definitions.
 *
 * @typeParam S - Public store type.
 */
export type OperatorMap<S extends PublicStore> = Record<string, OperatorFn<S>>;

type TailAfterState<Op> = Op extends (state: any, ...args: infer Args) => any ? Args : never;

type MutateOperatorArgs<S extends PublicStore, Op> = TailAfterState<Op> extends [SetFn<S>, MutateFn<S>, ...infer Args] ? Args : never;

type HasSetMutate<S extends PublicStore, Op> = TailAfterState<Op> extends [SetFn<S>, MutateFn<S>, ...any[]] ? true : false;

type StrictProposalResult<S extends PublicStore, R> = R extends object
  ? (Exclude<keyof R, keyof S["dyn"]> extends never
    ? (R extends Proposal<S> ? R : never)
    : never)
  : never;

type IsProposalOperator<S extends PublicStore, Op> = Op extends (state: Readonly<S>, ...args: any[]) => infer R
  ? (HasSetMutate<S, Op> extends true
    ? false
    : ([StrictProposalResult<S, R>] extends [never] ? false : true))
  : false;

/**
 * Bound mutating operators with the model state, `set`, and `mutate` parameters removed.
 *
 * @typeParam OperatorDefs - Operator definition map.
 * @typeParam S - Public store type.
 */
export type BoundMutateOperators<OperatorDefs, S extends PublicStore = PublicStore> = Readonly<{
  [K in keyof OperatorDefs as HasSetMutate<S, OperatorDefs[K]> extends true ? K : never]: OperatorDefs[K] extends (...args: any[]) => infer R
  ? (...args: MutateOperatorArgs<S, OperatorDefs[K]>) => R : never;
}>;

/**
 * Bound proposal operators with the model state parameter removed.
 *
 * Only operators that return a valid proposal object are included.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export type BoundProposalOperators<S extends PublicStore, OperatorDefs> = Readonly<{
  [K in keyof OperatorDefs as IsProposalOperator<S, OperatorDefs[K]> extends true ? K : never]: OperatorDefs[K] extends (
    state: any, ...args: infer Args
  ) => infer R ? (...args: Args) => R : never;
}>;

type OperatorState<Op> = Op extends (state: Readonly<infer S>, ...args: any[]) => any ? (S extends PublicStore ? S : never) : never;

type OperatorDefsState<OperatorDefs> = OperatorState<OperatorDefs[keyof OperatorDefs]>;

/**
 * Bound operators exposed to mutating actions.
 *
 * @typeParam OperatorDefs - Operator definition map.
 * @typeParam S - Public store type.
 */
export type BoundOperators<OperatorDefs, S extends PublicStore = OperatorDefsState<OperatorDefs>> = BoundMutateOperators<OperatorDefs, S>;

/**
 * Public store narrowed to a selected set of dynamic properties.
 *
 * @typeParam S - Public store type.
 * @typeParam Keys - Dynamic property keys to include.
 */
export type PartialStore<S extends PublicStore, Keys extends readonly StoreKey<S>[]> = Readonly<{
  static?: S["static"];
  dyn: Readonly<Pick<S["dyn"], Keys[number]>>;
}>;

type StateIdChangeRef = {
  value: number;
};

/**
 * Proposed property values to merge into the model.
 *
 * Proposal keys must belong to the dynamic store.
 *
 * @typeParam S - Public store type.
 */
export type Proposal<S extends PublicStore> = Partial<{
  [K in keyof S["dyn"]]: PropValue<S["dyn"][K]>;
}>;

/**
 * Operator that reads state and returns any value.
 *
 * @typeParam S - Public store type.
 */
export type ReadonlyOperatorFn<S extends PublicStore> = (state: Readonly<S>, ...args: any[]) => any;

/**
 * Operator that reads state and returns a state proposal.
 *
 * @typeParam S - Public store type.
 */
export type ProposalOperatorFn<S extends PublicStore> = (state: Readonly<S>, ...args: any[]) => Proposal<S>;

/**
 * Operator that receives public state plus mutation helpers.
 *
 * @typeParam S - Public store type.
 */
export type MutatingOperatorFn<S extends PublicStore> = (state: Readonly<S>, set: SetFn<S>, mutate: MutateFn<S>, ...args: any[]) => any;

/**
 * Action accepted by a model.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export type ModelAction<S extends PublicStore, OperatorDefs extends OperatorMap<S> = {}> = MutateAction<S, OperatorDefs> | ProposalAction<S, OperatorDefs>;

/**
 * Defers an asynchronous action producer until after the current action cycle.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export type DeferFn<S extends PublicStore, OperatorDefs extends OperatorMap<S> = {}> = (
  promise: () => Promise<ModelAction<S, OperatorDefs> | void> | ModelAction<S, OperatorDefs> | void
) => void;

/**
 * Shared action metadata.
 */
export interface Action {
  /** Optional action name used for diagnostics or instrumentation. */
  readonly name?: string;
}

/**
 * Runtime action type discriminants.
 */
export const ActionType = {
  PROPOSAL: 0,
  MUTATE: 1,
} as const;

/**
 * Bound proposal action ready to run against the current model instance.
 *
 * @typeParam S - Public store type.
 */
export type BoundProposalAction<S extends PublicStore> = Action & {
  /** Proposal action discriminant. */
  readonly type: typeof ActionType.PROPOSAL;

  /** Runs the proposal action and returns values to merge into the store. */
  run: () => (Proposal<S> | undefined);
};

/**
 * Bound mutating action ready to run against the current model instance.
 */
export type BoundMutateAction = Action & {
  /** Mutate action discriminant. */
  readonly type: typeof ActionType.MUTATE;

  /** Runs the mutating action. */
  run: () => void;
};

/**
 * Bound action ready to execute inside a model cycle.
 *
 * @typeParam S - Public store type.
 */
export type BoundAction<S extends PublicStore> = BoundProposalAction<S> | BoundMutateAction;

/**
 * Action that returns a proposal to merge into the model.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export class ProposalAction<S extends PublicStore, OperatorDefs extends OperatorMap<S> = {}> {
  /** Proposal action discriminant. */
  public readonly type: typeof ActionType.PROPOSAL = ActionType.PROPOSAL;

  /**
   * Creates a proposal action.
   *
   * @param run - Function that produces a state proposal.
   * @param name - Optional action name used for diagnostics or instrumentation.
   */
  constructor(
    public readonly run: (
      state: Readonly<S>, defer: DeferFn<S, OperatorDefs>,
      operators: BoundProposalOperators<S, OperatorDefs>,
    ) => (Proposal<S> | undefined),
    public readonly name?: string,
  ) { }
}

/**
 * Action that mutates the model through the provided `set` and `mutate` helpers.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export class MutateAction<S extends PublicStore, OperatorDefs extends OperatorMap<S> = {}> {
  /** Mutate action discriminant. */
  public readonly type: typeof ActionType.MUTATE = ActionType.MUTATE;

  /**
   * Creates a mutating action.
   *
   * @param run - Function that mutates state through the provided helpers.
   * @param name - Optional action name used for diagnostics or instrumentation.
   */
  constructor(
    public readonly run: (
      state: Readonly<S>, defer: DeferFn<S, OperatorDefs>, set: SetFn<S>,
      mutate: MutateFn<S>, operators: BoundMutateOperators<OperatorDefs, S>,
    ) => void,
    public readonly name?: string,
  ) { }
}

/**
 * Explicit action rejection.
 */
export class Rejection {
  /**
   * Creates a rejection.
   *
   * @param cause - Optional rejection reason.
   */
  constructor(public readonly cause?: string) { }
}

/**
 * Result returned after presenting an action.
 */
export type ActionResult = Error | Rejection | undefined;

/**
 * Reaction invoked after actions to derive follow-up actions.
 *
 * @typeParam S - Public store type.
 * @typeParam OperatorDefs - Operator definition map.
 */
export type Reaction<S extends PublicStore, OperatorDefs extends OperatorMap<S>> = (
  state: Readonly<S>, react: (action: ModelAction<S, OperatorDefs>) => ActionResult,
) => void;

/**
 * Reactive SAM model.
 *
 * The model owns writable dynamic properties internally while exposing a readonly public store. Actions are queued, executed, followed by reactions,
 * and then broadcast to store and property subscribers.
 *
 * @typeParam Dyn - Writable dynamic property map.
 * @typeParam Static - Optional static state type.
 * @typeParam OperatorDefs - Operator definition map.
 * @typeParam Operators - Bound mutating operators exposed inside mutating actions.
 * @typeParam ProposalOperators - Bound proposal operators exposed inside proposal actions.
 */
export class Model<
  Dyn extends WritableDyn,
  Static = undefined,
  OperatorDefs extends OperatorMap<ModelPublicState<Dyn, Static>> = {},
  Operators extends BoundMutateOperators<OperatorDefs, ModelPublicState<Dyn, Static>> = BoundMutateOperators<OperatorDefs, ModelPublicState<Dyn, Static>>,
  ProposalOperators extends BoundProposalOperators<ModelPublicState<Dyn, Static>, OperatorDefs> = BoundProposalOperators<
    ModelPublicState<Dyn, Static>,
    OperatorDefs
  >,
> {
  declare readonly __stateType: ModelPublicState<Dyn, Static>;
  declare readonly __operatorDefsType: OperatorDefs;

  private readonly operatorDefs: OperatorDefs;
  private readonly store: ModelWritableStore<Dyn, Static>;
  private readonly subject = new Subject<Readonly<ModelPublicState<Dyn, Static>>>();
  private readonly reactions: Array<Reaction<ModelPublicState<Dyn, Static>, OperatorDefs>> = [];
  private updated = false;
  private readonly stateChangeIdRef: StateIdChangeRef = { value: 0 };
  private broadcasting = false;
  private reacting = false;
  private actionQueue: Array<{
    action: ModelAction<ModelPublicState<Dyn, Static>, OperatorDefs>;
    resolve: (result: ActionResult) => void;
  }> = [];
  private draining = false;
  private yieldScheduled = false;
  private lastYieldTs = performance.now();
  private readonly maxSyncMs = 8;

  private readonly actionLogic: (
    action: BoundAction<ModelPublicState<Dyn, Static>>,
    state: ModelWritableStore<Dyn, Static>,
  ) => Rejection | undefined;

  private readonly reactionLogic: Reaction<ModelPublicState<Dyn, Static>, OperatorDefs> | undefined;

  /**
   * Creates a model.
   *
   * @param dyn - Writable dynamic property map.
   * @param options - Optional static state, operators, and custom action or reaction logic.
   */
  constructor(
    dyn: Dyn,
    options?: {
      staticState?: Static;
      operators?: OperatorDefs & OperatorMap<ModelPublicState<Dyn, Static>>;
      actionLogic?: (
        action: BoundAction<ModelPublicState<Dyn, Static>>,
        state: ModelWritableStore<Dyn, Static>,
      ) => Rejection | undefined;
      reactionLogic?: Reaction<ModelPublicState<Dyn, Static>, OperatorDefs>;
    },
  ) {
    const staticState = options?.staticState;

    this.store = (staticState === undefined ? { dyn } : { static: staticState, dyn }) as unknown as ModelWritableStore<Dyn, Static>;
    this.operatorDefs = (options?.operators ?? {}) as OperatorDefs;

    this.actionLogic = options?.actionLogic
      ? options.actionLogic
      : (action) => {
        if (action.type == ActionType.PROPOSAL) {
          this.mergeProposal(action.run());
        } else {
          action.run();
        }

        return undefined;
      };

    this.reactionLogic = options?.reactionLogic;
  }

  private get publicState(): Readonly<ModelPublicState<Dyn, Static>> {
    return this.store as unknown as Readonly<ModelPublicState<Dyn, Static>>;
  }

  private mergeProposal(proposal: Proposal<ModelPublicState<Dyn, Static>> | undefined): void {
    for (const k in proposal) {
      if (Object.prototype.hasOwnProperty.call(proposal, k)) {
        const key = k as keyof ModelPublicState<Dyn, Static>["dyn"];

        this.store.dyn[key].set(proposal[key] as PropValue<ModelPublicState<Dyn, Static>["dyn"][typeof key]>);
        this.updated = true;
      }
    }
  }

  private processOneCycle(action: ModelAction<ModelPublicState<Dyn, Static>, OperatorDefs>): ActionResult {
    const boundAction = this.bindAction(action);

    try {
      const result = this.actionLogic(boundAction, this.store);

      if (result) {
        return result;
      }
    } catch (e) {
      console.error("[EasySam] Error in action");
      return new ActionError(e);
    }

    if (this.reactionLogic || this.reactions.length > 0) {
      this.reacting = true;

      try {
        this.reactionLogic &&
          this.reactionLogic(this.publicState, (reaction) => {
            const boundReaction = this.bindAction(reaction);
            return this.actionLogic(boundReaction, this.store);
          });

        const reactionsCant = this.reactions.length; // Prevent running reactions added from a reaction.

        for (let i = 0; i < reactionsCant; i++) {
          this.reactions[i](this.publicState, (reactionAction) => {
            const boundReaction = this.bindAction(reactionAction);
            return this.actionLogic(boundReaction, this.store);
          });
        }
      } catch (_) {
        console.error("[EasySam] Error in reaction");
      } finally {
        this.reacting = false;
      }
    }

    this.broadcastChanges();

    return undefined;
  }

  /**
   * Presents an action to the model.
   *
   * Actions are queued and processed in order. If the model is currently broadcasting or reacting, the returned promise resolves with
   * `ReentrantPresentError`.
   *
   * @param action - Action to run.
   * @returns Promise resolving to the action result.
   */
  present(action: ModelAction<ModelPublicState<Dyn, Static>, OperatorDefs>): Promise<ActionResult> {
    if (this.broadcasting || this.reacting) {
      return Promise.resolve(new ReentrantPresentError());
    }

    let resolveResult!: (result: ActionResult) => void;

    const promise = new Promise<ActionResult>((resolve) => {
      resolveResult = resolve;
    });

    this.actionQueue.push({
      action,
      resolve: resolveResult,
    });

    this.drainQueue();

    return promise;
  }

  private drainQueue(): void {
    if (this.draining || this.yieldScheduled) {
      return;
    }

    this.draining = true;

    try {
      while (this.actionQueue.length > 0) {
        const item = this.actionQueue.shift()!;

        const result = this.processOneCycle(item.action);
        item.resolve(result);

        const now = performance.now();

        if (now - this.lastYieldTs > this.maxSyncMs) {
          this.lastYieldTs = now;
          this.scheduleDrain();
          return;
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private scheduleDrain(): void {
    if (this.yieldScheduled) {
      return;
    }

    this.yieldScheduled = true;

    setTimeout(() => {
      this.yieldScheduled = false;
      this.lastYieldTs = performance.now();
      this.drainQueue();
    }, 0);
  }

  private bindAction(action: ModelAction<ModelPublicState<Dyn, Static>, OperatorDefs>): BoundAction<ModelPublicState<Dyn, Static>> {
    if (action.type === ActionType.PROPOSAL) {
      return {
        type: ActionType.PROPOSAL,
        name: action.name,
        run: () => action.run(this.publicState, this.handleDefer.bind(this), this.bindProposalOperators()),
      };
    }

    return {
      type: ActionType.MUTATE,
      name: action.name,
      run: () =>
        action.run(
          this.publicState,
          this.handleDefer.bind(this),
          this.handleSetPublic.bind(this),
          this.handleMutatePublic.bind(this),
          this.bindMutateOperators(),
        ),
    };
  }

  private bindMutateOperators(): Operators {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(this.operatorDefs)) {
      const operator = this.operatorDefs[key] as (
        state: Readonly<ModelPublicState<Dyn, Static>>,
        set: SetFn<ModelPublicState<Dyn, Static>>,
        mutate: MutateFn<ModelPublicState<Dyn, Static>>,
        ...args: unknown[]
      ) => unknown;

      result[key] = (...args: unknown[]) => {
        return operator(this.publicState, this.handleSetPublic.bind(this), this.handleMutatePublic.bind(this), ...args);
      };
    }

    return result as Operators;
  }

  private bindProposalOperators(): ProposalOperators {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(this.operatorDefs)) {
      const operator = this.operatorDefs[key] as (state: Readonly<ModelPublicState<Dyn, Static>>, ...args: unknown[]) => unknown;

      result[key] = (...args: unknown[]) => {
        return operator(this.publicState, ...args);
      };
    }

    return result as ProposalOperators;
  }

  /**
   * Registers a reaction.
   *
   * Reactions run after actions and before broadcasts. Reactions added while reactions are running are not executed in the same cycle.
   *
   * @param reaction - Reaction callback.
   */
  react(reaction: Reaction<ModelPublicState<Dyn, Static>, OperatorDefs>): void {
    this.reactions.push(reaction);
  }

  /**
   * Subscribes to a selected set of dynamic properties.
   *
   * The returned observable emits at most once per model state-change id.
   *
   * @typeParam Keys - Dynamic property keys to observe.
   * @param keys - Dynamic property keys to observe.
   * @returns Observable of the selected partial store.
   */
  partial<Keys extends readonly StoreKey<ModelPublicState<Dyn, Static>>[]>(...keys: Keys): Observable<PartialStore<ModelPublicState<Dyn, Static>, Keys>> {
    const props = keys.map((key) => this.store.dyn[key]);

    return merge(...props).pipe(eventFilterOp<unknown, ModelPublicState<Dyn, Static>, PartialStore<ModelPublicState<Dyn, Static>, Keys>>(
      this.stateChangeIdRef,
      this.publicState,
    ));
  }

  /**
   * Subscribes to a selected set of dynamic properties and emits only when the predicate passes.
   *
   * The returned observable emits at most once per model state-change id.
   *
   * @typeParam Keys - Dynamic property keys to observe.
   * @param test - Predicate run against the selected partial store.
   * @param keys - Dynamic property keys to observe.
   * @returns Observable of the selected partial store.
   */
  partialTest<Keys extends readonly StoreKey<ModelPublicState<Dyn, Static>>[]>(
    test: (props: PartialStore<ModelPublicState<Dyn, Static>, Keys>) => boolean, ...keys: Keys
  ): Observable<PartialStore<ModelPublicState<Dyn, Static>, Keys>> {
    const props = keys.map((key) => this.store.dyn[key]);

    return merge(...props).pipe(eventFilterOp<unknown, ModelPublicState<Dyn, Static>, PartialStore<ModelPublicState<Dyn, Static>, Keys>>(
      this.stateChangeIdRef,
      this.publicState,
      test,
    ));
  }

  /**
   * Returns the total number of broadcast state changes.
   *
   * @returns State-change counter.
   */
  getTotalStateChanges(): number {
    return this.stateChangeIdRef.value;
  }

  /**
   * Returns the current public model state.
   *
   * @returns Readonly public state.
   */
  getStore(): Readonly<ModelPublicState<Dyn, Static>> {
    return this.publicState;
  }

  /**
   * Subscribes to whole-store updates and immediately emits the current state.
   *
   * @param observerOrNext - Observer object or callback invoked with the current and future states.
   * @returns The RxJS subscription.
   */
  subscribeAndGet(
    observerOrNext?: Partial<Observer<Readonly<ModelPublicState<Dyn, Static>>>> | ((value: Readonly<ModelPublicState<Dyn, Static>>) => void) | undefined | null,
  ): Subscription {
    const subscription = this.subject.subscribe(observerOrNext!);

    if (!subscription.closed) {
      if ((observerOrNext as Partial<Observer<Readonly<ModelPublicState<Dyn, Static>>>>)?.next != undefined) {
        (observerOrNext as Partial<Observer<Readonly<ModelPublicState<Dyn, Static>>>>).next!(this.publicState);
      } else if (typeof observerOrNext === "function") {
        observerOrNext(this.publicState);
      }
    }

    return subscription;
  }

  /**
   * Subscribes to future whole-store updates.
   *
   * Unlike `subscribeAndGet`, this method does not immediately emit the current state.
   *
   * @param observerOrNext - Observer object or callback invoked with future states.
   * @returns The RxJS subscription.
   */
  subscribe(
    observerOrNext?: Partial<Observer<Readonly<ModelPublicState<Dyn, Static>>>> | ((value: Readonly<ModelPublicState<Dyn, Static>>) => void) | undefined | null,
  ): Subscription {
    return this.subject.subscribe(observerOrNext!);
  }

  private broadcastChanges(): void {
    if (this.updated) {
      this.broadcasting = true;

      try {
        this.updated = false;
        this.stateChangeIdRef.value++;
        this.subject.next(this.publicState);

        for (const prop of Object.values(this.store.dyn)) {
          prop.broadcast();
        }
      } finally {
        this.broadcasting = false;
      }
    }
  }

  private handleDefer<R extends ModelAction<ModelPublicState<Dyn, Static>, OperatorDefs> | void>(promise: () => Promise<R> | R): void {
    queueMicrotask(async () => {
      try {
        const result = await promise();

        if (result !== undefined) {
          this.present(result);
        }
      } catch (e) {
        console.error("[EasySam] Unhandled deferred action error", e);
      }
    });
  }

  private handleSetPublic<P extends ModelPublicState<Dyn, Static>["dyn"][StoreKey<ModelPublicState<Dyn, Static>>]>(
    prop: P, value: NoInferValue<PropValue<P>>,
  ): void {
    (prop as unknown as StoreProperty<PropValue<P>>).set(value);
    this.updated = true;
  }

  private handleMutatePublic<P extends ModelPublicState<Dyn, Static>["dyn"][StoreKey<ModelPublicState<Dyn, Static>>]>(
    prop: P, mutator: (actual: NoInferValue<PropValue<P>>) => boolean,
  ): void {
    if ((prop as unknown as StoreProperty<PropValue<P>>).mutate(mutator)) {
      this.updated = true;
    }
  }
}

function eventFilterOp<SourceValue, Store extends PublicStore, OutputStore extends PublicStore>(
  stateChangeIdRef: StateIdChangeRef, publicStore: Readonly<Store>, test?: (store: OutputStore) => boolean,
): OperatorFunction<SourceValue, OutputStore> {
  return (source) =>
    new Observable<OutputStore>((subscriber) => {
      let lastSentStateChangeId: number | undefined;

      return source.subscribe({
        next() {
          if (lastSentStateChangeId !== stateChangeIdRef.value) {
            lastSentStateChangeId = stateChangeIdRef.value;
            const selectedStore = publicStore as unknown as OutputStore;

            if (!test || test(selectedStore)) {
              subscriber.next(selectedStore);
            }
          }
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
}

/**
 * Narrows a bound action to a bound proposal action.
 *
 * @typeParam S - Public store type.
 * @param action - Bound action to test.
 * @returns `true` when the action is a proposal action.
 */
export function isProposalAction<S extends PublicStore>(action: BoundAction<S>): action is BoundProposalAction<S> {
  return action.type === ActionType.PROPOSAL;
}

/**
 * Narrows a bound action to a bound mutating action.
 *
 * @typeParam S - Public store type.
 * @param action - Bound action to test.
 * @returns `true` when the action is a mutating action.
 */
export function isMutateAction<S extends PublicStore>(action: BoundAction<S>): action is BoundMutateAction {
  return action.type === ActionType.MUTATE;
}