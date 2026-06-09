import { expectAssignable, expectError, expectType } from "tsd";
import type { Observable, Subscription } from "rxjs";

import {
  ActionError,
  ActionType,
  BoundAction,
  BoundMutateAction,
  BoundMutateOperators,
  BoundOperators,
  BoundProposalAction,
  BoundProposalOperators,
  DeferFn,
  Model,
  ModelAction,
  ModelPublicState,
  ModelWritableStore,
  MutateAction,
  MutateFn,
  PartialStore,
  PropValue,
  Property,
  Proposal,
  ProposalAction,
  ReentrantPresentError,
  Rejection,
  SetFn,
  StoreKey,
  StoreProp,
  StoreProperty,
  WritableStore,
  isMutateAction,
  isProposalAction,
} from "../dist/index.js";

type TestStatic = {
  readonly appName: string;
};

type TestDyn = {
  firstName: StoreProperty<string>;
  age: StoreProperty<number>;
  active: StoreProperty<boolean>;
  profile: StoreProperty<{
    name: string;
    age: number;
  }>;
  tags: StoreProperty<string[]>;
};

type TestState = ModelPublicState<TestDyn, TestStatic>;

type TestOperators = {
  rename(state: Readonly<TestState>, suffix: string): {
    firstName: string;
  };

  activate(state: Readonly<TestState>, active: boolean): {
    active: boolean;
  };

  invalidProposal(state: Readonly<TestState>): {
    missing: string;
  };

  readAge(state: Readonly<TestState>): number;

  setAge(state: Readonly<TestState>, set: SetFn<TestState>, mutate: MutateFn<TestState>, value: number): void;

  updateProfileName(state: Readonly<TestState>, set: SetFn<TestState>, mutate: MutateFn<TestState>, name: string): boolean;
};

declare const model: Model<TestDyn, TestStatic, TestOperators>;
declare const state: Readonly<TestState>;

const stringProperty = new StoreProperty("Lau");
const numberProperty = new StoreProperty(42);
const objectProperty = new StoreProperty({ name: "Lau", age: 42 });
const arrayProperty = new StoreProperty(["a", "b"]);

expectAssignable<Property<string>>(stringProperty);
expectAssignable<Property<number>>(numberProperty);

expectType<string>(stringProperty.get());
expectType<number>(numberProperty.get());
expectType<Readonly<{ name: string; age: number }>>(objectProperty.get());
expectType<readonly string[]>(arrayProperty.get());

expectType<boolean>(stringProperty.hasChanged());
expectType<void>(stringProperty.set("Michi"));
expectType<boolean>(
  objectProperty.mutate((actual) => {
    actual.name = "Michi";
    return true;
  }),
);
expectType<void>(stringProperty.broadcast());

expectType<Subscription>(
  stringProperty.subscribe((value) => {
    expectType<string>(value);
  }),
);

expectType<Subscription>(
  stringProperty.subscribeAndGet({
    next(value) {
      expectType<string>(value);
    },
  }),
);

expectType<Readonly<TestStatic> | undefined>(state.static);
expectType<Property<string>>(state.dyn.firstName);
expectType<Property<number>>(state.dyn.age);
expectType<Property<boolean>>(state.dyn.active);

expectType<string>(state.dyn.firstName.get());
expectType<number>(state.dyn.age.get());
expectType<boolean>(state.dyn.active.get());
expectType<Readonly<{ name: string; age: number }>>(state.dyn.profile.get());

expectType<string>({} as PropValue<TestState["dyn"]["firstName"]>);
expectType<number>({} as PropValue<TestState["dyn"]["age"]>);
expectType<boolean>({} as PropValue<TestState["dyn"]["active"]>);

expectType<"firstName" | "age" | "active" | "profile" | "tags">({} as StoreKey<TestState>);
expectAssignable<StoreProp<TestState>>(state.dyn.firstName);
expectAssignable<StoreProp<TestState>>(state.dyn.age);

expectAssignable<WritableStore<TestState>>({} as ModelWritableStore<TestDyn, TestStatic>);

const partialKeys = ["firstName", "age"] as const;

expectType<PartialStore<TestState, typeof partialKeys>>({} as PartialStore<TestState, typeof partialKeys>);
expectType<Readonly<TestStatic> | undefined>(({} as PartialStore<TestState, typeof partialKeys>).static);
expectType<Readonly<Pick<TestState["dyn"], "firstName" | "age">>>(({} as PartialStore<TestState, typeof partialKeys>).dyn);

expectAssignable<Proposal<TestState>>({
  firstName: "Lau",
  age: 42,
  active: true,
});

expectError<Proposal<TestState>>({
  firstName: 123,
});

expectError<Proposal<TestState>>({
  missing: "nope",
});

declare const boundMutateOperators: BoundMutateOperators<TestOperators, TestState>;
declare const boundProposalOperators: BoundProposalOperators<TestState, TestOperators>;
declare const boundOperators: BoundOperators<TestOperators, TestState>;

expectType<void>(boundMutateOperators.setAge(42));
expectType<boolean>(boundMutateOperators.updateProfileName("Michi"));
expectError(boundMutateOperators.rename("x"));
expectError(boundMutateOperators.readAge());

expectType<{ firstName: string }>(boundProposalOperators.rename("!"));
expectType<{ active: boolean }>(boundProposalOperators.activate(true));
expectError(boundProposalOperators.setAge(42));
expectError(boundProposalOperators.readAge());
expectError(boundProposalOperators.invalidProposal());

expectType<void>(boundOperators.setAge(42));
expectType<boolean>(boundOperators.updateProfileName("Michi"));
expectError(boundOperators.rename("x"));

