// 마피아 게임의 직업 타입과 데이터를 정의합니다.

// 직업 ID enum
export enum JobId {
  MAFIA = "mafia",
  POLICE = "police",
  DOCTOR = "doctor",
  CITIZEN = "citizen",
  SPY = "spy",
  MEDIUM = "medium",
  SOLDIER = "soldier",
  POLITICIAN = "politician",
  LOVER = "lover",
  JOURNALIST = "journalist",
  WEREWOLF = "werewolf",
  GANGSTER = "gangster",
  DETECTIVE = "detective",
  GRAVEDIGGER = "gravedigger",
  TERRORIST = "terrorist",
  MADAM = "madam"
}

// 직업 소속 팀 타입
export enum JobTeam {
  MAFIA = "MAFIA",
  CITIZEN = "CITIZEN",
  NEUTRAL = "NEUTRAL"
}

// 직업 능력 타입
export enum JobAbilityType {
  KILL = "처형", // 플레이어 제거
  INVESTIGATE = "수색", // 플레이어 정보 조사
  PROTECT = "치료", // 플레이어 보호
  CONTACT = "접선", // 다른 플레이어와 접촉
  LISTEN = "도청", // 대화 엿듣기
  ARMOR = "방탄", // 공격 방어
  IMMUNITY = "처세", // 투표 면역
  CHAT = "연애", // 특별 채팅
  ANNOUNCE = "특종", // 정보 공개
  CONVERT = "갈망", // 플레이어 전환
  BLOCK = "공갈", // 투표 방해
  TRACK = "추리", // 능력 사용 추적
  COPY = "도굴", // 능력 복사
  SUICIDE = "산화"  // 자폭
}

// 직업 인터페이스
export interface Job {
  id: JobId;           // 직업 고유 ID (enum으로 변경)
  name: string;         // 직업 이름
  team: JobTeam;        // 소속 팀
  description: string;  // 직업 설명
  abilityType: JobAbilityType; // 능력 타입
  abilityDescription: string;  // 능력 설명
  icon?: string;        // 직업 아이콘 (이모지 또는 이미지 경로)
  nightAbility: boolean; // 밤에 능력 사용 가능 여부
  dayAbility: boolean;   // 낮에 능력 사용 가능 여부
  usesPerGame?: number;  // 게임당 사용 가능 횟수 (undefined면 무제한)
  targetType: "player" | "none" | "multiple"; // 능력 대상 타입
  targetCount?: number;  // 대상 선택 가능 수 (targetType이 multiple일 때만 사용)
}

// 게임 모드 인터페이스
export interface GameModeConfig {
  id: string;           // 모드 고유 ID
  name: string;         // 모드 이름
  description: string;  // 모드 설명
  jobIds: JobId[];     // 이 모드에서 사용할 직업 ID 목록 (enum으로 변경)
  minPlayers: number;   // 최소 플레이어 수
  maxPlayers: number;   // 최대 플레이어 수
}

