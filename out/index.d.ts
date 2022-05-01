import { PartialObserver, Subscription } from "rxjs";
declare class StorePropertyImpl<T> implements StoreProperty<T> {
    value: T;
    private changed;
    private subject;
    private changedCallback;
    constructor(value: T, didChange: {
        value: boolean;
    });
    subscribe(next: PartialObserver<T>): Subscription;
    subscribeAndGetCurrent(next: PartialObserver<T>): Subscription;
    set(value: T): void;
    broadcast(): void;
    didChange(): boolean;
}
declare type extractGeneric<Type> = Type extends StorePropertyImpl<infer X> ? X : never;
export interface StoreProperty<T> {
    subscribe: StorePropertyImpl<T>["subscribe"];
    value: StorePropertyImpl<T>["value"];
}
export declare abstract class BaseModel<ExT> {
    abstract publicStore: {
        [Prop: string]: StorePropertyImpl<any>;
    };
    abstract privateStore: {
        [Prop: string]: any;
    };
    protected _closedModel: ClosedModel<this> | undefined;
    get closedModel(): ClosedModel<this>;
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
    protected createProperty<T>(value: T): StorePropertyImpl<T>;
}
export declare type PublicStoreValues<T extends BaseModel<any>> = {
    [Prop in keyof T["publicStore"]]?: extractGeneric<T["publicStore"][Prop]>;
};
export declare function BuildClosedModel<T extends BaseModel<any>>(model: T): ClosedModel<T>;
declare class ClosedModelImpl<T extends BaseModel<any>> {
    private model;
    present: any;
    sub<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>): Subscription;
    subNGet<G extends keyof T["publicStore"]>(name: G, subs: PartialObserver<extractGeneric<T["publicStore"][G]>>): Subscription;
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
