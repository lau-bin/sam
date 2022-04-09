import { NextObserver, PartialObserver, Subject, Subscription } from "rxjs"


class StorePropertyImpl<T> implements StoreProperty<T>{
  value: T
  private changed: boolean = false
  private subject = new Subject<T>()
  private changedCallback: {value: boolean};

  constructor(value: T, didChange: {value: boolean}) {
    this.value = value
    this.changedCallback = didChange;
  }

  subscribe(next: PartialObserver<T>){
    return this.subject.subscribe(next);
  } 
  subscribeAndGetCurrent(next: PartialObserver<T>): Subscription{
    (next as NextObserver<T>).next(this.value);
    return this.subject.subscribe(next);
  } 
  set(value: T) {
    Object.freeze(value)
    this.value = value
    this.changed = true
    this.changedCallback.value = true
  }
  broadcast(){
    if (this.changed == true) {
      this.subject.next(this.value)
      this.changed = false
    }
  }
  didChange(){
    return this.changed;
  }

}

type extractGeneric<Type> = Type extends StorePropertyImpl<infer X> ? X : never
export interface StoreProperty<T> {
  subscribe: StorePropertyImpl<T>["subscribe"]
  value: StorePropertyImpl<T>["value"]
}
export abstract class BaseModel<ExT> {
  //Store that contains viewable data
  abstract publicStore: { [Prop: string]: StorePropertyImpl<any> }
  //Private store for private data
  abstract privateStore: { [Prop: string]: any }
  protected _closedModel: ClosedModel<this> | undefined
  get closedModel(): ClosedModel<this>{
    if (this._closedModel){
      return this._closedModel
    }
    else{
      return BuildClosedModel(this)
    }
  }
  private stateChangedEmiter = new Subject<void>()
  //Must be set to true if the model is mutated
  protected stateDidChange = {value: false}
  //Accept or reject publicStore mutations and mutate the stores, must return true on rejection
  abstract presentLogic(store?: { [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]> }, ext?:ExT): void
  //Procedure to mutate the store following SAM principles
  present(store?: { [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]> }, ext?:ExT): true | undefined {
    this.presentLogic(store, ext)
    return this.processState()
  }
  processState(){
    if (this.stateDidChange.value) {
      //Set flag back to false
      this.stateDidChange.value = false
      //Broadcast changed values
      this.broadcastProcedure()
      //Compute next action
      this.nextAction()
    }else{
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
  subscribeToStateChanges(subs:PartialObserver<unknown>){
    this.stateChangedEmiter.subscribe(subs)
  }
  //Used to initialize store properties
  protected createProperty<T>(value: T){
    return new StorePropertyImpl<T>(value, this.stateDidChange)
  }
}

export type PublicStoreValues<T extends BaseModel<any>> = { [Prop in keyof T["publicStore"]]?: extractGeneric<T["publicStore"][Prop]> }


export function BuildClosedModel<T extends BaseModel<any>>(model: T): ClosedModel<T> {
  return new ClosedModelImpl(model);
}
class ClosedModelImpl<T extends BaseModel<any>> {
  private model: T;
  public present: any;

  public sub<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>) {
    return (this.model.publicStore as T["publicStore"])[name].subscribe(subs)
  }
  public subNGet<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>) {
    return (this.model.publicStore as T["publicStore"])[name].subscribeAndGetCurrent(subs)
  }
  public getVal<G extends keyof T["publicStore"]>(name: G) {
    return (this.model.publicStore as T["publicStore"])[name].value as extractGeneric<T["publicStore"][G]>
  }
  constructor(model: T){
    this.present = model.present;
    this.model = model;
    this.present = this.present.bind(model);
  }
}
export interface ClosedModel<T extends BaseModel<any>>{
  present: T["present"]
  sub: ClosedModelImpl<T>["sub"]
  subNGet: ClosedModelImpl<T>["subNGet"]
  getVal: ClosedModelImpl<T>["getVal"]
}