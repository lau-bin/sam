import { NextObserver, Observable, PartialObserver, Subject, Subscription, OperatorFunction, take } from "rxjs"


class StoreProperty<T>{
  value: T
  private changed: boolean = false
  private subject = new Subject<T>()

  constructor(value: T) {
    this.value = value
  }

  subscribe(next: PartialObserver<T>) {
    return this.subject.subscribe(next);
  }
  subscribeAndGetCurrent(next: NextObserver<T>): Subscription {
    (next as NextObserver<T>).next(this.value);
    return this.subject.subscribe(next);
  }

  set(value: T) {
    this.value = value
    this.changed = true
  }
  broadcast() {
    if (this.changed == true) {
      this.subject.next(this.value)
      this.changed = false
    }
  }
  didChange() {
    return this.changed;
  }

  // rxjs pipe overloading
  pipe<T, A>(fn1: OperatorFunction<T, A>): StorePropertyPiped<T>;
  pipe<T, A, B>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>): StorePropertyPiped<T>;
  pipe<T, A, B, C>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>): StorePropertyPiped<T>;
  pipe<T, A, B, C, D>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>,
    fn9: OperatorFunction<H, I>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>,
    fn9: OperatorFunction<H, I>,
    ...fns: OperatorFunction<any, any>[]
  ): StorePropertyPiped<T>;

  pipe(...operations: any) {
    let obs = this.subject.pipe<T>(operations)
    return new StorePropertyPiped<T>(obs, this)
  }
}

class StorePropertyPiped<T>{

  private obs: Observable<T>
  private prop: StoreProperty<T>
  constructor(obs: Observable<T>, prop: StoreProperty<T>) {
    this.obs = obs
    this.prop = prop
  }

  subscribe(next: PartialObserver<T>) {
    return this.prop.subscribe(next);
  }
  subscribeAndGetCurrent(next: NextObserver<T>): Subscription {
    return this.prop.subscribeAndGetCurrent(next);
  }

  // rxjs pipe overloading
  pipe<T, A>(fn1: OperatorFunction<T, A>): StorePropertyPiped<T>;
  pipe<T, A, B>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>): StorePropertyPiped<T>;
  pipe<T, A, B, C>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>): StorePropertyPiped<T>;
  pipe<T, A, B, C, D>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>,
    fn9: OperatorFunction<H, I>
  ): StorePropertyPiped<T>;
  pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>,
    fn7: OperatorFunction<F, G>,
    fn8: OperatorFunction<G, H>,
    fn9: OperatorFunction<H, I>,
    ...fns: OperatorFunction<any, any>[]
  ): StorePropertyPiped<T>;

  pipe(...operations: any) {
    this.obs = this.obs.pipe<T>(operations)
    return this
  }
}

type extractGeneric<Type> = Type extends StoreProperty<infer X> ? X : never

export abstract class BaseModel<ExT> {
  //Store that contains viewable data
  abstract publicStore: { [Prop: string]: StoreProperty<any> }
  //Private store for private data
  abstract privateStore: { [Prop: string]: any }
  private stateChangedEmiter = new Subject<void>()
  //Must be set to true if the model is mutated
  protected stateDidChange = { value: false }
  //Accept or reject publicStore mutations and mutate the stores, must return true on rejection
  abstract presentLogic(store?: { [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]> }, ext?: ExT): void
  //Procedure to mutate the store following SAM principles
  present(store?: { [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]> }, ext?: ExT): true | undefined {
    this.presentLogic(store, ext)
    return this.processState()
  }
  protected processState() {
    if (this.stateDidChange.value) {
      //Set flag back to false
      this.stateDidChange.value = false
      //Broadcast changed values
      this.broadcastProcedure()
      //Compute next action
      this.nextAction()
    } else {
      return true
    }
  }
  getStore() {
    return this.publicStore as unknown as { [Prop in keyof this["publicStore"]]: StoreProperty<extractGeneric<this["publicStore"][Prop]>> }
  }
  //Broadcast changes on store properties to observers
  abstract broadcastChangedProps(): void
  private broadcastProcedure() {
    this.broadcastChangedProps()
    this.stateChangedEmiter.next()
  }
  //Determine next action based on current state
  abstract nextAction(): void

  //Will emit when the model finished a mutation after all values emited its change
  subscribeToStateChanges(subs: PartialObserver<unknown>) {
    this.stateChangedEmiter.subscribe(subs)
  }
  //Used to initialize store properties
  protected createProperty<T>(value: T) {
    return new StoreProperty<T>(value)
  }
}

export type PublicStoreValues<T extends BaseModel<any>> = { [Prop in keyof T["publicStore"]]?: extractGeneric<T["publicStore"][Prop]> }


function BuildClosedModel<T extends BaseModel<any>>(model: T): ClosedModel < T > {
  return new ClosedModelImpl(model);
}
class ClosedModelImpl<T extends BaseModel<any>> {
  private model: T;
  public present: any;

  public sub<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>) {
    return (this.model.publicStore as T["publicStore"])[name].subscribe(subs)
  }
  public subNGet<G extends keyof T["publicStore"]>(name: G, subs: NextObserver<T["publicStore"][G]>) {
    return (this.model.publicStore as T["publicStore"])[name].subscribeAndGetCurrent(subs)
  }
  public getVal<G extends keyof T["publicStore"]>(name: G) {
    return (this.model.publicStore as T["publicStore"])[name].value as extractGeneric<T["publicStore"][G]>
  }
  constructor(model: T) {
    this.present = model.present;
    this.model = model;
    this.present = this.present.bind(model);
  }
}
export interface ClosedModel<T extends BaseModel<any>> {
  present: T["present"]
  sub: ClosedModelImpl<T>["sub"]
  subNGet: ClosedModelImpl<T>["subNGet"]
  getVal: ClosedModelImpl<T>["getVal"]
}