expectType<Readonly<TestState>>(model.getStore());
expectType<number>(model.getTotalStateChanges());

expectType<Subscription>(
  model.subscribe((nextState) => {
    expectType<Readonly<TestState>>(nextState);
  }),
);

expectType<Subscription>(
  model.subscribeAndGet({
    next(nextState) {
      expectType<Readonly<TestState>>(nextState);
    },
  }),
);

expectType<Observable<PartialStore<TestState, typeof partialKeys>>>(model.partial(...partialKeys));

expectType<Observable<PartialStore<TestState, typeof partialKeys>>>(
  model.partialTest((props) => {
    expectType<PartialStore<TestState, typeof partialKeys>>(props);
    return true;
  }, ...partialKeys),
);

const proposalAction = new ProposalAction<TestState, TestOperators>((nextState, defer, operators) => {
  expectType<Readonly<TestState>>(nextState);
  expectType<DeferFn<TestState, TestOperators>>(defer);
  expectType<{ firstName: string }>(operators.rename("!"));
  expectType<{ active: boolean }>(operators.activate(true));
  expectError(operators.setAge(42));

  return {
    firstName: "Michi",
  };
}, "rename");

expectType<typeof ActionType.PROPOSAL>(proposalAction.type);
expectType<string | undefined>(proposalAction.name);
expectType<Proposal<TestState> | undefined>(proposalAction.run(state, () => undefined, boundProposalOperators));

const mutateAction = new MutateAction<TestState, TestOperators>((nextState, defer, set, mutate, operators) => {
  expectType<Readonly<TestState>>(nextState);
  expectType<DeferFn<TestState, TestOperators>>(defer);

  set(nextState.dyn.age, 42);
  set(nextState.dyn.firstName, "Michi");
  expectError(set(nextState.dyn.age, "42"));
  expectError(set(nextState.dyn.firstName, 42));

  mutate(nextState.dyn.profile, (actual) => {
    actual.name = "Michi";
    return true;
  });

  expectError(
    mutate(nextState.dyn.profile, (actual: string) => {
      return actual.length > 0;
    }),
  );

  expectType<void>(operators.setAge(42));
  expectType<boolean>(operators.updateProfileName("Michi"));
  expectError(operators.rename("!"));
}, "mutate");

expectType<typeof ActionType.MUTATE>(mutateAction.type);
expectType<string | undefined>(mutateAction.name);
expectType<void>(mutateAction.run(state, () => undefined, (() => undefined) as SetFn<TestState>, (() => undefined) as MutateFn<TestState>, boundMutateOperators));

expectType<Promise<Error | Rejection | undefined>>(model.present(proposalAction));
expectType<Promise<Error | Rejection | undefined>>(model.present(mutateAction));

expectAssignable<ModelAction<TestState, TestOperators>>(proposalAction);
expectAssignable<ModelAction<TestState, TestOperators>>(mutateAction);

expectError(
  new ProposalAction<TestState, TestOperators>(() => {
    return {
      firstName: 123,
    };
  }),
);

const rejection = new Rejection("blocked");
expectType<string | undefined>(rejection.cause);

const actionError = new ActionError(new Error("boom"));
expectType<unknown>(actionError.originalError);
expectType<string>(actionError.message);

const reentrantError = new ReentrantPresentError();
expectType<string>(reentrantError.message);

declare const boundAction: BoundAction<TestState>;

if (isProposalAction(boundAction)) {
  expectType<BoundProposalAction<TestState>>(boundAction);
  expectType<typeof ActionType.PROPOSAL>(boundAction.type);
  expectType<Proposal<TestState> | undefined>(boundAction.run());
}

if (isMutateAction(boundAction)) {
  expectType<BoundMutateAction>(boundAction);
  expectType<typeof ActionType.MUTATE>(boundAction.type);
  expectType<void>(boundAction.run());
}

const createdModel = new Model(
  {
    firstName: new StoreProperty("Lau"),
    age: new StoreProperty(42),
    active: new StoreProperty(true),
    profile: new StoreProperty({ name: "Lau", age: 42 }),
    tags: new StoreProperty(["typescript"]),
  },
  {
    staticState: {
      appName: "EasySam",
    },
    operators: {
      rename(currentState: Readonly<TestState>, suffix: string) {
        expectType<Readonly<TestState>>(currentState);

        return {
          firstName: `${currentState.dyn.firstName.get()}${suffix}`,
        };
      },

      activate(currentState: Readonly<TestState>, active: boolean) {
        expectType<Readonly<TestState>>(currentState);

        return {
          active,
        };
      },

      invalidProposal() {
        return {
          missing: "nope",
        };
      },

      readAge(currentState: Readonly<TestState>) {
        return currentState.dyn.age.get();
      },

      setAge(currentState: Readonly<TestState>, set: SetFn<TestState>, mutate: MutateFn<TestState>, value: number) {
        expectType<Readonly<TestState>>(currentState);
        expectType<MutateFn<TestState>>(mutate);

        set(currentState.dyn.age, value);
      },

      updateProfileName(currentState: Readonly<TestState>, set: SetFn<TestState>, mutate: MutateFn<TestState>, name: string) {
        expectType<Readonly<TestState>>(currentState);
        expectType<SetFn<TestState>>(set);

        mutate(currentState.dyn.profile, (actual) => {
          actual.name = name;
          return true;
        });

        return true;
      },
    },
  },
);

expectType<ModelPublicState<TestDyn, TestStatic>>(createdModel.__stateType);
expectType<Readonly<ModelPublicState<TestDyn, TestStatic>>>(createdModel.getStore());