import { ScriptPlayer } from "zep-script/src/ScriptPlayer";

type EventHandler<T = any> = (...args: T[]) => void;

export class EventEmitter {
  private static instance: EventEmitter;
  private events: { [key: string]: EventHandler[] };

  private constructor() {
    this.events = {};
  }

  public static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  public on<K extends keyof GameEvents>(event: K, listener: EventHandler): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  public off<K extends keyof GameEvents>(event: K, listener: EventHandler): void {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(
      (l) => l !== listener
    );
  }

  public emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): void {
    if (!this.events[event]) return;

    this.events[event].forEach((listener) => {
      listener(...args);
    });
  }

  public once<K extends keyof GameEvents>(event: K, listener: EventHandler): void {
    const onceListener = (...args: any[]) => {
      listener(...args);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

export class EventListener {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = EventEmitter.getInstance();
  }

  public listen<K extends keyof GameEvents>(event: K, callback: (...args: Parameters<GameEvents[K]>) => void): void {
    this.emitter.on(event, callback);
  }

  public stopListening<K extends keyof GameEvents>(event: K, callback: (...args: Parameters<GameEvents[K]>) => void): void {
    this.emitter.off(event, callback);
  }
}

export enum GameEvent {

}

// GameEvents 타입 정의
export type GameEvents = {

};