// 직업 데이터
export const JOBS: Job[] = [
  {
    id: JobId.MAFIA,
    name: "마피아",
    team: JobTeam.MAFIA,
    description: "밤에 시민을 제거하는 마피아입니다.",
    abilityType: JobAbilityType.KILL,
    abilityDescription: "밤마다 한명의 플레이어를 죽일 수 있다.",
    icon: "🔪",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.POLICE,
    name: "경찰",
    team: JobTeam.CITIZEN,
    description: "플레이어의 마피아 여부를 조사합니다.",
    abilityType: JobAbilityType.INVESTIGATE,
    abilityDescription: "밤이되면 플레이어 한 명을 선택해 마피아 여부를 알아낼 수 있다.",
    icon: "🔍",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.DOCTOR,
    name: "의사",
    team: JobTeam.CITIZEN,
    description: "플레이어를 마피아의 공격으로부터 보호합니다.",
    abilityType: JobAbilityType.PROTECT,
    abilityDescription: "밤이되면 플레이어 한 명을 마피아의 공격으로부터 치료한다.",
    icon: "💉",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.SPY,
    name: "스파이",
    team: JobTeam.MAFIA,
    description: "마피아 팀의 정보원입니다.",
    abilityType: JobAbilityType.CONTACT,
    abilityDescription: "[첩보] 밤마다 플레이어 한 명을 선택하여 직업을 알아낼 수 있다. 마피아와 접선할 경우, 한 번 더 능력을 사용할 수 있다.",
    icon: "🕵️",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.MEDIUM,
    name: "영매",
    team: JobTeam.CITIZEN,
    description: "죽은 플레이어들의 대화를 들을 수 있습니다.",
    abilityType: JobAbilityType.LISTEN,
    abilityDescription: "죽은 자들의 대화를 들을 수 있다.",
    icon: "👻",
    nightAbility: true,
    dayAbility: true,
    targetType: "none"
  },
  {
    id: JobId.SOLDIER,
    name: "군인",
    team: JobTeam.CITIZEN,
    description: "마피아의 공격을 한 번 방어할 수 있습니다.",
    abilityType: JobAbilityType.ARMOR,
    abilityDescription: "마피아의 공격을 한 차례 버텨낼 수 있다.",
    icon: "🪖",
    nightAbility: false,
    dayAbility: false,
    targetType: "none",
    usesPerGame: 1
  },
  {
    id: JobId.POLITICIAN,
    name: "정치인",
    team: JobTeam.CITIZEN,
    description: "투표로 처형되지 않습니다.",
    abilityType: JobAbilityType.IMMUNITY,
    abilityDescription: "플레이어 간 투표를 통해 처형당하지 않는다.",
    icon: "🗣️",
    nightAbility: false,
    dayAbility: false,
    targetType: "none"
  },
  {
    id: JobId.LOVER,
    name: "연인",
    team: JobTeam.CITIZEN,
    description: "밤에 다른 연인과 대화할 수 있습니다.",
    abilityType: JobAbilityType.CHAT,
    abilityDescription: "밤만 되면 둘만의 대화가 가능하다.",
    icon: "❤️",
    nightAbility: true,
    dayAbility: false,
    targetType: "none"
  },
  {
    id: JobId.JOURNALIST,
    name: "기자",
    team: JobTeam.CITIZEN,
    description: "플레이어의 직업을 조사하여 공개합니다.",
    abilityType: JobAbilityType.ANNOUNCE,
    abilityDescription: "밤에 한 명의 플레이어의 직업을 조사하여 다음 날 아침 모든 플레이어에게 해당 사실을 알린다.",
    icon: "📰",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.WEREWOLF,
    name: "짐승인간",
    team: JobTeam.MAFIA,
    description: "마피아가 모두 사망하면 능력이 활성화됩니다.",
    abilityType: JobAbilityType.CONVERT,
    abilityDescription: "밤에 선택한 플레이어가 마피아에게 살해당할 경우 마피아에게 길들여지며, 이후 마피아가 모두 사망하면 밤마다 플레이어를 제거할 수 있다.",
    icon: "🐺",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.GANGSTER,
    name: "건달",
    team: JobTeam.CITIZEN,
    description: "플레이어의 투표를 방해합니다.",
    abilityType: JobAbilityType.BLOCK,
    abilityDescription: "밤마다 한 명을 선택하여, 다음날 투표시 해당 플레이어가 투표를 하지 못하도록 만든다.",
    icon: "👊",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.DETECTIVE,
    name: "사립탐정",
    team: JobTeam.CITIZEN,
    description: "플레이어의 능력 사용을 추적합니다.",
    abilityType: JobAbilityType.TRACK,
    abilityDescription: "밤마다 플레이어 한 명을 조사하여 해당 플레이어가 누구에게 능력을 사용하였는지 알아낼 수 있다.",
    icon: "🕵️‍♂️",
    nightAbility: true,
    dayAbility: false,
    targetType: "player"
  },
  {
    id: JobId.GRAVEDIGGER,
    name: "도굴꾼",
    team: JobTeam.CITIZEN,
    description: "첫날 마피아에게 살해당한 플레이어의 직업을 얻습니다.",
    abilityType: JobAbilityType.COPY,
    abilityDescription: "첫날 마피아에게 살해당한 플레이어의 직업을 얻는다.",
    icon: "⚰️",
    nightAbility: false,
    dayAbility: false,
    targetType: "none"
  },
  {
    id: JobId.TERRORIST,
    name: "테러리스트",
    team: JobTeam.CITIZEN,
    description: "처형될 때 다른 플레이어를 함께 처형합니다.",
    abilityType: JobAbilityType.SUICIDE,
    abilityDescription: "투표로 인해 처형될 때, 플레이어 한 명을 선택하여 같이 처형될 수 있다.",
    icon: "💣",
    nightAbility: false,
    dayAbility: false,
    targetType: "player",
    usesPerGame: 1
  },
  {
    id: JobId.MADAM,
    name: "마담",
    team: JobTeam.MAFIA,
    description: "마피아와 접촉하여 대화할 수 있습니다.",
    abilityType: JobAbilityType.CONTACT,
    abilityDescription: "[유혹] VOTE 시간에 투표한 플레이어를 유혹하여 직업의 고유 능력을 사용하지 못하도록 한다. 마피아를 유혹할 경우 접선한다.",
    icon: "💋",
    nightAbility: false,
    dayAbility: true,
    targetType: "player"
  },
  {
    id: JobId.CITIZEN,
    name: "시민",
    team: JobTeam.CITIZEN,
    description: "특별한 능력이 없는 일반 시민입니다.",
    abilityType: JobAbilityType.INVESTIGATE,
    abilityDescription: "특별한 능력이 없습니다.",
    icon: "👤",
    nightAbility: false,
    dayAbility: false,
    targetType: "none"
  }
];

