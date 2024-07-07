import { Observer, Subject, Subscription } from "rxjs";
export interface StorePropertyBase<T> {
    changed: boolean;
    get: () => T extends {} | [] ? Readonly<T> : T;
    subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
    silentSubscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
}
export declare class StoreProperty<T> extends Subject<T> implements StorePropertyBase<T> {
    currentVal: T;
    changed: boolean;
    constructor(value: T);
    subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
    silentSubscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | undefined | null): Subscription;
    set(value: T): void;
    broadcast(): void;
    mutate(mutator: (actual: T) => boolean): void;
    get(): T extends {} | [] ? Readonly<T> : T;
}
declare type PublicStore = Readonly<{
    static: Readonly<any>;
    dyn: Readonly<{
        [Prop: string]: StorePropertyBase<any>;
    }>;
}>;
export declare class Model<Actions, T extends PublicStore> {
    constructor(publicStore: T, actionLogic: (action: Actions, state: T) => void, stateLogic: (state: T) => void, broadcast: (dyn: T["dyn"]) => void);
    private publicStore;
    private actionLogic;
    present(action: Actions): void;
    getStore(): Readonly<T>;
    private broadcastChanges;
    private stateLogic;
}
export {};
