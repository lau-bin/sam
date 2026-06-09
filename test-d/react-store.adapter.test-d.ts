import { expectAssignable, expectType } from "tsd";

import type { PartialStore, Property, PublicStore } from "../dist/index.js";
import { createSamReactAdapter, useSamPartialSelector, useSamPartialTestSelector, useSamPropSelector, type SamReactModel } from "../dist/adapter/react-store.js";

interface TestStore extends PublicStore {
  dyn: {
    firstName: Property<string>;
    age: Property<number>;
    active: Property<boolean>;
  };
}

declare const model: SamReactModel<TestStore>;

const partialKeys = ["firstName", "age"] as const;

expectType<Readonly<TestStore>>(model.getStore());
expectType<number>(model.getTotalStateChanges());

expectAssignable<{ unsubscribe(): void }>(
  model.subscribe((state) => {
    expectType<Readonly<TestStore>>(state);
  }),
);

expectAssignable<{
  subscribe(next: (value: PartialStore<TestStore, typeof partialKeys>) => void): { unsubscribe(): void };
}>(model.partial(...partialKeys));

expectAssignable<{
  subscribe(next: (value: PartialStore<TestStore, typeof partialKeys>) => void): { unsubscribe(): void };
}>(
  model.partialTest((state) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(state);
    return true;
  }, ...partialKeys),
);

expectType<string>(useSamPropSelector(model, "firstName"));
expectType<number>(useSamPropSelector(model, "age"));
expectType<boolean>(useSamPropSelector(model, "active"));

expectType<number>(useSamPropSelector(model, "firstName", (value) => value.length));
expectType<string>(useSamPropSelector(model, "age", (value) => value.toFixed(0)));
expectType<"yes" | "no">(useSamPropSelector(model, "active", (value) => (value ? "yes" : "no")));

useSamPropSelector(model, "firstName", (value) => value.toUpperCase(), (a, b) => {
  expectType<string>(a);
  expectType<string>(b);
  return a === b;
});

// @ts-expect-error Unknown dynamic property keys are rejected.
useSamPropSelector(model, "missing");

// @ts-expect-error The selector receives the property value type for the selected key.
useSamPropSelector(model, "firstName", (value: number) => value);

expectType<PartialStore<TestStore, typeof partialKeys>>(useSamPartialSelector(model, partialKeys));

expectType<number>(
  useSamPartialSelector(model, partialKeys, (state) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(state);
    return 1;
  }),
);

useSamPartialSelector(
  model,
  partialKeys,
  (state) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(state);
    return state;
  },
  (a, b) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(a);
    expectType<PartialStore<TestStore, typeof partialKeys>>(b);
    return a === b;
  },
);

expectType<PartialStore<TestStore, typeof partialKeys>>(
  useSamPartialTestSelector(
    model,
    partialKeys,
    (state) => {
      expectType<PartialStore<TestStore, typeof partialKeys>>(state);
      return true;
    },
  ),
);

expectType<string>(
  useSamPartialTestSelector(
    model,
    partialKeys,
    (state) => {
      expectType<PartialStore<TestStore, typeof partialKeys>>(state);
      return true;
    },
    (state) => {
      expectType<PartialStore<TestStore, typeof partialKeys>>(state);
      return "selected";
    },
  ),
);

const adapter = createSamReactAdapter(model);

expectType<Property<number>>(
  adapter.useStore((state) => {
    expectType<Readonly<TestStore>>(state);
    return state.dyn.age;
  }),
);

expectType<string>(adapter.useProp("firstName"));
expectType<number>(adapter.useProp("firstName", (value) => value.length));
expectType<PartialStore<TestStore, typeof partialKeys>>(adapter.usePartial(partialKeys));

expectType<boolean>(
  adapter.usePartial(partialKeys, (state) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(state);
    return true;
  }),
);

expectType<PartialStore<TestStore, typeof partialKeys>>(
  adapter.usePartialTest(partialKeys, (state) => {
    expectType<PartialStore<TestStore, typeof partialKeys>>(state);
    return true;
  }),
);

expectType<number>(
  adapter.usePartialTest(
    partialKeys,
    (state) => {
      expectType<PartialStore<TestStore, typeof partialKeys>>(state);
      return true;
    },
    (state) => {
      expectType<PartialStore<TestStore, typeof partialKeys>>(state);
      return 123;
    },
  ),
);

// @ts-expect-error Unknown dynamic property keys are rejected by the bound adapter.
adapter.useProp("missing");

// @ts-expect-error The bound property selector receives the value type for the selected key.
adapter.useProp("active", (value: string) => value);