// 게임 모드 데이터
export const GAME_MODES: GameModeConfig[] = [
  {
    id: "classic",
    name: "클래식 모드",
    description: "기본적인 마피아 게임 모드입니다.",
    jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.CITIZEN],
    minPlayers: 4,
    maxPlayers: 8
  },
  {
    id: "extended",
    name: "확장 모드",
    description: "다양한 직업이 추가된 확장 모드입니다.",
    jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.SPY, JobId.MEDIUM, JobId.SOLDIER, JobId.POLITICIAN, JobId.JOURNALIST],
    minPlayers: 6,
    maxPlayers: 12
  },
  {
    id: "chaos",
    name: "카오스 모드",
    description: "모든 직업이 등장하는 혼돈의 모드입니다.",
    jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.SPY, JobId.MEDIUM, JobId.SOLDIER, JobId.POLITICIAN, JobId.LOVER, JobId.JOURNALIST, JobId.WEREWOLF, JobId.GANGSTER, JobId.DETECTIVE, JobId.GRAVEDIGGER, JobId.TERRORIST, JobId.MADAM],
    minPlayers: 8,
    maxPlayers: 15
  }
];

// 직업 ID로 직업 정보 가져오기
export function getJobById(jobId: JobId): Job | undefined {
  return JOBS.find(job => job.id === jobId);
}

// 게임 모드 ID로 게임 모드 정보 가져오기
export function getGameModeConfigById(modeId: string): GameModeConfig | undefined {
  return GAME_MODES.find(mode => mode.id === modeId);
}

// 게임 모드에 따른 직업 목록 가져오기
export function getJobsByGameMode(modeId: string): Job[] {
  const gameMode = getGameModeConfigById(modeId);
  if (!gameMode) return [];
  
  return gameMode.jobIds.map(jobId => {
    const job = getJobById(jobId);
    return job ? job : null;
  }).filter(job => job !== null) as Job[];
}

// 직업 유형 분류 (시민 특수직업, 마피아 보조직업 등)
export enum JobCategory {
  BASIC_CITIZEN = "BASIC_CITIZEN", // 일반 시민
  SPECIAL_CITIZEN = "SPECIAL_CITIZEN", // 경찰, 의사를 제외한 시민팀 특수 직업
  POLICE = "POLICE", // 경찰
  DOCTOR = "DOCTOR", // 의사
  BASIC_MAFIA = "BASIC_MAFIA", // 일반 마피아
  SUPPORT_MAFIA = "SUPPORT_MAFIA", // 마피아 보조직업
}

