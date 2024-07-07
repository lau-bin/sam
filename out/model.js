import { Subject } from "rxjs";
export class StoreProperty extends Subject {
    currentVal;
    changed = false;
    constructor(value) {
        super();
        this.currentVal = value;
    }
    subscribe(observerOrNext) {
        const subscription = super.subscribe(observerOrNext);
        !subscription.closed && observerOrNext?.next != undefined && observerOrNext.next(this.currentVal);
        return subscription;
    }
    silentSubscribe(observerOrNext) {
        return super.subscribe(observerOrNext);
    }
    set(value) {
        this.currentVal = value;
        this.changed = true;
    }
    broadcast() {
        if (this.changed == true) {
            this.changed = false;
            this.next(this.currentVal);
        }
    }
    // Support fucntional style programming
    mutate(mutator) {
        if (mutator(this.currentVal)) {
            this.changed = true;
        }
    }
    get() {
        return this.currentVal;
    }
}
export class Model {
    constructor(publicStore, actionLogic, stateLogic, broadcast) {
        this.publicStore = publicStore;
        this.actionLogic = actionLogic;
        this.stateLogic = stateLogic;
        this.broadcastChanges = broadcast;
    }
    //Store that contains viewable data
    publicStore;
    //Must be set to true if the model is mutated
    //Accept or reject publicStore mutations and mutate the stores, must return true on rejection
    actionLogic;
    //Procedure to mutate the store following SAM principles
    present(action) {
        this.actionLogic(action, this.publicStore);
        while (this.stateLogic(this.publicStore)) {
            this.broadcastChanges(this.publicStore.dyn);
        }
        this.broadcastChanges(this.publicStore.dyn);
    }
    getStore() {
        return this.publicStore;
    }
    //Broadcast changes on store properties to observers
    broadcastChanges;
    //Determine next action based on current state
    stateLogic;
}
//# sourceMappingURL=model.js.map