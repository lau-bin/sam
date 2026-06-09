import {
  BoundAction, Model, ModelPublicState, ModelWritableStore, MutateAction, MutateFn, OperatorMap,
  Proposal, ProposalAction, PublicStore, Reaction, Rejection, SetFn, WritableDyn,
} from "./model.js";

/**
 * Minimal structural model shape used by the factory helpers.
 *
 * `Model` instances expose phantom type references for their public state and operator definitions. These references let helpers derive action
 * callback types from an existing model without requiring users to repeat generics.
 */
export type AnyModel = {
  /** Public model state type carried by a model instance. */
  readonly __stateType: PublicStore;

  /** Operator definition type carried by a model instance. */
  readonly __operatorDefsType: OperatorMap<any>;
};

/**
 * Extracts the public state type from a model instance.
 *
 * @typeParam M - Model-like type carrying SAM model phantom type references.
 */
export type ModelState<M extends AnyModel> = M["__stateType"];

/**
 * Extracts the operator definition type from a model instance.
 *
 * @typeParam M - Model-like type carrying SAM model phantom type references.
 */
export type ModelOperatorRefs<M extends AnyModel> = M["__operatorDefsType"];

type MutateActionFn<M extends AnyModel> = ConstructorParameters<typeof MutateAction<ModelState<M>, ModelOperatorRefs<M>>>[0];

type ProposalActionFn<M extends AnyModel> = ConstructorParameters<typeof ProposalAction<ModelState<M>, ModelOperatorRefs<M>>>[0];

/**
 * Creates a mutating action using the state and operator types carried by an existing model type.
 *
 * @typeParam T - Model-like type used to derive the action callback signature.
 * @param fn - Mutating action callback.
 * @param name - Optional action name used for diagnostics or instrumentation.
 * @returns A mutating action typed for the supplied model type.
 */
export function makeMutateAction<T extends AnyModel>(fn: MutateActionFn<T>, name?: string) {
  return new MutateAction<ModelState<T>, ModelOperatorRefs<T>>(fn, name);
}

/**
 * Creates a proposal action using the state and operator types carried by an existing model type.
 *
 * @typeParam T - Model-like type used to derive the action callback signature.
 * @param fn - Proposal action callback.
 * @param name - Optional action name used for diagnostics or instrumentation.
 * @returns A proposal action typed for the supplied model type.
 */
export function makeProposalAction<T extends AnyModel>(fn: ProposalActionFn<T>, name?: string) {
  return new ProposalAction<ModelState<T>, ModelOperatorRefs<T>>(fn, name);
}

type EmptyOps = Record<never, never>;

type MutatingOperatorDef<S extends PublicStore> = (state: Readonly<S>, set: SetFn<S>, mutate: MutateFn<S>, ...args: any[]) => any;

type ProposalOperatorDef<S extends PublicStore> = (state: Readonly<S>, ...args: any[]) => Proposal<S>;

type MutatingOperatorShape<S extends PublicStore> = Record<string, MutatingOperatorDef<S>>;

type ProposalOperatorShape<S extends PublicStore> = Record<string, ProposalOperatorDef<S>>;

type MergeOperatorGroups<MutOps extends object, PropOps extends object> = {
  [K in keyof MutOps | keyof PropOps]: K extends keyof MutOps ? MutOps[K] : K extends keyof PropOps ? PropOps[K] : never;
};

type AsOperatorMap<S extends PublicStore, Ops> = Ops extends OperatorMap<S> ? Ops : never;

type FlatOperators<S extends PublicStore, MutOps extends object, PropOps extends object> = AsOperatorMap<S, MergeOperatorGroups<MutOps, PropOps>>;

type CreateModelOptions<Dyn extends WritableDyn, Static, MutOps extends object, PropOps extends object> = {
  staticState?: Static;

  operators?: {
    mutate?: MutOps & MutatingOperatorShape<ModelPublicState<Dyn, Static>>;
    proposal?: PropOps & ProposalOperatorShape<ModelPublicState<Dyn, Static>>;
  };

  actionLogic?: (action: BoundAction<ModelPublicState<Dyn, Static>>, state: ModelWritableStore<Dyn, Static>) => Rejection | undefined;

  reactionLogic?: Reaction<ModelPublicState<Dyn, Static>, FlatOperators<ModelPublicState<Dyn, Static>, MutOps, PropOps>>;
};

/**
 * Creates a model with static state.
 *
 * Mutating and proposal operators may be supplied in separate groups for authoring ergonomics. They are flattened before being passed to the core
 * model while preserving their grouped type inference.
 *
 * @typeParam Dyn - Writable dynamic property map.
 * @typeParam Static - Static state type.
 * @typeParam MutOps - Mutating operator definition map.
 * @typeParam PropOps - Proposal operator definition map.
 * @param dyn - Writable dynamic property map.
 * @param options - Model options, including required static state.
 * @returns A model typed with the supplied dynamic properties, static state, and flattened operators.
 */
export function createModel<const Dyn extends WritableDyn, const Static, const MutOps extends object = EmptyOps, const PropOps extends object = EmptyOps>(
  dyn: Dyn,
  options: CreateModelOptions<Dyn, Static, MutOps, PropOps> & {
    staticState: Static;
  },
): Model<Dyn, Static, FlatOperators<ModelPublicState<Dyn, Static>, MutOps, PropOps>>;

/**
 * Creates a model without static state.
 *
 * Mutating and proposal operators may be supplied in separate groups for authoring ergonomics. They are flattened before being passed to the core
 * model while preserving their grouped type inference.
 *
 * @typeParam Dyn - Writable dynamic property map.
 * @typeParam MutOps - Mutating operator definition map.
 * @typeParam PropOps - Proposal operator definition map.
 * @param dyn - Writable dynamic property map.
 * @param options - Optional model options. `staticState` must be omitted or `undefined`.
 * @returns A model typed with the supplied dynamic properties and flattened operators.
 */
export function createModel<const Dyn extends WritableDyn, const MutOps extends object = EmptyOps, const PropOps extends object = EmptyOps>(
  dyn: Dyn,
  options?: Omit<CreateModelOptions<Dyn, undefined, MutOps, PropOps>, "staticState"> & {
    staticState?: undefined;
  },
): Model<Dyn, undefined, FlatOperators<ModelPublicState<Dyn, undefined>, MutOps, PropOps>>;

export function createModel(
  dyn: WritableDyn,
  options: {
    staticState?: unknown;
    operators?: {
      mutate?: Record<string, unknown>;
      proposal?: Record<string, unknown>;
    };
    actionLogic?: unknown;
    reactionLogic?: unknown;
  } = {},
) {
  const { operators, ...modelOptions } = options;

  return new Model(dyn, {
    ...modelOptions,
    operators: {
      ...(operators?.mutate ?? {}),
      ...(operators?.proposal ?? {}),
    },
  } as any);
}