// 직업을 카테고리별로 분류
export function categorizeJobs(jobs: Job[]): Record<JobCategory, Job[]> {
  const categories: Record<JobCategory, Job[]> = {
    [JobCategory.BASIC_CITIZEN]: [],
    [JobCategory.SPECIAL_CITIZEN]: [],
    [JobCategory.POLICE]: [],
    [JobCategory.DOCTOR]: [],
    [JobCategory.BASIC_MAFIA]: [],
    [JobCategory.SUPPORT_MAFIA]: [],
  };
  
  jobs.forEach(job => {
    if (job.id === JobId.POLICE) {
      categories[JobCategory.POLICE].push(job);
    } else if (job.id === JobId.DOCTOR) {
      categories[JobCategory.DOCTOR].push(job);
    } else if (job.id === JobId.CITIZEN) {
      categories[JobCategory.BASIC_CITIZEN].push(job);
    } else if (job.id === JobId.MAFIA) {
      categories[JobCategory.BASIC_MAFIA].push(job);
    } else if (job.team === JobTeam.CITIZEN) {
      categories[JobCategory.SPECIAL_CITIZEN].push(job);
    } else if (job.team === JobTeam.MAFIA) {
      categories[JobCategory.SUPPORT_MAFIA].push(job);
    }
  });
  
  return categories;
}

// 플레이어 수에 따라 필요한 시민 특수직업 수 계산
export function getSpecialCitizenCount(playerCount: number): number {
  if (playerCount <= 4) return 1;
  if (playerCount <= 6) return 2;
  if (playerCount <= 9) return 3;
  return 4; // 10~12명
}

// 플레이어 수에 따라 필요한 마피아 보조직업 수 계산
export function getSupportMafiaCount(playerCount: number): number {
  return playerCount >= 6 ? 1 : 0;
}

// 플레이어 수에 따라 역할 배분 (규칙에 맞게)
export function distributeJobsByPlayerCount(modeId: string, playerCount: number): Job[] {
  const allJobs = getJobsByGameMode(modeId);
  const categorizedJobs = categorizeJobs(allJobs);
  
  // 결과 배열 (선택된 직업들)
  const selectedJobs: Job[] = [];
  
  // 1. 항상 경찰 추가
  if (categorizedJobs[JobCategory.POLICE].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.POLICE][0]);
  }
  
  // 2. 항상 의사 추가
  if (categorizedJobs[JobCategory.DOCTOR].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.DOCTOR][0]);
  }
  
  // 3. 기본 마피아 추가
  if (categorizedJobs[JobCategory.BASIC_MAFIA].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.BASIC_MAFIA][0]);
  }
  
  // 4. 시민 특수직업 추가
  const specialCitizenCount = getSpecialCitizenCount(playerCount);
  const availableSpecialCitizens = [...categorizedJobs[JobCategory.SPECIAL_CITIZEN]];
  for (let i = 0; i < specialCitizenCount && availableSpecialCitizens.length > 0; i++) {
    // 무작위로 선택
    const randomIndex = Math.floor(Math.random() * availableSpecialCitizens.length);
    selectedJobs.push(availableSpecialCitizens[randomIndex]);
    availableSpecialCitizens.splice(randomIndex, 1);
  }
  
  // 5. 마피아 보조직업 추가
  const supportMafiaCount = getSupportMafiaCount(playerCount);
  const availableSupportMafia = [...categorizedJobs[JobCategory.SUPPORT_MAFIA]];
  for (let i = 0; i < supportMafiaCount && availableSupportMafia.length > 0; i++) {
    // 무작위로 선택
    const randomIndex = Math.floor(Math.random() * availableSupportMafia.length);
    selectedJobs.push(availableSupportMafia[randomIndex]);
    availableSupportMafia.splice(randomIndex, 1);
  }
  
  // 6. 남은 자리는 일반 시민으로 채우기
  const remainingSlots = playerCount - selectedJobs.length;
  for (let i = 0; i < remainingSlots; i++) {
    if (categorizedJobs[JobCategory.BASIC_CITIZEN].length > 0) {
      selectedJobs.push(categorizedJobs[JobCategory.BASIC_CITIZEN][0]);
    }
  }
  
  // 7. 직업 배열 섞기 (랜덤하게 배분하기 위해)
  return shuffleArray(selectedJobs);
}

// 배열을 랜덤하게 섞는 함수
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
} 