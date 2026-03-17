import { Observer, Subject, Subscription } from "rxjs"

export interface StorePropertyBase<T> {
  hasChanged: () => boolean
  get: () => T extends {} | [] ? Readonly<T> : T;
}

export class StoreProperty<T> extends Subject<T> implements StorePropertyBase<T> {
  private changed = false

  constructor(private currentVal: T) {
    super();
  }
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
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    return super.subscribe(observerOrNext!);
  }
  hasChanged() {
    return this.changed
  }
  get() {
    return this.currentVal as (T extends {} | [] ? Readonly<T> : T);
  }
  // Support functional style programming
  mutate(mutator: (actual: T) => boolean): boolean {
    if (mutator(this.currentVal)) {
      this.changed = true;
      return true;
    }
    return false;
  }
  set(value: T) {
    this.currentVal = value
    this.changed = true
  }
  broadcast() {
    if (this.changed) {
      this.changed = false;
      super.next(this.currentVal);
    }
  }
}

type PublicStore = Readonly<{ static?: Readonly<any>, dyn: Readonly<{ [Prop: string]: StorePropertyBase<any> }> }>

export class Model<Actions, T extends PublicStore> {

  constructor(
    publicStore: T,
    actionLogic: (
      action: Actions,
      state: T,
      async: (promise: () => Promise<Actions | void>) => void,
      set: <P>(prop: StoreProperty<P>, value: P) => void,
      mutate: <P>(prop: StoreProperty<P>, mutator: (actual: P) => boolean) => void
    ) => void,
    stateLogic?: (
      state: T,
      async: (promise: () => Promise<Actions | void>) => void,
      set: <P>(prop: StoreProperty<P>, value: P) => void,
      mutate: <P>(prop: StoreProperty<P>, mutator: (actual: P) => boolean) => void
    ) => STLogicReturn | void
  ) {
    this.publicStore = publicStore;
    this.actionLogic = actionLogic;
    this.stateLogic = stateLogic;
  }
  private subject = new Subject<T>();
  private updated = false;
  //Store that contains viewable data
  private publicStore: T
  //Must be set to true if the model is mutated
  //Accept or reject publicStore mutations and mutate the stores, must return true on rejection
  private actionLogic: (
    action: Actions,
    state: T,
    async: (promise: () => Promise<Actions | void>) => void,
    set: <P>(prop: StoreProperty<P>, value: P) => void,
    mutate: <P>(prop: StoreProperty<P>, mutator: (actual: P) => boolean) => void
  ) => void
  //Procedure to mutate the store following SAM principles
  present(action: Actions): void {
    this.actionLogic(action, this.publicStore, this.handleAsync.bind(this), this.handleSet.bind(this), this.handleMutate.bind(this));
    this.broadcastChanges();
    if (this.stateLogic) {
      while (this.stateLogic(this.publicStore, this.handleAsync.bind(this), this.handleSet.bind(this), this.handleMutate.bind(this)) === STLogicReturn.RUN_AGAIN) {
        this.broadcastChanges();
      }
      this.broadcastChanges();
    }
  }

  getStore() {
    return this.publicStore as Readonly<T>
  }
  subscribeAndGet(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    const subscription = this.subject.subscribe(observerOrNext!);
    if (!subscription.closed) {
      if ((observerOrNext as Partial<Observer<T>>)?.next != undefined) {
        (observerOrNext as Partial<Observer<T>>).next!(this.publicStore);
      } else if (typeof observerOrNext === "function") {
        observerOrNext(this.publicStore);
      }
    }
    return subscription;
  }
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    return this.subject.subscribe(observerOrNext!);
  }
  //Broadcast changes on store properties to observers
  private broadcastChanges() {
    if (this.updated) {
      this.updated = false;
      this.subject.next(this.publicStore);
      for (let prop of Object.values(this.publicStore.dyn)) {
        (prop as StoreProperty<any>).broadcast();
      }
    }
  }
  private async handleAsync(promise: () => Promise<Actions | void>): Promise<void> {
    const result = await promise();

    if (result !== undefined) {
      this.present(result);
    }
  }
  private handleSet<P>(prop: StoreProperty<P>, value: P): void {
    prop.set(value);
    this.updated = true;
  }
  private handleMutate<P>(prop: StoreProperty<P>, mutator: (actual: P) => boolean): void {
    if (prop.mutate(mutator)) {
      this.updated = true;
    }
  }
  //Determine next action based on current state
  private stateLogic: ((
    state: T,
    async: (promise: () => Promise<any>) => void,
    set: <P>(prop: StoreProperty<P>, value: P) => void,
    mutate: <P>(prop: StoreProperty<P>, mutator: (actual: P) => boolean) => void
  ) => STLogicReturn | void) | undefined;
}

export enum STLogicReturn {
  RUN_AGAIN = 1,
  DONE = 2
}
