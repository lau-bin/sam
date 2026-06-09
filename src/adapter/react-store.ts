import { useCallback, useRef } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import type { PartialStore, PropValue, PublicStore, StoreKey } from "../model.js";

/**
 * Represents a disposable subscription returned by model and property observers.
 */
type SubscriptionLike = {
  /**
   * Stops receiving future notifications from the source.
   */
  unsubscribe(): void;
};

/**
 * Minimal observable contract used by the React adapter.
 *
 * @typeParam T - The value emitted by the observable.
 */
type ObservableLike<T> = {
  /**
   * Subscribes to value changes.
   *
   * @param next - Callback invoked when the observable emits.
   * @returns A subscription object that can be used to unsubscribe.
   */
  subscribe(next: (value: T) => void): SubscriptionLike;
};

/**
 * React-facing contract for a SAM model.
 *
 * This adapter intentionally depends on a small structural API: reading the full store, subscribing to full-store changes, subscribing to dynamic
 * partial updates, and reading the total number of state changes.
 *
 * @typeParam S - Public store exposed by the SAM model.
 */
export type SamReactModel<S extends PublicStore> = {
  /**
   * Returns the current public store snapshot.
   *
   * @returns The current readonly store.
   */
  getStore(): Readonly<S>;

  /**
   * Subscribes to whole-store changes.
   *
   * @param next - Callback invoked with the latest readonly store.
   * @returns A subscription object that can be used to unsubscribe.
   */
  subscribe(next: (state: Readonly<S>) => void): SubscriptionLike;

  /**
   * Creates an observable for a selected set of dynamic store properties.
   *
   * @param keys - Dynamic property keys to observe.
   * @returns An observable that emits partial store snapshots for the selected keys.
   */
  partial<Keys extends readonly StoreKey<S>[]>(...keys: Keys): ObservableLike<PartialStore<S, Keys>>;

  /**
   * Creates an observable for a selected set of dynamic store properties and emits only when the supplied predicate passes.
   *
   * @param test - Predicate used by the model to decide whether React should be notified.
   * @param keys - Dynamic property keys to observe.
   * @returns An observable that emits partial store snapshots for the selected keys.
   */
  partialTest<Keys extends readonly StoreKey<S>[]>(test: (props: PartialStore<S, Keys>) => boolean, ...keys: Keys): ObservableLike<PartialStore<S, Keys>>;

  /**
   * Returns the total number of committed state changes observed by the model.
   *
   * @returns A monotonically increasing state-change counter.
   */
  getTotalStateChanges(): number;
};

/**
 * Equality function used to skip React updates when the selected value has not changed.
 *
 * @typeParam T - Selected value type.
 */
type EqualityFn<T> = (a: T, b: T) => boolean;

const identity = <T,>(value: T): T => value;

function useVersionedExternalSelector<Selected>(
  subscribeToSource: (onChange: () => void) => () => void, readSelection: () => Selected, isEqual?: EqualityFn<Selected>,
): Selected {
  const versionRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return subscribeToSource(() => {
        versionRef.current += 1;
        onStoreChange();
      });
    },
    [subscribeToSource],
  );

  const getSnapshot = useCallback(() => versionRef.current, []);

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, () => readSelection(), isEqual);
}

/**
 * Subscribes to the whole model and returns a selected value.
 */
function useSamStoreSelector<S extends PublicStore, Selected>(
  model: SamReactModel<S>,
  selector: (state: Readonly<S>) => Selected,
  isEqual?: EqualityFn<Selected>,
): Selected {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const sub = model.subscribe(() => onChange());
      return () => sub.unsubscribe();
    },
    [model],
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    () => model.getTotalStateChanges(),
    () => model.getTotalStateChanges(),
    () => selector(model.getStore()),
    isEqual,
  );
}

/**
 * Subscribes to one dynamic store property and returns either its value or a selected projection of that value.
 *
 * @typeParam S - Public store exposed by the SAM model.
 * @typeParam K - Dynamic property key to observe.
 * @typeParam Selected - Value returned by the selector.
 * @param model - SAM React model.
 * @param key - Dynamic property key to observe.
 * @param selector - Optional projection from the property value to the returned value.
 * @param isEqual - Optional equality function used to skip React updates.
 * @returns The selected value.
 */
export function useSamPropSelector<S extends PublicStore, K extends StoreKey<S>, Selected = PropValue<S["dyn"][K]>>(
  model: SamReactModel<S>, key: K,
  selector: (value: PropValue<S["dyn"][K]>) => Selected = identity as any,
  isEqual?: EqualityFn<Selected>,
): Selected {
  const prop = model.getStore().dyn[key];

  const subscribeToSource = useCallback(
    (onChange: () => void) => {
      const sub = prop.subscribe(() => onChange());
      return () => sub.unsubscribe();
    },
    [prop],
  );

  return useVersionedExternalSelector(subscribeToSource, () => selector(prop.get() as PropValue<S["dyn"][K]>), isEqual);
}

/**
 * Subscribes to a group of dynamic store properties and returns either the partial store snapshot or a selected projection of it.
 *
 * Pass `keys` as a stable tuple when possible:
 *
 * ```ts
 * const keys = ["firstName", "lastName"] as const;
 * ```
 *
 * @typeParam S - Public store exposed by the SAM model.
 * @typeParam Keys - Dynamic property keys to observe.
 * @typeParam Selected - Value returned by the selector.
 * @param model - SAM React model.
 * @param keys - Dynamic property keys to observe.
 * @param selector - Optional projection from the partial store snapshot to the returned value.
 * @param isEqual - Optional equality function used to skip React updates.
 * @returns The selected value.
 */
