import { Subject } from "rxjs";
class StoreProperty {
    value;
    changed = false;
    subject = new Subject();
    constructor(value) {
        this.value = value;
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
    pipe(...operations) {
        let obs = this.subject.pipe(operations);
        return new StorePropertyPiped(obs, this);
    }
}
class StorePropertyPiped {
    obs;
    prop;
    constructor(obs, prop) {
        this.obs = obs;
        this.prop = prop;
    }
    subscribe(next) {
        return this.prop.subscribe(next);
    }
    subscribeAndGetCurrent(next) {
        return this.prop.subscribeAndGetCurrent(next);
    }
    pipe(...operations) {
        this.obs = this.obs.pipe(operations);
        return this;
    }
}
export class BaseModel {
    stateChangedEmiter = new Subject();
    //Must be set to true if the model is mutated
    stateDidChange = { value: false };
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
        return new StoreProperty(value);
    }
}
function BuildClosedModel(model) {
    return new ClosedModelImpl(model);
}
class ClosedModelImpl {
    model;
    present;
    sub(name, subs) {
        return this.model.publicStore[name].subscribe(subs);
    }
    subNGet(name, subs) {
        return this.model.publicStore[name].subscribeAndGetCurrent(subs);
    }
    getVal(name) {
        return this.model.publicStore[name].value;
    }
    constructor(model) {
        this.present = model.present;
        this.model = model;
        this.present = this.present.bind(model);
    }
}
//# sourceMappingURL=oldModel.js.map