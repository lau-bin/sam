import { Subject } from "rxjs";
class StorePropertyImpl {
    constructor(value, didChange) {
        this.changed = false;
        this.subject = new Subject();
        this.value = value;
        this.changedCallback = didChange;
    }
    subscribe(next) {
        return this.subject.subscribe(next);
    }
    subscribeAndGetCurrent(next) {
        next.next(this.value);
        return this.subject.subscribe(next);
    }
    set(value) {
        this.value = value;
        this.changed = true;
        this.changedCallback.value = true;
    }
    broadcast() {
        if (this.changed == true) {
            this.subject.next(this.value);
            this.changed = false;
        }
    }
    didChange() {
        return this.changed;
    }
}
export class BaseModel {
    constructor() {
        this.stateChangedEmiter = new Subject();
        //Must be set to true if the model is mutated
        this.stateDidChange = { value: false };
    }
    get closedModel() {
        if (this._closedModel) {
            return this._closedModel;
        }
        else {
            return BuildClosedModel(this);
        }
    }
    //Procedure to mutate the store following SAM principles
    present(store, ext) {
        this.presentLogic(store, ext);
        return this.processState();
    }
    processState() {
        if (this.stateDidChange.value) {
            //Set flag back to false
            this.stateDidChange.value = false;
            //Broadcast changed values
            this.broadcastProcedure();
            //Compute next action
            this.nextAction();
        }
        else {
            return true;
        }
    }
    getStore() {
        return this.publicStore;
    }
    broadcastProcedure() {
        this.broadcastChangedProps();
        this.stateChangedEmiter.next();
    }
    //Will emit when the model finished a mutation after all values emited its change
    subscribeToStateChanges(subs) {
        this.stateChangedEmiter.subscribe(subs);
    }
    //Used to initialize store properties
    createProperty(value) {
        return new StorePropertyImpl(value, this.stateDidChange);
    }
}
export function BuildClosedModel(model) {
    return new ClosedModelImpl(model);
}
class ClosedModelImpl {
    constructor(model) {
        this.present = model.present;
        this.model = model;
        this.present = this.present.bind(model);
    }
    sub(name, subs) {
        return this.model.publicStore[name].subscribe(subs);
    }
    subNGet(name, subs) {
        return this.model.publicStore[name].subscribeAndGetCurrent(subs);
    }
    getVal(name) {
        return this.model.publicStore[name].value;
    }
}
//# sourceMappingURL=index.js.map