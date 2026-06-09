import { expectAssignable, expectError, expectType } from "tsd";

import {
  ActionType,
  BoundAction,
  Model,
  ModelPublicState,
  ModelWritableStore,
  MutateAction,
  MutateFn,
  ProposalAction,
  Rejection,
  SetFn,
  StoreProperty,
  AnyModel,
  ModelOperatorRefs,
  ModelState,
  createModel,
  makeMutateAction,
  makeProposalAction
} from "../dist/index.js";

const dyn = {
  firstName: new StoreProperty("Lau"),
  age: new StoreProperty(42),
  active: new StoreProperty(true),
  profile: new StoreProperty({
    name: "Lau",
    age: 42,
  }),
} as const;

const plainModel = createModel(dyn);

expectAssignable<AnyModel>(plainModel);
expectType<ModelPublicState<typeof dyn, undefined>>(plainModel.__stateType);
expectType<undefined>(plainModel.__stateType.static);
expectType<string>(plainModel.__stateType.dyn.firstName.get());
expectType<number>(plainModel.__stateType.dyn.age.get());
expectType<boolean>(plainModel.__stateType.dyn.active.get());
expectType<Readonly<{ name: string; age: number }>>(plainModel.__stateType.dyn.profile.get());

const staticState = {
  appName: "EasySam",
  version: 1,
} as const;

type StaticState = typeof staticState;
type StateWithStatic = ModelPublicState<typeof dyn, StaticState>;

const staticModel = createModel(dyn, {
  staticState,
});

expectAssignable<AnyModel>(staticModel);
expectType<ModelPublicState<typeof dyn, StaticState>>(staticModel.__stateType);
expectType<Readonly<StaticState> | undefined>(staticModel.__stateType.static);

const modelWithLogic = createModel(dyn, {
  actionLogic(action, state) {
    expectType<BoundAction<ModelPublicState<typeof dyn, undefined>>>(action);
    expectType<ModelWritableStore<typeof dyn, undefined>>(state);

    return new Rejection("blocked");
  },
});

expectType<ModelPublicState<typeof dyn, undefined>>(modelWithLogic.__stateType);

const modelWithOperators = createModel(dyn, {
  staticState,
  operators: {
    mutate: {
      setAge(state: Readonly<StateWithStatic>, set: SetFn<StateWithStatic>, mutate: MutateFn<StateWithStatic>, value: number): void {
        expectType<Readonly<StateWithStatic>>(state);
        expectType<MutateFn<StateWithStatic>>(mutate);

        set(state.dyn.age, value);
        expectError(set(state.dyn.age, "42"));
      },

      updateProfileName(state: Readonly<StateWithStatic>, set: SetFn<StateWithStatic>, mutate: MutateFn<StateWithStatic>, name: string): boolean {
        expectType<Readonly<StateWithStatic>>(state);
        expectType<SetFn<StateWithStatic>>(set);

        mutate(state.dyn.profile, (actual) => {
          actual.name = name;
          return true;
        });

        expectError(
          mutate(state.dyn.profile, (actual: string) => {
            return actual.length > 0;
          }),
        );

        return true;
      },
    },

    proposal: {
      rename(state: Readonly<StateWithStatic>, suffix: string) {
        return {
          firstName: `${state.dyn.firstName.get()}${suffix}`,
        };
      },

      activate(state: Readonly<StateWithStatic>, active: boolean) {
        expectType<Readonly<StateWithStatic>>(state);

        return {
          active,
        };
      },
    },
  },

  reactionLogic(state, react) {
    expectType<Readonly<StateWithStatic>>(state);

    expectType<Error | Rejection | undefined>(
      react(
        new ProposalAction<StateWithStatic, ModelOperatorRefs<typeof modelWithOperators>>(() => ({
          active: false,
        })),
      ),
    );
  },
});

expectAssignable<AnyModel>(modelWithOperators);
expectType<ModelPublicState<typeof dyn, StaticState>>(modelWithOperators.__stateType);
expectType<ModelOperatorRefs<typeof modelWithOperators>>(modelWithOperators.__operatorDefsType);

expectAssignable<Model<typeof dyn, StaticState, ModelOperatorRefs<typeof modelWithOperators>>>(modelWithOperators);

