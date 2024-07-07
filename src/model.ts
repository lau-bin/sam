import { Observer, Subject, Subscription } from "rxjs"

export interface StorePropertyBase<T> {
  changed: boolean;
  get: ()=> T extends {} | [] ? Readonly<T> : T;
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
  silentSubscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
}

export class StoreProperty<T> extends Subject<T> implements StorePropertyBase<T>{
  currentVal: T
  changed = false

  constructor(value: T) {
    super();
    this.currentVal = value;
  }

  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription{
    const subscription = super.subscribe(observerOrNext!);
    !subscription.closed && (observerOrNext as Partial<Observer<T>>)?.next != undefined && (observerOrNext as Partial<Observer<T>>).next!(this.currentVal);
    return subscription;
  }

  silentSubscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription {
    return super.subscribe(observerOrNext!);
  }
  set(value: T) {
    this.currentVal = value
    this.changed = true
  }
  broadcast() {
    if (this.changed == true) {
      this.changed = false
      this.next(this.currentVal)
    }
  }
  // Support fucntional style programming
  mutate(mutator: (actual:T)=>boolean){
    if (mutator(this.currentVal)){
      this.changed = true;
    }
  }
  get() {
    return this.currentVal as (T extends {} | [] ? Readonly<T> : T); 
  }
}

type PublicStore = Readonly<{ static: Readonly<any>, dyn: Readonly<{[Prop: string]: StorePropertyBase<any>}> }>

export class Model<Actions, T extends PublicStore> {

  constructor(
    publicStore: T,
    actionLogic: (action: Actions, state: T)=>void,
    stateLogic: (state: T)=>void,
    broadcast: (dyn: T["dyn"]) => void
    ){
    this.publicStore = publicStore;
    this.actionLogic = actionLogic;
    this.stateLogic = stateLogic;
    this.broadcastChanges = broadcast;
  }
  //Store that contains viewable data
  private publicStore: T
  //Must be set to true if the model is mutated
  //Accept or reject publicStore mutations and mutate the stores, must return true on rejection
  private actionLogic: (action: Actions, state: T) => void
  //Procedure to mutate the store following SAM principles
  present(action: Actions): void {
    this.actionLogic(action, this.publicStore)
    while (this.stateLogic(this.publicStore)){
      this.broadcastChanges(this.publicStore.dyn);
    }
    this.broadcastChanges(this.publicStore.dyn);
  }

  getStore() {
    return this.publicStore as Readonly<T>
  }
  //Broadcast changes on store properties to observers
  private broadcastChanges: (dyn: T["dyn"]) => void
  //Determine next action based on current state
  private stateLogic: (state: T) => any
}
