import { EventEmitter, EventListener } from "../../../utils/EventEmitter";

export abstract class TemplateBase {
	protected eventEmitter: EventEmitter;
	protected eventListener: EventListener;

	constructor() {
		this.eventEmitter = EventEmitter.getInstance();
		this.eventListener = new EventListener();
	}

	protected abstract init(): void;
	protected abstract loadResources(): void;
}