export function useSamPartialSelector<S extends PublicStore, Keys extends readonly StoreKey<S>[], Selected = PartialStore<S, Keys>>(
  model: SamReactModel<S>, keys: Keys,
  selector: (state: PartialStore<S, Keys>) => Selected = identity as any,
  isEqual?: EqualityFn<Selected>,
): Selected {
  const keySig = keys.join("\x1f");

  const subscribeToSource = useCallback(
    (onChange: () => void) => {
      const sub = model.partial(...keys).subscribe(() => onChange());
      return () => sub.unsubscribe();
    },
    [model, keySig],
  );

  return useVersionedExternalSelector(subscribeToSource, () => selector(model.getStore() as unknown as PartialStore<S, Keys>), isEqual);
}

/**
 * Subscribes to a group of dynamic store properties and notifies React only when the supplied predicate passes.
 *
 * @typeParam S - Public store exposed by the SAM model.
 * @typeParam Keys - Dynamic property keys to observe.
 * @typeParam Selected - Value returned by the selector.
 * @param model - SAM React model.
 * @param keys - Dynamic property keys to observe.
 * @param test - Predicate used by the model to decide whether React should be notified.
 * @param selector - Optional projection from the partial store snapshot to the returned value.
 * @param isEqual - Optional equality function used to skip React updates.
 * @returns The selected value.
 */
export function useSamPartialTestSelector<S extends PublicStore, Keys extends readonly StoreKey<S>[], Selected = PartialStore<S, Keys>>(
  model: SamReactModel<S>, keys: Keys,
  test: (state: PartialStore<S, Keys>) => boolean,
  selector: (state: PartialStore<S, Keys>) => Selected = identity as any,
  isEqual?: EqualityFn<Selected>,
): Selected {
  const keySig = keys.join("\x1f");

  const subscribeToSource = useCallback(
    (onChange: () => void) => {
      const sub = model.partialTest(test, ...keys).subscribe(() => onChange());
      return () => sub.unsubscribe();
    },
    [model, keySig, test],
  );

  return useVersionedExternalSelector(subscribeToSource, () => selector(model.getStore() as unknown as PartialStore<S, Keys>), isEqual);
}

/**
 * Creates a bound React adapter for a SAM model.
 *
 * Use this when components should call hooks without passing the model every time. The returned hooks preserve the same type inference as the
 * standalone hooks.
 *
 * @typeParam S - Public store exposed by the SAM model.
 * @param model - SAM React model to bind.
 * @returns Bound React hooks for reading the store, one property, partial properties, and predicate-filtered partial properties.
 */
export function createSamReactAdapter<S extends PublicStore>(model: SamReactModel<S>) {
  return {
    /**
     * Subscribes to the whole model and returns a selected value.
     *
     * @typeParam Selected - Value returned by the selector.
     * @param selector - Projection from the readonly store to the returned value.
     * @param isEqual - Optional equality function used to skip React updates.
     * @returns The selected value.
     */
    useStore<Selected>(selector: (state: Readonly<S>) => Selected, isEqual?: EqualityFn<Selected>) {
      return useSamStoreSelector(model, selector, isEqual);
    },

    /**
     * Subscribes to one dynamic store property and returns either its value or a selected projection of that value.
     *
     * @typeParam K - Dynamic property key to observe.
     * @typeParam Selected - Value returned by the selector.
     * @param key - Dynamic property key to observe.
     * @param selector - Optional projection from the property value to the returned value.
     * @param isEqual - Optional equality function used to skip React updates.
     * @returns The selected value.
     */
    useProp<K extends StoreKey<S>, Selected = PropValue<S["dyn"][K]>>(
      key: K,
      selector: (value: PropValue<S["dyn"][K]>) => Selected = identity as any,
      isEqual?: EqualityFn<Selected>,
    ) {
      return useSamPropSelector(model, key, selector, isEqual);
    },

    /**
     * Subscribes to a group of dynamic store properties and returns either the partial store snapshot or a selected projection of it.
     *
     * @typeParam Keys - Dynamic property keys to observe.
     * @typeParam Selected - Value returned by the selector.
     * @param keys - Dynamic property keys to observe.
     * @param selector - Optional projection from the partial store snapshot to the returned value.
     * @param isEqual - Optional equality function used to skip React updates.
     * @returns The selected value.
     */
    usePartial<Keys extends readonly StoreKey<S>[], Selected = PartialStore<S, Keys>>(
      keys: Keys,
      selector: (state: PartialStore<S, Keys>) => Selected = identity as any,
      isEqual?: EqualityFn<Selected>,
    ) {
      return useSamPartialSelector(model, keys, selector, isEqual);
    },

    /**
     * Subscribes to a group of dynamic store properties and notifies React only when the supplied predicate passes.
     *
     * @typeParam Keys - Dynamic property keys to observe.
     * @typeParam Selected - Value returned by the selector.
     * @param keys - Dynamic property keys to observe.
     * @param test - Predicate used by the model to decide whether React should be notified.
     * @param selector - Optional projection from the partial store snapshot to the returned value.
     * @param isEqual - Optional equality function used to skip React updates.
     * @returns The selected value.
     */
    usePartialTest<Keys extends readonly StoreKey<S>[], Selected = PartialStore<S, Keys>>(
      keys: Keys,
      test: (state: PartialStore<S, Keys>) => boolean,
      selector: (state: PartialStore<S, Keys>) => Selected = identity as any,
      isEqual?: EqualityFn<Selected>,
    ) {
      return useSamPartialTestSelector(model, keys, test, selector, isEqual);
    },
  };
}