const mutateAction = makeMutateAction<typeof modelWithOperators>((state, defer, set, mutate, operators) => {
  expectType<Readonly<ModelState<typeof modelWithOperators>>>(state);
  expectType<void>(defer(async () => undefined));

  set(state.dyn.age, 123);
  set(state.dyn.firstName, "Michi");
  expectError(set(state.dyn.age, "123"));
  expectError(set(state.dyn.firstName, 123));

  mutate(state.dyn.profile, (actual) => {
    actual.name = "Michi";
    return true;
  });

  expectError(
    mutate(state.dyn.profile, (actual: string) => {
      return actual.length > 0;
    }),
  );

  expectType<void>(operators.setAge(42));
  expectType<boolean>(operators.updateProfileName("Michi"));

  expectError(operators.rename("!"));
  expectError(operators.activate(true));
}, "mutate from factory");

expectType<MutateAction<ModelState<typeof modelWithOperators>, ModelOperatorRefs<typeof modelWithOperators>>>(mutateAction);
expectType<typeof ActionType.MUTATE>(mutateAction.type);
expectType<string | undefined>(mutateAction.name);

const proposalAction = makeProposalAction<typeof modelWithOperators>((state, defer, operators) => {
  expectType<Readonly<ModelState<typeof modelWithOperators>>>(state);
  expectType<void>(defer(async () => undefined));

  expectType<{ readonly firstName: string }>(operators.rename("!"));
  expectType<{ readonly active: boolean }>(operators.activate(false));

  expectError(operators.setAge(42));
  expectError(operators.updateProfileName("Michi"));

  return {
    firstName: "Michi",
    active: false,
  };
}, "proposal from factory");

expectType<ProposalAction<ModelState<typeof modelWithOperators>, ModelOperatorRefs<typeof modelWithOperators>>>(proposalAction);
expectType<typeof ActionType.PROPOSAL>(proposalAction.type);
expectType<string | undefined>(proposalAction.name);

expectType<Promise<Error | Rejection | undefined>>(modelWithOperators.present(mutateAction));
expectType<Promise<Error | Rejection | undefined>>(modelWithOperators.present(proposalAction));

expectError(
  makeProposalAction<typeof modelWithOperators>(() => ({
    firstName: 123,
  })),
);

expectError(
  makeMutateAction<typeof modelWithOperators>((state, defer, set) => {
    set(state.dyn.active, "yes");
  }),
);

const noStaticOperatorModel = createModel(dyn, {
  operators: {
    mutate: {
      deactivate(
        state: Readonly<ModelPublicState<typeof dyn, undefined>>,
        set: SetFn<ModelPublicState<typeof dyn, undefined>>,
        mutate: MutateFn<ModelPublicState<typeof dyn, undefined>>,
      ): void {
        expectType<MutateFn<ModelPublicState<typeof dyn, undefined>>>(mutate);

        set(state.dyn.active, false);
      }
    },

    proposal: {
      rename(state: Readonly<ModelPublicState<typeof dyn, undefined>>, name: string) {
        return {
          firstName: name,
        };
      },
    },
  },
});

expectType<ModelPublicState<typeof dyn, undefined>>(noStaticOperatorModel.__stateType);
expectType<undefined>(noStaticOperatorModel.__stateType.static);

const noStaticMutateAction = makeMutateAction<typeof noStaticOperatorModel>((state, defer, set, mutate, operators) => {
  expectType<Readonly<ModelState<typeof noStaticOperatorModel>>>(state);
  expectType<MutateFn<ModelState<typeof noStaticOperatorModel>>>(mutate);

  expectType<void>(operators.deactivate());
  expectError(operators.rename("Lau"));

  set(state.dyn.active, true);
});

expectType<MutateAction<ModelState<typeof noStaticOperatorModel>, ModelOperatorRefs<typeof noStaticOperatorModel>>>(noStaticMutateAction);

const noStaticProposalAction = makeProposalAction<typeof noStaticOperatorModel>((state, defer, operators) => {
  expectType<Readonly<ModelState<typeof noStaticOperatorModel>>>(state);

  expectType<{ readonly firstName: string }>(operators.rename("Michi"));
  expectError(operators.deactivate());

  return {
    firstName: "Michi",
  };
});

expectType<ProposalAction<ModelState<typeof noStaticOperatorModel>, ModelOperatorRefs<typeof noStaticOperatorModel>>>(noStaticProposalAction);

expectError(
  createModel(dyn, {
    operators: {
      proposal: {
        invalid(state: Readonly<ModelPublicState<typeof dyn, undefined>>) {
          return {
            missing: "nope",
          };
        },
      },
    },
  }),
);