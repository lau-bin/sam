import { NextObserver, Observable, PartialObserver, Subscription, OperatorFunction } from "rxjs";
declare class StoreProperty<T> {
    value: T;
    private changed;
    private subject;
    constructor(value: T);
    subscribe(next: PartialObserver<T>): Subscription;
    subscribeAndGetCurrent(next: NextObserver<T>): Subscription;
    set(value: T): void;
    broadcast(): void;
    didChange(): boolean;
    pipe<T, A>(fn1: OperatorFunction<T, A>): StorePropertyPiped<T>;
    pipe<T, A, B>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>): StorePropertyPiped<T>;
    pipe<T, A, B, C>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H, I>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>, fn9: OperatorFunction<H, I>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H, I>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>, fn9: OperatorFunction<H, I>, ...fns: OperatorFunction<any, any>[]): StorePropertyPiped<T>;
}
declare class StorePropertyPiped<T> {
    private obs;
    private prop;
    constructor(obs: Observable<T>, prop: StoreProperty<T>);
    subscribe(next: PartialObserver<T>): Subscription;
    subscribeAndGetCurrent(next: NextObserver<T>): Subscription;
    pipe<T, A>(fn1: OperatorFunction<T, A>): StorePropertyPiped<T>;
    pipe<T, A, B>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>): StorePropertyPiped<T>;
    pipe<T, A, B, C>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H, I>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>, fn9: OperatorFunction<H, I>): StorePropertyPiped<T>;
    pipe<T, A, B, C, D, E, F, G, H, I>(fn1: OperatorFunction<T, A>, fn2: OperatorFunction<A, B>, fn3: OperatorFunction<B, C>, fn4: OperatorFunction<C, D>, fn5: OperatorFunction<D, E>, fn6: OperatorFunction<E, F>, fn7: OperatorFunction<F, G>, fn8: OperatorFunction<G, H>, fn9: OperatorFunction<H, I>, ...fns: OperatorFunction<any, any>[]): StorePropertyPiped<T>;
}
declare type extractGeneric<Type> = Type extends StoreProperty<infer X> ? X : never;
export declare abstract class BaseModel<ExT> {
    abstract publicStore: {
        [Prop: string]: StoreProperty<any>;
    };
    abstract privateStore: {
        [Prop: string]: any;
    };
    private stateChangedEmiter;
    protected stateDidChange: {
        value: boolean;
    };
    abstract presentLogic(store?: {
        [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]>;
    }, ext?: ExT): void;
    present(store?: {
        [Prop in keyof this["publicStore"]]?: extractGeneric<this["publicStore"][Prop]>;
    }, ext?: ExT): true | undefined;
    protected processState(): true | undefined;
    getStore(): { [Prop in keyof this["publicStore"]]: StoreProperty<extractGeneric<this["publicStore"][Prop]>>; };
    abstract broadcastChangedProps(): void;
    private broadcastProcedure;
    abstract nextAction(): void;
    subscribeToStateChanges(subs: PartialObserver<unknown>): void;
    protected createProperty<T>(value: T): StoreProperty<T>;
}
export declare type PublicStoreValues<T extends BaseModel<any>> = {
    [Prop in keyof T["publicStore"]]?: extractGeneric<T["publicStore"][Prop]>;
};
declare class ClosedModelImpl<T extends BaseModel<any>> {
    private model;
    present: any;
    sub<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>): Subscription;
    subNGet<G extends keyof T["publicStore"]>(name: G, subs: NextObserver<T["publicStore"][G]>): Subscription;
    getVal<G extends keyof T["publicStore"]>(name: G): extractGeneric<T["publicStore"][G]>;
    constructor(model: T);
}
export interface ClosedModel<T extends BaseModel<any>> {
    present: T["present"];
    sub: ClosedModelImpl<T>["sub"];
    subNGet: ClosedModelImpl<T>["subNGet"];
    getVal: ClosedModelImpl<T>["getVal"];
}
export {};
