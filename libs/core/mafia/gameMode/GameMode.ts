import { Job, GameMode as GameModeInterface } from "../types/JobTypes";

/**
 * 게임 모드 설정
 */
export interface GameModeConfig {
  /** 게임 모드 ID */
  id: string;
  
  /** 게임 모드 이름 */
  name: string;
  
  /** 게임 모드 설명 */
  description: string;
  
  /** 직업 ID 목록 */
  jobIds: string[];
  
  /** 최소 인원 */
  minPlayers: number;
  
  /** 최대 인원 */
  maxPlayers: number;
}

/**
 * 게임 모드 클래스
 * 마피아 게임의 모드를 정의합니다. (클래식, 확장, 커스텀 등)
 */
export class GameMode implements GameModeInterface {
  public id: string;
  public name: string;
  public description: string;
  public jobIds: string[];
  public minPlayers: number;
  public maxPlayers: number;
  private jobs: Job[] = [];

  constructor(config: GameModeConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.jobIds = config.jobIds;
    this.minPlayers = config.minPlayers;
    this.maxPlayers = config.maxPlayers;
  }

  /**
   * 게임 모드 ID 반환
   */
  public getId(): string {
    return this.id;
  }

  /**
   * 게임 모드 이름 반환
   */
  public getName(): string {
    return this.name;
  }

  /**
   * 게임 모드 설명 반환
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * 최소 인원 반환
   */
  public getMinPlayers(): number {
    return this.minPlayers;
  }

  /**
   * 최대 인원 반환
   */
  public getMaxPlayers(): number {
    return this.maxPlayers;
  }

  /**
   * 직업 목록 설정
   */
  public setJobs(jobs: Job[]): void {
    this.jobs = jobs;
  }

  /**
   * 직업 목록 반환
   */
  public getJobs(): Job[] {
    return this.jobs;
  }

  /**
   * JSON 변환
   */
  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      jobIds: this.jobIds
    };
  }
} 