import { GameMode, GameModeConfig } from "./GameMode";
import { GAME_MODES, getGameModeById, getJobsByGameMode } from "../types/JobTypes";

/**
 * 기존 게임 모드 정보를 사용하여 GameMode 클래스 생성
 */
export function createDefaultGameModes(): GameMode[] {
  const modes: GameMode[] = [];
  
  // 기존 JobTypes의 게임 모드 설정을 활용
  GAME_MODES.forEach(modeData => {
    const modeConfig: GameModeConfig = {
      id: modeData.id,
      name: modeData.name,
      description: modeData.description,
      jobIds: modeData.jobIds,
      minPlayers: modeData.minPlayers,
      maxPlayers: modeData.maxPlayers
    };
    
    const gameMode = new GameMode(modeConfig);
    
    // 직업 정보 설정
    const jobs = getJobsByGameMode(modeData.id);
    if (jobs.length > 0) {
      gameMode.setJobs(jobs);
    }
    
    modes.push(gameMode);
  });
  
  return modes;
} 