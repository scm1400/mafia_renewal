import { EventEmitter, EventListener } from "../../utils/EventEmitter";

export class ManagerBase {
    protected eventEmitter: EventEmitter;
    protected eventListener: EventListener;

    constructor() {
        this.eventEmitter = EventEmitter.getInstance();
        this.eventListener = new EventListener();
    }
}