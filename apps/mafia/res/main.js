/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ../../libs/utils/Localizer.ts
const LOCALIZE_KEYS = {};
const LOCALIZE_CONTAINER = {
  ko: null,
  ja: null,
  en: null
};
class Localizer_Localizer {
  static getLanguageCode(player) {
    return player.language === "ko" || player.language === "ja" ? player.language : "en";
  }
  static prepareLocalizationContainer(player) {
    const language = this.getLanguageCode(player);
    if (LOCALIZE_CONTAINER[language] === null) {
      LOCALIZE_CONTAINER[language] = Object.keys(LOCALIZE_KEYS).reduce(this.localizeKey.bind(null, player), {});
    }
  }
  static getLocalizeString(player, key) {
    var _a;
    const language = this.getLanguageCode(player);
    return (_a = LOCALIZE_CONTAINER[language][key]) !== null && _a !== void 0 ? _a : "";
  }
  static getLocalizeContainer(player) {
    const language = this.getLanguageCode(player);
    return LOCALIZE_CONTAINER[language];
  }
  static localizeKey(player, acc, key) {
    acc[key] = player.localize(key);
    return acc;
  }
}
;// ../../libs/utils/Common.ts

let log;
function isDevServer() {
  return App.getServerEnv() !== "live";
}
function parseJsonString(str) {
  if (!str) return false;
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}
function isEmpty(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
function sendConsoleMessage(player, message) {
  const playerId = getPlayerId(player);
  App.runLater(() => {
    if (!getPlayerById(playerId)) return;
  }, 0.5);
}
function getPlayerId(player) {
  var _a;
  return player.isGuest ? (_a = player.tag.guestId) !== null && _a !== void 0 ? _a : player.id : player.id;
}
function getPlayerById(playerId) {
  return App.players.find(player => getPlayerId(player) === playerId);
}
function Common_actionToAllPlayers(action, ...args) {
  for (const player of App.players) {
    if (!player) continue;
    try {
      action(player, ...args);
    } catch (error) {}
  }
}
function getCurrentTimeString() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const kstGap = 9 * 60 * 60 * 1000;
  const today = new Date(utc + kstGap);
  return today.toISOString();
}
function msToTime(player, duration) {
  const milliseconds = parseInt((duration % 1000 / 100).toString(), 10),
    seconds = Math.floor(duration / 1000 % 60),
    minutes = Math.floor(duration / (1000 * 60) % 60);
  const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
  const secondsStr = seconds < 10 ? "0" + seconds : seconds.toString();
  return Localizer.getLocalizeString(player, "game_quiz_builder_dashboard_info_solve_time").replace("((MM))", minutesStr).replace("((SS))", secondsStr);
}
function shuffleAndSplit(arr) {
  const shuffledArr = [...arr];
  for (let i = shuffledArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
  }
  const midIndex = Math.floor(shuffledArr.length / 2);
  const firstHalf = shuffledArr.slice(0, midIndex);
  const secondHalf = shuffledArr.slice(midIndex);
  return [firstHalf, secondHalf];
}
function hexTo0xColor(hex) {
  return parseInt(hex.replace("#", ""), 16);
}
function getLocationAreaCoordinates(locationName) {
  if (!Map.hasLocation(locationName)) return null;
  const locationInfo = Map.getLocationList(locationName)[0];
  const coordinates = [];
  if (locationInfo) {
    for (let x = locationInfo.x; x < locationInfo.x + locationInfo.width; x++) {
      for (let y = locationInfo.y; y < locationInfo.y + locationInfo.height; y++) {
        coordinates.push([x, y]);
      }
    }
  }
  return coordinates;
}
;// ../../libs/core/GameBase.ts
class GameBase {
  constructor() {
    this.onStartCallbacks = [];
    this.onDestroyCallbacks = [];
    this.onJoinPlayerCallbacks = [];
    this.onLeavePlayerCallbacks = [];
    this.onUpdateCallbacks = [];
    this.onTriggerObjectCallbacks = [];
    this.initEventListeners();
  }
  initEventListeners() {
    App.onStart.Add(() => {
      this.onStartCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {}
      });
    });
    App.onJoinPlayer.Add(player => {
      this.onJoinPlayerCallbacks.forEach(callback => {
        try {
          callback(player);
        } catch (error) {}
      });
    });
    App.onLeavePlayer.Add(player => {
      this.onLeavePlayerCallbacks.forEach(callback => {
        try {
          callback(player);
        } catch (error) {}
      });
    });
    App.onUpdate.Add(dt => {
      this.onUpdateCallbacks.forEach(callback => {
        try {
          callback(dt);
        } catch (error) {}
      });
    });
    App.onDestroy.Add(() => {
      this.onDestroyCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {}
      });
    });
    App.onTriggerObject.Add((sender, layerId, x, y, key) => {
      this.onTriggerObjectCallbacks.forEach(callback => {
        try {
          callback(sender, layerId, x, y, key);
        } catch (error) {}
      });
    });
  }
  addOnStartCallback(callback) {
    this.onStartCallbacks.push(callback);
  }
  addOnDestroyCallback(callback) {
    this.onDestroyCallbacks.push(callback);
  }
  addOnJoinPlayerCallback(callback) {
    this.onJoinPlayerCallbacks.push(callback);
  }
  addOnLeavePlayerCallback(callback) {
    this.onLeavePlayerCallbacks.push(callback);
  }
  addOnUpdateCallback(callback) {
    this.onUpdateCallbacks.push(callback);
  }
  addOnTriggerObjectCallback(callback) {
    this.onTriggerObjectCallbacks.push(callback);
  }
}
;// ../../libs/core/mafia/types/JobTypes.ts
var JobId;
(function (JobId) {
  JobId["MAFIA"] = "mafia";
  JobId["POLICE"] = "police";
  JobId["DOCTOR"] = "doctor";
  JobId["CITIZEN"] = "citizen";
  JobId["SPY"] = "spy";
  JobId["MEDIUM"] = "medium";
  JobId["SOLDIER"] = "soldier";
  JobId["POLITICIAN"] = "politician";
  JobId["LOVER"] = "lover";
  JobId["JOURNALIST"] = "journalist";
  JobId["WEREWOLF"] = "werewolf";
  JobId["GANGSTER"] = "gangster";
  JobId["DETECTIVE"] = "detective";
  JobId["GRAVEDIGGER"] = "gravedigger";
  JobId["TERRORIST"] = "terrorist";
  JobId["MADAM"] = "madam";
})(JobId || (JobId = {}));
var JobTeam;
(function (JobTeam) {
  JobTeam["MAFIA"] = "\uB9C8\uD53C\uC544\uD300";
  JobTeam["CITIZEN"] = "\uC2DC\uBBFC\uD300";
  JobTeam["NEUTRAL"] = "\uC911\uB9BD";
})(JobTeam || (JobTeam = {}));
var JobAbilityType;
(function (JobAbilityType) {
  JobAbilityType["KILL"] = "\uCC98\uD615";
  JobAbilityType["INVESTIGATE"] = "\uC218\uC0C9";
  JobAbilityType["PROTECT"] = "\uCE58\uB8CC";
  JobAbilityType["CONTACT"] = "\uC811\uC120";
  JobAbilityType["LISTEN"] = "\uB3C4\uCCAD";
  JobAbilityType["ARMOR"] = "\uBC29\uD0C4";
  JobAbilityType["IMMUNITY"] = "\uCC98\uC138";
  JobAbilityType["CHAT"] = "\uC5F0\uC560";
  JobAbilityType["ANNOUNCE"] = "\uD2B9\uC885";
  JobAbilityType["CONVERT"] = "\uAC08\uB9DD";
  JobAbilityType["BLOCK"] = "\uACF5\uAC08";
  JobAbilityType["TRACK"] = "\uCD94\uB9AC";
  JobAbilityType["COPY"] = "\uB3C4\uAD74";
  JobAbilityType["SUICIDE"] = "\uC0B0\uD654";
})(JobAbilityType || (JobAbilityType = {}));
const JOBS = [{
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
}, {
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
}, {
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
}, {
  id: JobId.SPY,
  name: "스파이",
  team: JobTeam.MAFIA,
  description: "마피아 팀의 정보원입니다.",
  abilityType: JobAbilityType.CONTACT,
  abilityDescription: "접선 전 밤마다 플레이어 한 명을 골라, 마피아인지 확인 할 수 있다.",
  icon: "🕵️",
  nightAbility: true,
  dayAbility: false,
  targetType: "player"
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
  id: JobId.MADAM,
  name: "마담",
  team: JobTeam.MAFIA,
  description: "마피아와 접촉하여 대화할 수 있습니다.",
  abilityType: JobAbilityType.CONTACT,
  abilityDescription: "마피아를 유혹할 경우, 서로의 존재를 알아차리고 밤에 대화할 수 있게 된다.",
  icon: "💋",
  nightAbility: true,
  dayAbility: false,
  targetType: "player"
}, {
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
}];
const GAME_MODES = [{
  id: "classic",
  name: "클래식 모드",
  description: "기본적인 마피아 게임 모드입니다.",
  jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.CITIZEN],
  minPlayers: 4,
  maxPlayers: 8
}, {
  id: "extended",
  name: "확장 모드",
  description: "다양한 직업이 추가된 확장 모드입니다.",
  jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.SPY, JobId.MEDIUM, JobId.SOLDIER, JobId.POLITICIAN, JobId.JOURNALIST],
  minPlayers: 6,
  maxPlayers: 12
}, {
  id: "chaos",
  name: "카오스 모드",
  description: "모든 직업이 등장하는 혼돈의 모드입니다.",
  jobIds: [JobId.MAFIA, JobId.POLICE, JobId.DOCTOR, JobId.SPY, JobId.MEDIUM, JobId.SOLDIER, JobId.POLITICIAN, JobId.LOVER, JobId.JOURNALIST, JobId.WEREWOLF, JobId.GANGSTER, JobId.DETECTIVE, JobId.GRAVEDIGGER, JobId.TERRORIST, JobId.MADAM],
  minPlayers: 8,
  maxPlayers: 15
}];
function getJobById(jobId) {
  return JOBS.find(job => job.id === jobId);
}
function getGameModeById(modeId) {
  return GAME_MODES.find(mode => mode.id === modeId);
}
function getJobsByGameMode(modeId) {
  const gameMode = getGameModeById(modeId);
  if (!gameMode) return [];
  return gameMode.jobIds.map(jobId => {
    const job = getJobById(jobId);
    return job ? job : null;
  }).filter(job => job !== null);
}
;// ../../libs/utils/CustomLabelFunctions.ts

function clearCustomLabel(player = null) {
  if (player) {
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "main"
    });
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "sub"
    });
  } else {
    actionToAllPlayers(player => {
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "main"
      });
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "sub"
      });
    });
  }
}
function showLabel(player, key, options = {}) {
  const mobileLabelPercentWidth = {
    XL: 90,
    L: 80,
    M: 70,
    S: 60
  };
  const tabletLabelPercentWidth = {
    XL: 84,
    L: 68,
    M: 54,
    S: 48
  };
  const pcLabelPercentWidth = {
    XL: 50,
    L: 40,
    M: 28,
    S: 20
  };
  const {
    labelWidth = "M",
    topGapMobile = 10,
    topGapPC = -2,
    backgroundColor = 0x27262e,
    borderRadius = "12px",
    padding = "8px",
    fontOpacity = false,
    labelDisplayTime = 3000,
    texts = []
  } = options;
  const isMobile = player.isMobile && !player.isTablet;
  const isTablet = player.isMobile && player.isTablet;
  const topGap = isMobile ? topGapMobile : topGapPC;
  let labelPercentWidth;
  if (isMobile) {
    labelPercentWidth = mobileLabelPercentWidth[labelWidth];
  } else if (isTablet) {
    labelPercentWidth = tabletLabelPercentWidth[labelWidth];
  } else {
    labelPercentWidth = pcLabelPercentWidth[labelWidth];
  }
  const parentStyle = `
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center;`;
  const defaultTextStyle = {
    fontSize: "18px",
    mobileFontSize: "14px",
    fontWeight: 400,
    color: "white"
  };
  let htmlStr = `<span style="${parentStyle}">`;
  texts.forEach(({
    text,
    style = {}
  }) => {
    if (!text) return;
    const {
      fontSize,
      mobileFontSize,
      fontWeight,
      color
    } = Object.assign(Object.assign({}, defaultTextStyle), style);
    const appliedFontSize = player.isMobile && !player.isTablet ? mobileFontSize || fontSize : fontSize;
    const textStyle = `
        font-size: ${appliedFontSize};
        font-weight: ${fontWeight};
        color: ${color};`;
    htmlStr += `<span style="${textStyle}">${text}</span>`;
  });
  htmlStr += `</span>`;
  const customLabelOption = {
    key: key,
    borderRadius: borderRadius,
    fontOpacity: fontOpacity,
    padding: padding
  };
  player.showCustomLabel(htmlStr, 0xffffff, backgroundColor, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
}
;// ../../libs/core/mafia/managers/gameFlow/GameFlowManager.ts



var GameState;
(function (GameState) {
  GameState["WAITING"] = "WAITING";
  GameState["IN_PROGRESS"] = "IN_PROGRESS";
  GameState["ENDED"] = "ENDED";
})(GameState || (GameState = {}));
var MafiaPhase;
(function (MafiaPhase) {
  MafiaPhase["NIGHT"] = "NIGHT";
  MafiaPhase["DAY"] = "DAY";
  MafiaPhase["VOTING"] = "VOTING";
  MafiaPhase["FINAL_DEFENSE"] = "FINAL_DEFENSE";
  MafiaPhase["APPROVAL_VOTING"] = "APPROVAL_VOTING";
})(MafiaPhase || (MafiaPhase = {}));
const phaseDurations = {
  [MafiaPhase.NIGHT]: 30,
  [MafiaPhase.DAY]: 20,
  [MafiaPhase.VOTING]: 30,
  [MafiaPhase.FINAL_DEFENSE]: 20,
  [MafiaPhase.APPROVAL_VOTING]: 30
};
class GameFlowManager {
  constructor(roomNumber) {
    this.state = GameState.WAITING;
    this.dayCount = 0;
    this.gameMode = "classic";
    this.room = null;
    this.nightActions = [];
    this.voteResults = {};
    this.playerVotes = {};
    this.defenseText = "";
    this.approvalVoteResults = {
      approve: 0,
      reject: 0
    };
    this.approvalPlayerVotes = {};
    this.loverPlayers = [];
    this.deadPlayers = [];
    this.chatMessages = [];
    this.deadChatWidgetShown = {};
    this.roomNumber = roomNumber;
    this.currentPhase = MafiaPhase.DAY;
    this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
    this.phaseTimer = phaseDurations[this.currentPhase];
  }
  showRoomLabel(message, duration = 3000) {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      showLabel(gamePlayer, "room_message", {
        labelWidth: "L",
        labelDisplayTime: duration,
        texts: [{
          text: message
        }]
      });
    });
  }
  sayToRoom(message) {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      showLabel(gamePlayer, "room_chat", {
        labelWidth: "M",
        backgroundColor: 0x000000,
        labelDisplayTime: 4000,
        texts: [{
          text: message
        }]
      });
    });
  }
  setGameRoom(room) {
    this.room = room;
  }
  setGameMode(mode) {
    this.gameMode = mode;
  }
  startGame() {
    if (!this.room) {
      this.sayToRoom("게임 룸이 설정되지 않았습니다.");
      return;
    }
    if (this.room.players.length < 4) {
      this.showRoomLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
      return;
    }
    const playersShuffled = [...this.room.players];
    playersShuffled.sort(() => Math.random() - 0.5);
    const emojis = ["😀", "😎", "🤠", "🧐", "🤓", "😊", "🙂", "��", "😁", "🤩"];
    const availableJobs = this.getAvailableJobs();
    const jobsNeeded = Math.min(playersShuffled.length, availableJobs.length);
    for (let i = 0; i < playersShuffled.length; i++) {
      playersShuffled[i].emoji = emojis[i % emojis.length];
      if (i < jobsNeeded) {
        playersShuffled[i].jobId = availableJobs[i].id;
        if (availableJobs[i].usesPerGame) {
          playersShuffled[i].abilityUses = availableJobs[i].usesPerGame;
        }
      } else {
        playersShuffled[i].jobId = JobId.CITIZEN;
      }
      playersShuffled[i].isAlive = true;
    }
    this.loverPlayers = playersShuffled.filter(p => p.jobId === JobId.LOVER).map(p => p.id);
    this.chatMessages = [];
    this.state = GameState.IN_PROGRESS;
    this.dayCount = 1;
    if (this.room.players.length <= 4) {
      this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING, MafiaPhase.NIGHT];
      this.setPhase(MafiaPhase.DAY);
    } else {
      this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
      this.setPhase(MafiaPhase.NIGHT);
    }
    this.showRoomLabel("게임이 시작되었습니다!");
    this.room.players.forEach(player => {
      const gamePlayer = this.room.getGamePlayer(player.id);
      if (gamePlayer) {
        this.showRoleCard(gamePlayer, player.jobId);
        this.initGameStatusWidgets();
      }
    });
    this.room.players.forEach(player => {
      if (player.jobId === JobId.MEDIUM && player.isAlive) {
        const gamePlayer = getPlayerById(player.id);
        if (gamePlayer) {
          this.showMediumChatWidget(gamePlayer);
        }
      }
    });
    this.executePhaseActions();
  }
  getAvailableJobs() {
    const jobs = getJobsByGameMode(this.gameMode);
    return [...jobs].sort(() => Math.random() - 0.5);
  }
  showRoleCard(player, jobId) {
    const job = getJobById(jobId);
    if (!job) return;
    player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "popup", 300, 400);
    player.tag.widget.roleCard.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    player.tag.widget.roleCard.sendMessage({
      type: "role_info",
      role: job.name,
      team: job.team,
      description: job.description,
      ability: job.abilityDescription,
      icon: job.icon || "❓"
    });
  }
  initGameStatusWidgets() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      if (!gamePlayer.tag.widget) {
        gamePlayer.tag.widget = {};
      }
      gamePlayer.tag.widget.gameStatus = gamePlayer.showWidget("widgets/game_status.html", "middleright", 10, 10);
      gamePlayer.tag.widget.gameStatus.sendMessage({
        type: "init",
        isMobile: gamePlayer.isMobile,
        isTablet: gamePlayer.isTablet
      });
      this.updateGameStatusWidget(gamePlayer, player);
    });
  }
  updateGameStatusWidget(gamePlayer, player) {
    var _a;
    if (!gamePlayer || !gamePlayer.tag.widget.gameStatus) return;
    gamePlayer.tag.widget.gameStatus.sendMessage({
      type: "updateGameStatus",
      phase: this.currentPhase,
      day: this.dayCount,
      players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
      myRole: player.jobId,
      myPlayerId: player.id,
      timeRemaining: this.phaseTimer,
      serverTime: Date.now()
    });
  }
  updateAllGameStatusWidgets() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      this.updateGameStatusWidget(gamePlayer, player);
    });
  }
  nextPhase() {
    if (this.state !== GameState.IN_PROGRESS) {
      this.sayToRoom("게임이 진행 중이 아닙니다.");
      return;
    }
    this.cleanupPhaseWidgets();
    const currentIndex = this.phaseCycle.indexOf(this.currentPhase);
    const nextIndex = (currentIndex + 1) % this.phaseCycle.length;
    if (nextIndex === 0) {
      this.dayCount++;
    }
    this.setPhase(this.phaseCycle[nextIndex]);
    this.sayToRoom(`단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);
    this.updateAllGameStatusWidgets();
    this.executePhaseActions();
  }
  cleanupPhaseWidgets() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      switch (this.currentPhase) {
        case MafiaPhase.NIGHT:
          if (gamePlayer.tag.widget.nightAction) {
            gamePlayer.tag.widget.nightAction.destroy();
            gamePlayer.tag.widget.nightAction = null;
          }
          break;
        case MafiaPhase.VOTING:
          if (gamePlayer.tag.widget.voteWidget) {
            gamePlayer.tag.widget.voteWidget.destroy();
            gamePlayer.tag.widget.voteWidget = null;
          }
          break;
        case MafiaPhase.FINAL_DEFENSE:
          if (gamePlayer.tag.widget.finalDefense) {
            gamePlayer.tag.widget.finalDefense.destroy();
            gamePlayer.tag.widget.finalDefense = null;
          }
          break;
        case MafiaPhase.APPROVAL_VOTING:
          if (gamePlayer.tag.widget.approvalVote) {
            gamePlayer.tag.widget.approvalVote.destroy();
            gamePlayer.tag.widget.approvalVote = null;
          }
          break;
      }
    });
  }
  executePhaseActions() {
    if (!this.room) return;
    switch (this.currentPhase) {
      case MafiaPhase.NIGHT:
        {
          this.sayToRoom(`밤 단계 - 마피아가 희생자를 선택합니다.`);
          this.voteResults = {};
          this.playerVotes = {};
          this.room.actionToRoomPlayers(player => {
            var _a;
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (gamePlayer.tag.widget.approvalVote) {
              gamePlayer.tag.widget.approvalVote.destroy();
              gamePlayer.tag.widget.approvalVote = null;
            }
            if (player.isAlive) {
              gamePlayer.tag.widget.nightAction = gamePlayer.showWidget("widgets/night_action.html", "middle", 0, 0);
              gamePlayer.tag.widget.nightAction.sendMessage({
                type: "init",
                isMobile: gamePlayer.isMobile,
                isTablet: gamePlayer.isTablet
              });
              gamePlayer.tag.widget.nightAction.sendMessage({
                type: "init",
                players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                role: player.jobId.toLowerCase(),
                timeLimit: phaseDurations[MafiaPhase.NIGHT],
                serverTime: Date.now()
              });
              gamePlayer.tag.widget.nightAction.onMessage.Add((player, data) => {
                const mafiaPlayer = player.tag.mafiaPlayer;
                if (!mafiaPlayer) return;
                switch (data.type) {
                  case "kill":
                    if (mafiaPlayer.jobId === JobId.MAFIA) {
                      this.mafiaAction(data.targetId);
                    }
                    break;
                  case "investigate":
                    if (mafiaPlayer.jobId === JobId.POLICE) {
                      this.policeAction(data.targetId, player);
                    }
                    break;
                  case "heal":
                    if (mafiaPlayer.jobId === JobId.DOCTOR) {
                      this.doctorAction(data.targetId);
                    }
                    break;
                  case "contact":
                    if (mafiaPlayer.jobId === JobId.SPY || mafiaPlayer.jobId === JobId.MADAM) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "listen":
                    if (mafiaPlayer.jobId === JobId.MEDIUM) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "announce":
                    if (mafiaPlayer.jobId === JobId.JOURNALIST) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "convert":
                    if (mafiaPlayer.jobId === JobId.WEREWOLF) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "block":
                    if (mafiaPlayer.jobId === JobId.GANGSTER) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "track":
                    if (mafiaPlayer.jobId === JobId.DETECTIVE) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "initChat":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.initLoverChat(player);
                    } else if (data.chatTarget === "dead" && mafiaPlayer.jobId === JobId.MEDIUM) {
                      this.initMediumChat(player);
                    }
                    break;
                  case "chatMessage":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.broadcastLoverMessage(player, data.message);
                    } else if (data.chatTarget === "dead" && mafiaPlayer.jobId === JobId.MEDIUM) {}
                    break;
                  case "close":
                    player.tag.widget.nightAction.destroy();
                    player.tag.widget.nightAction = null;
                    break;
                  default:
                    if (data.targetId) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                }
              });
            }
          });
        }
        break;
      case MafiaPhase.DAY:
        {
          this.evaluateNightActions();
          this.sayToRoom(`낮 단계 - 플레이어들이 토론을 진행합니다.`);
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (gamePlayer.tag.widget.nightAction) {
              gamePlayer.tag.widget.nightAction.destroy();
              gamePlayer.tag.widget.nightAction = null;
            }
            gamePlayer.tag.mafiaPlayer = player;
          });
          this.checkWinCondition();
        }
        break;
      case MafiaPhase.VOTING:
        {
          this.sayToRoom(`투표 단계 - 마피아로 의심되는 플레이어에게 투표하세요.`);
          this.voteResults = {};
          this.playerVotes = {};
          this.room.actionToRoomPlayers(player => {
            var _a;
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (player.isAlive) {
              gamePlayer.tag.widget.voteWidget = gamePlayer.showWidget("widgets/vote_widget.html", "middle", 0, 0);
              gamePlayer.tag.widget.voteWidget.sendMessage({
                type: "init",
                isMobile: gamePlayer.isMobile,
                isTablet: gamePlayer.isTablet
              });
              gamePlayer.tag.widget.voteWidget.sendMessage({
                type: "init",
                players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                timeLimit: phaseDurations[MafiaPhase.VOTING],
                serverTime: Date.now()
              });
              gamePlayer.tag.widget.voteWidget.onMessage.Add((player, data) => {
                if (data.type === "vote") {
                  this.processVote(player.id, data.targetId);
                } else if (data.type === "close") {
                  player.tag.widget.voteWidget.destroy();
                  player.tag.widget.voteWidget = null;
                }
              });
            }
          });
        }
        break;
      case MafiaPhase.FINAL_DEFENSE:
        {
          this.sayToRoom(`최후 변론 단계 - 가장 많은 표를 받은 플레이어가 최후 변론을 합니다.`);
          let maxVotes = 0;
          let defendantId = null;
          let defendantName = "";
          for (const [playerId, votes] of Object.entries(this.voteResults)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              defendantId = playerId;
            }
          }
          const defendant = this.room.players.find(p => p.id === defendantId);
          if (!defendant) {
            this.nextPhase();
            return;
          }
          defendantName = defendant.name;
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) return;
            if (gamePlayer.tag.widget.voteWidget) {
              gamePlayer.tag.widget.voteWidget.destroy();
              gamePlayer.tag.widget.voteWidget = null;
            }
            gamePlayer.tag.widget.finalDefense = gamePlayer.showWidget("widgets/final_defense_widget.html", "middle", 0, 0);
            gamePlayer.tag.widget.finalDefense.sendMessage({
              type: "init",
              isMobile: gamePlayer.isMobile,
              isTablet: gamePlayer.isTablet,
              defendantId: defendantId,
              defendantName: defendantName,
              myPlayerId: player.id,
              timeLimit: phaseDurations[MafiaPhase.FINAL_DEFENSE],
              serverTime: Date.now()
            });
            gamePlayer.tag.widget.finalDefense.onMessage.Add((player, data) => {
              if (data.type === "submitDefense") {
                this.broadcastDefense(data.defense);
              } else if (data.type === "closeDefenseWidget") {
                if (player.tag.widget.finalDefense) {
                  player.tag.widget.finalDefense.destroy();
                  player.tag.widget.finalDefense = null;
                }
              }
            });
          });
          App.runLater(() => {
            this.room.actionToRoomPlayers(player => {
              const gamePlayer = getPlayerById(player.id);
              if (!gamePlayer || !gamePlayer.tag.widget.finalDefense) return;
              gamePlayer.tag.widget.finalDefense.destroy();
              gamePlayer.tag.widget.finalDefense = null;
            });
            if (this.state === GameState.IN_PROGRESS) {
              this.nextPhase();
            }
          }, phaseDurations[MafiaPhase.FINAL_DEFENSE]);
        }
        break;
      case MafiaPhase.APPROVAL_VOTING:
        {
          this.sayToRoom(`찬반 투표 단계 - 최후 변론을 들은 후 처형에 대한 찬반 투표를 진행합니다.`);
          let maxVotes = 0;
          let defendantId = null;
          let defendantName = "";
          for (const [playerId, votes] of Object.entries(this.voteResults)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              defendantId = playerId;
            }
          }
          const defendant = this.room.players.find(p => p.id === defendantId);
          if (!defendant) {
            this.nextPhase();
            return;
          }
          defendantName = defendant.name;
          this.approvalVoteResults = {
            approve: 0,
            reject: 0
          };
          this.approvalPlayerVotes = {};
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) return;
            if (gamePlayer.tag.widget.finalDefense) {
              gamePlayer.tag.widget.finalDefense.destroy();
              gamePlayer.tag.widget.finalDefense = null;
            }
            gamePlayer.tag.widget.approvalVote = gamePlayer.showWidget("widgets/approval_vote_widget.html", "middle", 0, 0);
            gamePlayer.tag.widget.approvalVote.sendMessage({
              type: "init",
              isMobile: gamePlayer.isMobile,
              isTablet: gamePlayer.isTablet,
              defendantId: defendantId,
              defendantName: defendantName,
              myPlayerId: player.id,
              isAlive: player.isAlive,
              defenseText: this.defenseText || "변론이 제출되지 않았습니다.",
              timeLimit: phaseDurations[MafiaPhase.APPROVAL_VOTING],
              serverTime: Date.now()
            });
            gamePlayer.tag.widget.approvalVote.onMessage.Add((player, data) => {
              if (data.type === "submitApprovalVote") {
                this.processApprovalVote(player.id, data.vote);
              } else if (data.type === "closeApprovalVoteWidget") {
                if (player.tag.widget.approvalVote) {
                  player.tag.widget.approvalVote.destroy();
                  player.tag.widget.approvalVote = null;
                }
              }
            });
          });
          App.runLater(() => {
            this.finalizeApprovalVoting();
          }, phaseDurations[MafiaPhase.APPROVAL_VOTING]);
        }
        break;
      default:
        this.sayToRoom(`알 수 없는 단계입니다.`);
    }
    if (this.dayCount == 0) this.dayCount = 1;
  }
  processVote(voterId, targetId) {
    if (this.playerVotes[voterId]) {
      const previousTarget = this.playerVotes[voterId];
      this.voteResults[previousTarget]--;
    }
    this.playerVotes[voterId] = targetId;
    if (!this.voteResults[targetId]) {
      this.voteResults[targetId] = 1;
    } else {
      this.voteResults[targetId]++;
    }
    this.updateVoteResults();
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const votedPlayers = Object.keys(this.playerVotes).length;
    if (votedPlayers >= alivePlayers.length) {
      this.finalizeVoting();
    }
  }
  updateVoteResults() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
      gamePlayer.tag.widget.voteWidget.sendMessage({
        type: "updateVotes",
        votes: this.voteResults
      });
    });
  }
  finalizeVoting() {
    if (!this.room) return;
    let maxVotes = 0;
    let executedPlayerId = null;
    for (const [playerId, votes] of Object.entries(this.voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        executedPlayerId = playerId;
      }
    }
    const tiedPlayers = Object.entries(this.voteResults).filter(([_, votes]) => votes === maxVotes).map(([playerId, _]) => playerId);
    if (tiedPlayers.length > 1) {
      this.sayToRoom(`투표 결과 동률로 처형이 진행되지 않습니다.`);
      return null;
    }
    if (executedPlayerId) {
      const player = this.room.players.find(p => p.id === executedPlayerId);
      if (player) {
        player.isAlive = false;
        if (!this.deadPlayers.includes(executedPlayerId)) {
          this.deadPlayers.push(executedPlayerId);
        }
        this.sayToRoom(`${player.name}님이 마을 투표로 처형되었습니다.`);
        const gamePlayer = getPlayerById(executedPlayerId);
        if (gamePlayer) {
          if (gamePlayer.tag.widget.main) {
            gamePlayer.tag.widget.main.sendMessage({
              type: "player_died",
              message: "당신은 처형되었습니다."
            });
          }
          this.showPermanentDeadChatWidget(gamePlayer);
        }
        return executedPlayerId;
      }
    }
    return null;
  }
  getDeadPlayers() {
    return [...this.deadPlayers];
  }
  showPermanentDeadChatWidget(player) {
    if (this.deadChatWidgetShown[player.id]) return;
    if (player.tag.widget.deadChat) {
      player.tag.widget.deadChat.destroy();
      player.tag.widget.deadChat = null;
    }
    player.tag.widget.deadChat = player.showWidget("widgets/dead_chat_widget.html", "bottomright", 0, 0);
    player.tag.widget.deadChat.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet,
      myPlayerId: player.id,
      myName: player.name,
      myRole: "dead",
      messages: this.chatMessages.filter(msg => msg.target === 'dead')
    });
    player.tag.widget.deadChat.onMessage.Add((player, data) => {
      if (data.type === "deadChatMessage") {
        this.broadcastPermanentDeadMessage(player, data.message);
      } else if (data.type === "hideDeadChat") {
        this.deadChatWidgetShown[player.id] = false;
      } else if (data.type === "showDeadChat") {
        this.deadChatWidgetShown[player.id] = true;
      }
    });
    this.deadChatWidgetShown[player.id] = true;
  }
  showMediumChatWidget(player) {
    if (player.tag.mafiaPlayer.jobId !== JobId.MEDIUM) return;
    if (this.deadChatWidgetShown[player.id]) return;
    if (player.tag.widget.deadChat) {
      player.tag.widget.deadChat.destroy();
      player.tag.widget.deadChat = null;
    }
    player.tag.widget.deadChat = player.showWidget("widgets/dead_chat_widget.html", "bottomright", 0, 0);
    player.tag.widget.deadChat.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet,
      myPlayerId: player.id,
      myName: player.name,
      myRole: "medium",
      messages: this.chatMessages.filter(msg => msg.target === 'dead')
    });
    player.tag.widget.deadChat.onMessage.Add((player, data) => {
      if (data.type === "hideDeadChat") {
        this.deadChatWidgetShown[player.id] = false;
      } else if (data.type === "showDeadChat") {
        this.deadChatWidgetShown[player.id] = true;
      }
    });
    this.deadChatWidgetShown[player.id] = true;
  }
  broadcastPermanentDeadMessage(sender, message) {
    var _a;
    this.chatMessages.push({
      target: 'dead',
      sender: sender.id,
      senderName: sender.name,
      message: message
    });
    (_a = this.room) === null || _a === void 0 ? void 0 : _a.actionToRoomPlayers(player => {
      if (!player.isAlive || this.deadPlayers.includes(player.id)) {
        const deadPlayer = getPlayerById(player.id);
        if (deadPlayer && deadPlayer.tag.widget.deadChat && deadPlayer.id !== sender.id) {
          deadPlayer.tag.widget.deadChat.sendMessage({
            type: "chatMessage",
            senderId: sender.id,
            senderName: sender.name,
            message: message
          });
        }
      } else if (player.jobId === JobId.MEDIUM) {
        const mediumPlayer = getPlayerById(player.id);
        if (mediumPlayer && mediumPlayer.tag.widget.deadChat) {
          mediumPlayer.tag.widget.deadChat.sendMessage({
            type: "chatMessage",
            senderId: sender.id,
            senderName: sender.name,
            message: message
          });
        }
      }
    });
  }
  mafiaAction(targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobId.MAFIA
    });
  }
  doctorAction(targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobId.DOCTOR
    });
  }
  policeAction(targetPlayerId, policePlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobId.POLICE
    });
    const targetPlayer = this.room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;
    const isMafia = targetPlayer.jobId === JobId.MAFIA;
    if (policePlayer.tag.widget.nightAction) {
      policePlayer.tag.widget.nightAction.sendMessage({
        type: "investigationResult",
        isMafia: isMafia
      });
    }
  }
  evaluateNightActions() {
    const killedPlayers = [];
    const protectedPlayers = [];
    const blockedPlayers = [];
    this.nightActions.forEach(action => {
      const job = getJobById(action.jobId);
      if (!job) return;
      if (job.abilityType === JobAbilityType.PROTECT) {
        protectedPlayers.push(action.targetId);
      }
      if (job.abilityType === JobAbilityType.BLOCK) {
        blockedPlayers.push(action.targetId);
      }
    });
    this.nightActions.forEach(action => {
      const job = getJobById(action.jobId);
      if (!job) return;
      if (job.abilityType === JobAbilityType.KILL) {
        const target = this.room.players.find(p => p.id === action.targetId);
        if (!target || !target.isAlive) return;
        if (!protectedPlayers.includes(action.targetId) && !target.isImmune) {
          killedPlayers.push(action.targetId);
        } else if (target.isImmune) {
          target.isImmune = false;
        }
      }
    });
    blockedPlayers.forEach(playerId => {
      const player = this.room.players.find(p => p.id === playerId);
      if (player) {
        player.isBlocked = true;
      }
    });
    killedPlayers.forEach(playerId => {
      const player = this.room.players.find(p => p.id === playerId);
      if (player) {
        player.isAlive = false;
        if (!this.deadPlayers.includes(playerId)) {
          this.deadPlayers.push(playerId);
        }
        this.showRoomLabel(`${player.name}님이 사망했습니다.`);
        const gamePlayer = getPlayerById(playerId);
        if (gamePlayer) {
          if (gamePlayer.tag.widget.main) {
            gamePlayer.tag.widget.main.sendMessage({
              type: "player_died",
              message: "당신은 사망했습니다."
            });
          }
          this.showPermanentDeadChatWidget(gamePlayer);
        }
      }
    });
    this.nightActions = [];
    this.checkWinCondition();
  }
  checkWinCondition() {
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => this.isMafia(p));
    const aliveCitizens = alivePlayers.filter(p => !this.isMafia(p));
    if (aliveMafia.length === 0) {
      this.showGameResult(JobTeam.CITIZEN);
      return true;
    }
    if (aliveMafia.length >= aliveCitizens.length) {
      this.showGameResult(JobTeam.MAFIA);
      return true;
    }
    return false;
  }
  showGameResult(winnerTeam) {
    if (!this.room) return;
    this.state = GameState.ENDED;
    let winMessage = winnerTeam === JobTeam.MAFIA ? "마피아 승리!" : "시민 승리!";
    this.showRoomLabel(winMessage, 5000);
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      if (gamePlayer.tag.widget.gameStatus) {
        gamePlayer.tag.widget.gameStatus.sendMessage({
          type: "gameResult",
          winnerTeam: winnerTeam
        });
      }
    });
    App.runLater(() => {
      this.resetGame();
      if (this.room) {
        this.room.endGame();
      }
    }, 5);
  }
  resetGame() {
    if (!this.room) return;
    this.state = GameState.WAITING;
    if (this.phaseCycle) {
      this.setPhase(this.phaseCycle[0]);
    } else {
      this.setPhase(MafiaPhase.DAY);
    }
    this.dayCount = 1;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      if (gamePlayer.tag.widget) {
        if (gamePlayer.tag.widget.gameStatus) {
          gamePlayer.tag.widget.gameStatus.destroy();
          gamePlayer.tag.widget.gameStatus = null;
        }
        if (gamePlayer.tag.widget.nightAction) {
          gamePlayer.tag.widget.nightAction.destroy();
          gamePlayer.tag.widget.nightAction = null;
        }
        if (gamePlayer.tag.widget.voteWidget) {
          gamePlayer.tag.widget.voteWidget.destroy();
          gamePlayer.tag.widget.voteWidget = null;
        }
        if (gamePlayer.tag.widget.finalDefense) {
          gamePlayer.tag.widget.finalDefense.destroy();
          gamePlayer.tag.widget.finalDefense = null;
        }
        if (gamePlayer.tag.widget.approvalVote) {
          gamePlayer.tag.widget.approvalVote.destroy();
          gamePlayer.tag.widget.approvalVote = null;
        }
        if (gamePlayer.tag.widget.deadChat) {
          gamePlayer.tag.widget.deadChat.destroy();
          gamePlayer.tag.widget.deadChat = null;
        }
      }
    });
    this.voteResults = {};
    this.playerVotes = {};
    this.approvalVoteResults = {
      approve: 0,
      reject: 0
    };
    this.approvalPlayerVotes = {};
    this.defenseText = "";
    this.nightActions = [];
    this.deadPlayers = [];
    this.chatMessages = [];
    this.deadChatWidgetShown = {};
    this.sayToRoom(`게임이 리셋되었습니다.`);
  }
  setPhase(phase) {
    this.currentPhase = phase;
    this.phaseTimer = phaseDurations[this.currentPhase];
  }
  getCurrentPhase() {
    return this.currentPhase;
  }
  isGameInProgress() {
    return this.state === GameState.IN_PROGRESS;
  }
  isMafia(player) {
    const job = getJobById(player.jobId);
    return (job === null || job === void 0 ? void 0 : job.team) === JobTeam.MAFIA;
  }
  processAbility(playerId, targetId) {
    if (!this.room) return;
    const player = this.room.getPlayer(playerId);
    if (!player || !player.isAlive) return;
    const job = getJobById(player.jobId);
    if (!job) return;
    if (job.usesPerGame !== undefined && player.abilityUses !== undefined) {
      if (player.abilityUses <= 0) return;
      player.abilityUses--;
    }
    if (job.nightAbility && this.currentPhase !== MafiaPhase.NIGHT) return;
    if (job.dayAbility && this.currentPhase !== MafiaPhase.DAY) return;
    this.nightActions.push({
      playerId,
      targetId,
      jobId: player.jobId
    });
    const gamePlayer = this.room.getGamePlayer(playerId);
    if (gamePlayer) {
      gamePlayer.tag.widget.main.sendMessage({
        type: "ability_used",
        success: true,
        message: `${job.name} 능력을 사용했습니다.`
      });
    }
  }
  broadcastDefense(defense) {
    if (!this.room) return;
    this.defenseText = defense;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.finalDefense) return;
      gamePlayer.tag.widget.finalDefense.sendMessage({
        type: "updateDefense",
        defense: defense
      });
    });
  }
  processApprovalVote(voterId, vote) {
    if (this.approvalPlayerVotes[voterId]) {
      const previousVote = this.approvalPlayerVotes[voterId];
      this.approvalVoteResults[previousVote]--;
    }
    this.approvalPlayerVotes[voterId] = vote;
    this.updateApprovalVoteResults();
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const votedPlayers = Object.keys(this.approvalPlayerVotes).length;
    if (votedPlayers >= alivePlayers.length) {
      this.finalizeApprovalVoting();
    }
  }
  updateApprovalVoteResults() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;
      gamePlayer.tag.widget.approvalVote.sendMessage({
        type: "showResults",
        results: this.approvalVoteResults
      });
    });
  }
  finalizeApprovalVoting() {
    if (!this.room) return;
    this.updateApprovalVoteResults();
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;
      gamePlayer.tag.widget.approvalVote.sendMessage({
        type: "showResults",
        results: this.approvalVoteResults
      });
    });
    let maxVotes = 0;
    let defendantId = null;
    for (const [playerId, votes] of Object.entries(this.voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        defendantId = playerId;
      }
    }
    if (this.approvalVoteResults.approve > this.approvalVoteResults.reject) {
      const defendant = this.room.players.find(p => p.id === defendantId);
      if (defendant) {
        defendant.isAlive = false;
        this.sayToRoom(`${defendant.name}님이 처형되었습니다.`);
      }
    } else {
      this.sayToRoom(`처형이 부결되었습니다.`);
    }
    if (this.checkWinCondition()) {
      return;
    }
    App.runLater(() => {
      this.room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;
        gamePlayer.tag.widget.approvalVote.destroy();
        gamePlayer.tag.widget.approvalVote = null;
      });
      if (this.state === GameState.IN_PROGRESS) {
        this.nextPhase();
      }
    }, 5);
  }
  initLoverChat(player) {
    this.chatMessages.filter(msg => msg.target === 'lover').forEach(msg => {
      if (player.tag.widget.nightAction) {
        player.tag.widget.nightAction.sendMessage({
          type: "chatMessage",
          chatTarget: "lover",
          sender: msg.senderName,
          message: msg.message
        });
      }
    });
  }
  initMediumChat(player) {
    this.chatMessages.filter(msg => msg.target === 'dead').forEach(msg => {
      if (player.tag.widget.nightAction) {
        player.tag.widget.nightAction.sendMessage({
          type: "chatMessage",
          chatTarget: "dead",
          sender: msg.senderName,
          message: msg.message
        });
      }
    });
  }
  broadcastLoverMessage(sender, message) {
    this.chatMessages.push({
      target: 'lover',
      sender: sender.id,
      senderName: sender.name,
      message: message
    });
    this.loverPlayers.forEach(loverId => {
      if (loverId === sender.id) return;
      const loverPlayer = getPlayerById(loverId);
      if (loverPlayer && loverPlayer.tag.widget.nightAction) {
        loverPlayer.tag.widget.nightAction.sendMessage({
          type: "chatMessage",
          chatTarget: "lover",
          sender: sender.name,
          message: message
        });
      }
    });
  }
}
;// ../../libs/core/mafia/managers/gameRoom/GameRoom.ts



var GameRoomState;
(function (GameRoomState) {
  GameRoomState["WAITING"] = "waiting";
  GameRoomState["PLAYING"] = "playing";
  GameRoomState["ENDED"] = "ended";
})(GameRoomState || (GameRoomState = {}));
var WaitingRoomEvent;
(function (WaitingRoomEvent) {
  WaitingRoomEvent["PLAYER_JOIN"] = "playerJoin";
  WaitingRoomEvent["PLAYER_LEAVE"] = "playerLeave";
  WaitingRoomEvent["PLAYER_KICK"] = "playerKick";
  WaitingRoomEvent["HOST_CHANGE"] = "hostChange";
  WaitingRoomEvent["READY_STATUS_CHANGE"] = "readyStatusChange";
  WaitingRoomEvent["GAME_START"] = "gameStart";
  WaitingRoomEvent["GAME_END"] = "gameEnd";
  WaitingRoomEvent["CHAT_MESSAGE"] = "chatMessage";
})(WaitingRoomEvent || (WaitingRoomEvent = {}));
const STATE_INIT = "INIT";
const GAMEROOM_LOCATIONS = {
  1: Map.getLocation("GameRoom_1") ? Map.getLocationList("GameRoom_1")[0] : null,
  2: Map.getLocation("GameRoom_2") ? Map.getLocationList("GameRoom_2")[0] : null,
  3: Map.getLocation("GameRoom_3") ? Map.getLocationList("GameRoom_3")[0] : null,
  4: Map.getLocation("GameRoom_4") ? Map.getLocationList("GameRoom_4")[0] : null,
  5: Map.getLocation("GameRoom_5") ? Map.getLocationList("GameRoom_5")[0] : null,
  6: Map.getLocation("GameRoom_6") ? Map.getLocationList("GameRoom_6")[0] : null,
  7: Map.getLocation("GameRoom_7") ? Map.getLocationList("GameRoom_7")[0] : null,
  8: Map.getLocation("GameRoom_8") ? Map.getLocationList("GameRoom_8")[0] : null
};
const START_WAIT_TIME = 30;
class GameRoom {
  constructor(config) {
    this.hostId = null;
    this.players = [];
    this.readyPlayers = new Set();
    this.state = GameRoomState.WAITING;
    this.callbacks = {};
    this.id = config.id;
    this.title = config.title;
    this.gameMode = config.gameMode;
    this.maxPlayers = config.maxPlayers;
    this.password = config.password;
    this.createdAt = Date.now();
    this.flowManager = new GameFlowManager(parseInt(this.id));
    this.flowManager.setGameRoom(this);
  }
  getGamePlayer(playerId) {
    return getPlayerById(playerId);
  }
  actionToRoomPlayers(action, data) {
    if (typeof action === 'function') {
      this.players.forEach(player => {
        action(player);
      });
    } else {
      this.players.forEach(player => {
        const gamePlayer = getPlayerById(player.id);
        if (gamePlayer) {
          gamePlayer.tag[action] = data;
          gamePlayer.sendUpdated();
        }
      });
    }
  }
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }
  getId() {
    return this.id;
  }
  getTitle() {
    return this.title;
  }
  getGameMode() {
    return this.gameMode;
  }
  getMaxPlayers() {
    return this.maxPlayers;
  }
  getPlayers() {
    return this.players;
  }
  getPlayersCount() {
    return this.players.length;
  }
  isFull() {
    return this.players.length >= this.maxPlayers;
  }
  getState() {
    return this.state;
  }
  getHost() {
    return this.hostId;
  }
  getCreatedAt() {
    return this.createdAt;
  }
  hasPassword() {
    return !!this.password;
  }
  isPasswordCorrect(password) {
    return this.password === password;
  }
  isPlayerReady(playerId) {
    return this.readyPlayers.has(playerId);
  }
  areAllPlayersReady() {
    if (this.players.length < 4) return false;
    for (const player of this.players) {
      if (this.hostId && player.id === this.hostId) continue;
      if (!this.readyPlayers.has(player.id)) return false;
    }
    return true;
  }
  on(event, listener) {
    var _a;
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    (_a = this.callbacks[event]) === null || _a === void 0 ? void 0 : _a.push(listener);
  }
  off(event, listener) {
    const callbacks = this.callbacks[event];
    if (!callbacks) return;
    const index = callbacks.indexOf(listener);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  emit(event, ...args) {
    const callbacks = this.callbacks[event];
    if (!callbacks) return;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  joinPlayer(player) {
    if (this.players.some(p => p.id === player.id)) {
      return false;
    }
    if (this.isFull()) {
      return false;
    }
    if (this.state !== GameRoomState.WAITING) {
      return false;
    }
    const mafiaPlayer = {
      id: player.id,
      name: player.name,
      jobId: JobId.CITIZEN,
      isAlive: true,
      emoji: "👤"
    };
    this.players.push(mafiaPlayer);
    player.tag.mafiaPlayer = mafiaPlayer;
    const locationInfo = GAMEROOM_LOCATIONS[parseInt(this.id)];
    if (locationInfo) {
      player.spawnAtLocation(`GameRoom_${this.id}`);
      player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
      player.displayRatio = 1.5;
      player.sendUpdated();
    }
    player.tag.roomInfo = {
      roomNum: parseInt(this.id)
    };
    if (!this.hostId) {
      this.hostId = player.id;
    }
    this.emit(WaitingRoomEvent.PLAYER_JOIN, player);
    return true;
  }
  leavePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }
    const player = getPlayerById(playerId);
    if (!player) {
      this.players.splice(playerIndex, 1);
      this.readyPlayers.delete(playerId);
      if (this.hostId && this.hostId === playerId) {
        this.assignNewHost();
      }
      return true;
    }
    this.players.splice(playerIndex, 1);
    this.readyPlayers.delete(playerId);
    if (player.tag) {
      player.tag.roomInfo = null;
      player.tag.mafiaPlayer = null;
      player.spawnAtLocation("Lobby");
      if (player.tag.widget) {
        if (player.tag.widget.gameStatus) {
          player.tag.widget.gameStatus.destroy();
          player.tag.widget.gameStatus = null;
        }
        if (player.tag.widget.nightAction) {
          player.tag.widget.nightAction.destroy();
          player.tag.widget.nightAction = null;
        }
        if (player.tag.widget.voteWidget) {
          player.tag.widget.voteWidget.destroy();
          player.tag.widget.voteWidget = null;
        }
        if (player.tag.widget.deadChat) {
          player.tag.widget.deadChat.destroy();
          player.tag.widget.deadChat = null;
        }
      }
    }
    if (this.hostId && this.hostId === playerId) {
      this.assignNewHost();
    }
    this.emit(WaitingRoomEvent.PLAYER_LEAVE, player);
    return true;
  }
  kickPlayer(hostId, targetId) {
    if (!this.hostId || this.hostId !== hostId) {
      return false;
    }
    if (hostId === targetId) {
      return false;
    }
    const targetPlayer = getPlayerById(targetId);
    if (!targetPlayer) {
      return false;
    }
    const result = this.leavePlayer(targetId);
    if (!result) {
      return false;
    }
    this.emit(WaitingRoomEvent.PLAYER_KICK, targetPlayer);
    return true;
  }
  assignNewHost() {
    if (this.players.length === 0) {
      this.hostId = null;
      return;
    }
    const firstPlayerId = this.players[0].id;
    this.hostId = firstPlayerId;
    const newHost = getPlayerById(firstPlayerId);
    if (newHost) {
      this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
    }
  }
  changeHost(hostId, newHostId) {
    if (!this.hostId || this.hostId !== hostId) {
      return false;
    }
    const newHost = getPlayerById(newHostId);
    if (!newHost) {
      return false;
    }
    if (!this.players.some(p => p.id === newHostId)) {
      return false;
    }
    this.hostId = newHostId;
    this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
    return true;
  }
  toggleReady(playerId) {
    if (this.hostId && this.hostId === playerId) {
      return false;
    }
    if (!this.players.some(p => p.id === playerId)) {
      return false;
    }
    const player = getPlayerById(playerId);
    if (!player) {
      return false;
    }
    const isCurrentlyReady = this.readyPlayers.has(playerId);
    if (isCurrentlyReady) {
      this.readyPlayers.delete(playerId);
    } else {
      this.readyPlayers.add(playerId);
    }
    this.emit(WaitingRoomEvent.READY_STATUS_CHANGE, player, !isCurrentlyReady);
    return true;
  }
  startGame(hostId) {
    if (!this.hostId || this.hostId !== hostId) {
      return false;
    }
    if (this.players.length < 4) {
      return false;
    }
    if (!this.areAllPlayersReady()) {
      return false;
    }
    this.state = GameRoomState.PLAYING;
    try {
      this.flowManager.startGame();
    } catch (error) {
      console.error("Error starting game:", error);
      this.state = GameRoomState.WAITING;
      return false;
    }
    this.emit(WaitingRoomEvent.GAME_START);
    return true;
  }
  endGame() {
    this.state = GameRoomState.WAITING;
    this.readyPlayers.clear();
    this.emit(WaitingRoomEvent.GAME_END);
  }
  reset() {
    this.players.forEach(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      if (gamePlayer.tag.widget) {
        if (gamePlayer.tag.widget.gameStatus) {
          gamePlayer.tag.widget.gameStatus.destroy();
          gamePlayer.tag.widget.gameStatus = null;
        }
        if (gamePlayer.tag.widget.nightAction) {
          gamePlayer.tag.widget.nightAction.destroy();
          gamePlayer.tag.widget.nightAction = null;
        }
        if (gamePlayer.tag.widget.voteWidget) {
          gamePlayer.tag.widget.voteWidget.destroy();
          gamePlayer.tag.widget.voteWidget = null;
        }
      }
    });
    this.players = [];
    this.readyPlayers.clear();
    this.hostId = null;
    this.state = GameRoomState.WAITING;
    this.flowManager = new GameFlowManager(parseInt(this.id));
    this.flowManager.setGameRoom(this);
  }
  toJSON() {
    const hostPlayer = this.hostId ? getPlayerById(this.hostId) : null;
    return {
      id: this.id,
      title: this.title,
      gameMode: this.gameMode.getName(),
      maxPlayers: this.maxPlayers,
      hasPassword: this.hasPassword(),
      playersCount: this.getPlayersCount(),
      host: this.hostId ? {
        id: this.hostId,
        name: hostPlayer ? hostPlayer.name : '알 수 없음'
      } : null,
      state: this.state,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        isReady: this.isPlayerReady(player.id),
        isHost: this.hostId ? player.id === this.hostId : false
      })),
      createdAt: new Date(this.createdAt).toISOString()
    };
  }
}
;// ../../libs/core/mafia/managers/gameRoom/GameRoomManager.ts


class GameRoomManager {
  constructor() {
    this.gameRooms = {};
    this.gameModes = {};
    this.callbacks = {};
  }
  getAllRooms() {
    return Object.values(this.gameRooms);
  }
  getRoom(roomId) {
    return this.gameRooms[roomId];
  }
  createRoom(config) {
    let roomId = "1";
    for (let i = 1; i <= Game.ROOM_COUNT; i++) {
      const id = i.toString();
      if (!this.gameRooms[id]) {
        roomId = id;
        break;
      }
    }
    if (Object.keys(this.gameRooms).length >= Game.ROOM_COUNT) {
      throw new Error("모든 게임방이 사용 중입니다.");
    }
    const room = new GameRoom(Object.assign({
      id: roomId
    }, config));
    this.gameRooms[roomId] = room;
    this.setupRoomEventListeners(room);
    this.emit("roomCreated", room);
    return room;
  }
  removeRoom(roomId) {
    const room = this.gameRooms[roomId];
    if (!room) {
      return false;
    }
    room.reset();
    delete this.gameRooms[roomId];
    this.emit("roomRemoved", roomId);
    return true;
  }
  resetRoom(roomId) {
    const room = this.gameRooms[roomId];
    if (!room) {
      return false;
    }
    room.reset();
    this.emit("roomReset", room);
    return true;
  }
  registerGameMode(gameMode) {
    this.gameModes[gameMode.getId()] = gameMode;
  }
  getGameMode(modeId) {
    return this.gameModes[modeId];
  }
  getAllGameModes() {
    return Object.values(this.gameModes);
  }
  joinRoom(roomId, player) {
    const room = this.gameRooms[roomId];
    if (!room) {
      return false;
    }
    return room.joinPlayer(player);
  }
  leaveRoom(roomId, playerId) {
    const room = this.gameRooms[roomId];
    if (!room) {
      return false;
    }
    return room.leavePlayer(playerId);
  }
  setupRoomEventListeners(room) {
    room.on(WaitingRoomEvent.PLAYER_JOIN, player => {
      this.emit("playerJoinedRoom", room, player);
    });
    room.on(WaitingRoomEvent.PLAYER_LEAVE, player => {
      this.emit("playerLeftRoom", room, player);
      if (room.getPlayersCount() === 0) {
        this.removeRoom(room.getId());
      }
    });
    room.on(WaitingRoomEvent.PLAYER_KICK, player => {
      this.emit("playerKicked", room, player);
    });
    room.on(WaitingRoomEvent.HOST_CHANGE, newHost => {
      this.emit("hostChanged", room, newHost);
    });
    room.on(WaitingRoomEvent.READY_STATUS_CHANGE, (player, isReady) => {
      this.emit("readyStatusChanged", room, player, isReady);
    });
    room.on(WaitingRoomEvent.GAME_START, () => {
      this.emit("gameStarted", room);
    });
    room.on(WaitingRoomEvent.GAME_END, () => {
      this.emit("gameEnded", room);
    });
    room.on(WaitingRoomEvent.CHAT_MESSAGE, (player, message) => {
      this.emit("chatMessage", room, player, message);
    });
  }
  emit(event, ...args) {
    const callbacks = this.callbacks[event];
    if (!callbacks) return;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  on(event, listener) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(listener);
  }
  off(event, listener) {
    const callbacks = this.callbacks[event];
    if (!callbacks) return;
    const index = callbacks.indexOf(listener);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
}
;// ../../libs/core/mafia/gameMode/GameMode.ts
class GameMode {
  constructor(config) {
    this.jobs = [];
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.jobIds = config.jobIds;
    this.minPlayers = config.minPlayers;
    this.maxPlayers = config.maxPlayers;
  }
  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }
  getDescription() {
    return this.description;
  }
  getMinPlayers() {
    return this.minPlayers;
  }
  getMaxPlayers() {
    return this.maxPlayers;
  }
  setJobs(jobs) {
    this.jobs = jobs;
  }
  getJobs() {
    return this.jobs;
  }
  toJSON() {
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
;// ../../libs/core/mafia/gameMode/defaultGameModes.ts


function createDefaultGameModes() {
  const modes = [];
  GAME_MODES.forEach(modeData => {
    const modeConfig = {
      id: modeData.id,
      name: modeData.name,
      description: modeData.description,
      jobIds: modeData.jobIds,
      minPlayers: modeData.minPlayers,
      maxPlayers: modeData.maxPlayers
    };
    const gameMode = new GameMode(modeConfig);
    const jobs = getJobsByGameMode(modeData.id);
    if (jobs.length > 0) {
      gameMode.setJobs(jobs);
    }
    modes.push(gameMode);
  });
  return modes;
}
;// ../../libs/core/mafia/Game.ts







class Game extends GameBase {
  static create() {
    if (!Game._instance) {
      Game._instance = new Game();
    }
  }
  constructor() {
    super();
    this.mafiaGameRoomManager = new GameRoomManager();
    this.addOnStartCallback(this.onStart.bind(this));
    this.addOnJoinPlayerCallback(this.onJoinPlayer.bind(this));
    this.addOnLeavePlayerCallback(this.onLeavePlayer.bind(this));
    this.addOnUpdateCallback(this.update.bind(this));
    this.addOnDestroyCallback(this.onDestroy.bind(this));
    const gameModes = createDefaultGameModes();
    gameModes.forEach(mode => {
      this.mafiaGameRoomManager.registerGameMode(mode);
    });
    for (let i = 1; i <= 20; i++) {
      if (Map.hasLocation(`GameRoom_${i}`)) {
        Game.ROOM_COUNT++;
      }
    }
    this.setupGameRoomManagerListeners();
  }
  onStart() {
    App.enableFreeView = false;
    App.sendUpdated();
  }
  onJoinPlayer(player) {
    player.tag = {
      widget: {},
      mafiaPlayer: null,
      isReady: false,
      profile: {
        id: player.id,
        nickname: player.name,
        level: 1,
        experience: 0,
        avatar: ""
      }
    };
    Localizer_Localizer.prepareLocalizationContainer(player);
    const customData = parseJsonString(player.customData);
    if (player.tag.roomInfo) {
      const roomNum = player.tag.roomInfo.roomNum;
      const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
      if (room) {
        const gameFlow = room.flowManager;
        if (gameFlow && gameFlow.isGameInProgress()) {
          const deadPlayers = gameFlow.getDeadPlayers();
          if (deadPlayers && deadPlayers.includes(player.id)) {
            gameFlow.showPermanentDeadChatWidget(player);
          }
          const mafiaPlayer = room.getPlayer(player.id);
          if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
            gameFlow.showMediumChatWidget(player);
          }
        }
      }
    }
    this.showLobbyWidget(player);
  }
  showLobbyWidget(player) {
    if (player.tag.widget.main) {
      player.tag.widget.main.destroy();
      player.tag.widget.main = null;
    }
    player.tag.widget.main = player.showWidget("widgets/lobby_widget.html", "middle", 0, 0);
    player.tag.widget.main.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet,
      languageCode: player.language
    });
    player.tag.widget.main.sendMessage({
      type: "gameModes",
      modes: this.getGameModesForUI()
    });
    this.sendUsersList(player);
    this.sendRoomsList(player);
    player.tag.widget.main.onMessage.Add((sender, data) => {
      if (data.type === "requestGameModes") {
        sender.tag.widget.main.sendMessage({
          type: "gameModes",
          modes: this.getGameModesForUI()
        });
      } else if (data.type === "requestRooms") {
        this.sendRoomsList(sender);
      } else if (data.type === "requestUsers") {
        this.sendUsersList(sender);
      } else if (data.type === "createRoom" && data.data) {
        const {
          title,
          maxPlayers,
          gameMode
        } = data.data;
        const gameModeObj = this.mafiaGameRoomManager.getGameMode(gameMode);
        if (gameModeObj) {
          const room = this.mafiaGameRoomManager.createRoom({
            title,
            maxPlayers,
            gameMode: gameModeObj
          });
          if (room) {
            room.joinPlayer(sender);
            this.showRoomWidget(sender, room);
            this.updateRoomInfo();
          }
        }
      } else if (data.type === "joinRoom" && data.roomId) {
        const room = this.mafiaGameRoomManager.getRoom(data.roomId);
        if (room) {
          const joinResult = room.joinPlayer(sender);
          if (joinResult) {
            this.showRoomWidget(sender, room);
            this.updateRoomInfo();
          } else {
            sender.tag.widget.main.sendMessage({
              type: "error",
              message: "방에 입장할 수 없습니다."
            });
          }
        }
      } else if (data.type === "leaveRoom") {
        if (sender.tag.roomInfo) {
          const roomNum = sender.tag.roomInfo.roomNum;
          const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
          if (room) {
            room.leavePlayer(sender.id);
            this.showLobbyWidget(sender);
            this.updateRoomInfo();
          }
        }
      }
    });
  }
  showRoomWidget(player, room) {
    if (player.tag.widget.main) {
      player.tag.widget.main.destroy();
      player.tag.widget.main = null;
    }
    player.tag.widget.room = player.showWidget("widgets/room_widget.html", "middle", 0, 0);
    player.tag.widget.room.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet,
      languageCode: player.language
    });
    this.sendRoomInfoToPlayer(player, room);
    this.sendGameModeDetailsToPlayer(player, room.gameMode);
    const gameFlow = room.flowManager;
    if (gameFlow && gameFlow.isGameInProgress()) {
      const deadPlayers = gameFlow.getDeadPlayers();
      if (deadPlayers && deadPlayers.includes(player.id)) {
        gameFlow.showPermanentDeadChatWidget(player);
      }
      const mafiaPlayer = room.getPlayer(player.id);
      if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
        gameFlow.showMediumChatWidget(player);
      }
    }
    this.notifyPlayerJoinedRoom(room, player);
    player.tag.widget.room.onMessage.Add((sender, data) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      if (data.type === "requestRoomInfo") {
        const roomId = (_a = sender.tag.roomInfo) === null || _a === void 0 ? void 0 : _a.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            this.sendRoomInfoToPlayer(sender, room);
          }
        }
      } else if (data.type === "requestGameModeDetails") {
        const roomId = (_b = sender.tag.roomInfo) === null || _b === void 0 ? void 0 : _b.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            this.sendGameModeDetailsToPlayer(sender, room.gameMode);
          }
        }
      } else if (data.type === "leaveRoom") {
        const roomId = (_c = sender.tag.roomInfo) === null || _c === void 0 ? void 0 : _c.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            room.leavePlayer(sender.id);
            if (sender.tag.widget.room) {
              sender.tag.widget.room.destroy();
              sender.tag.widget.room = null;
            }
            this.showLobbyWidget(sender);
            this.updateRoomInfo();
            this.notifyPlayerLeftRoom(room, sender);
          }
        }
      } else if (data.type === "setReady") {
        const roomId = (_d = sender.tag.roomInfo) === null || _d === void 0 ? void 0 : _d.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            sender.tag.isReady = true;
            this.notifyReadyStatusChanged(room, sender);
          }
        }
      } else if (data.type === "cancelReady") {
        const roomId = (_e = sender.tag.roomInfo) === null || _e === void 0 ? void 0 : _e.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            sender.tag.isReady = false;
            this.notifyReadyStatusChanged(room, sender);
          }
        }
      } else if (data.type === "startGame") {
        const roomId = (_f = sender.tag.roomInfo) === null || _f === void 0 ? void 0 : _f.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            const canStart = this.canStartGame(room);
            if (canStart) {
              room.flowManager.startGame();
              this.notifyGameStarting(room);
              this.updateRoomInfo();
            } else {
              sender.tag.widget.room.sendMessage({
                type: "error",
                message: "모든 플레이어가 준비 상태여야 합니다."
              });
            }
          }
        }
      } else if (data.type === "kickPlayer" && data.playerId) {
        const roomId = (_g = sender.tag.roomInfo) === null || _g === void 0 ? void 0 : _g.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            const isHost = room.hostId === sender.id;
            if (isHost) {
              const targetPlayer = App.getPlayerByID(data.playerId);
              if (targetPlayer) {
                room.leavePlayer(targetPlayer.id);
                if ((_j = (_h = targetPlayer.tag) === null || _h === void 0 ? void 0 : _h.widget) === null || _j === void 0 ? void 0 : _j.room) {
                  targetPlayer.tag.widget.room.destroy();
                  targetPlayer.tag.widget.room = null;
                }
                this.showLobbyWidget(targetPlayer);
                this.notifyPlayerKicked(room, targetPlayer);
                this.updateRoomInfo();
              }
            }
          }
        }
      } else if (data.type === "sendChatMessage" && data.content) {
        const roomId = (_k = sender.tag.roomInfo) === null || _k === void 0 ? void 0 : _k.roomNum;
        if (roomId) {
          const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
          if (room) {
            this.sendChatMessageToRoom(room, sender, data.content);
          }
        }
      }
    });
  }
  sendRoomInfoToPlayer(player, room) {
    var _a, _b, _c;
    if (!((_b = (_a = player === null || player === void 0 ? void 0 : player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room)) {
      return;
    }
    const players = room.getPlayers();
    let hostName = "알 수 없음";
    let hostId = "";
    if (room.hostId) {
      hostId = room.hostId;
      const hostPlayer = players.find(p => p.id === hostId);
      if (hostPlayer) {
        hostName = hostPlayer.name;
      }
    }
    const playersList = players.map(p => {
      var _a, _b, _c;
      const gamePlayer = getPlayerById(p.id);
      return {
        id: p.id,
        name: p.name,
        level: ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.level) || 1,
        isReady: ((_c = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _c === void 0 ? void 0 : _c.isReady) || false
      };
    });
    player.tag.widget.room.sendMessage({
      type: "roomInfo",
      roomData: {
        id: room.id,
        title: room.title,
        maxPlayers: room.maxPlayers,
        gameMode: room.gameMode.getName(),
        host: {
          id: hostId,
          name: hostName
        },
        players: playersList,
        currentUser: {
          id: player.id,
          name: player.name,
          isReady: ((_c = player.tag) === null || _c === void 0 ? void 0 : _c.isReady) || false
        }
      }
    });
  }
  sendGameModeDetailsToPlayer(player, gameMode) {
    var _a, _b;
    if (!((_b = (_a = player === null || player === void 0 ? void 0 : player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room)) {
      return;
    }
    const jobs = gameMode.getJobs();
    const jobsData = jobs.map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      team: job.team
    }));
    player.tag.widget.room.sendMessage({
      type: "gameModeDetails",
      modeData: {
        id: gameMode.getId(),
        name: gameMode.getName(),
        description: gameMode.getDescription(),
        jobs: jobsData
      }
    });
  }
  notifyPlayerJoinedRoom(room, player) {
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      if (p.id !== player.id) {
        const gamePlayer = App.getPlayerByID(p.id);
        if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
          gamePlayer.tag.widget.room.sendMessage({
            type: "playerJoined",
            playerId: player.id,
            playerName: player.name
          });
          this.sendRoomInfoToPlayer(gamePlayer, room);
        }
      }
    });
  }
  notifyPlayerLeftRoom(room, player) {
    if (!player) {
      return;
    }
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "playerLeft",
          playerId: player.id,
          playerName: player.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  notifyPlayerKicked(room, player) {
    if (!player) {
      return;
    }
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "playerKicked",
          playerId: player.id,
          playerName: player.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  notifyReadyStatusChanged(room, player) {
    if (!player || !player.tag) {
      return;
    }
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "readyStatusChanged",
          playerId: player.id,
          isReady: player.tag.isReady
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  notifyGameStarting(room) {
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "gameStarting"
        });
      }
    });
  }
  sendChatMessageToRoom(room, sender, content) {
    if (!sender) {
      return;
    }
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "chatMessage",
          senderId: sender.id,
          senderName: sender.name,
          content: content
        });
      }
    });
  }
  canStartGame(room) {
    var _a;
    const players = room.getPlayers();
    if (players.length < 4) {
      return false;
    }
    const hostId = room.hostId;
    for (const mafiaPlayer of players) {
      if (mafiaPlayer.id !== hostId) {
        const gamePlayer = App.getPlayerByID(mafiaPlayer.id);
        if (!((_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.isReady)) {
          return false;
        }
      }
    }
    return true;
  }
  showGameModeSelect(player) {
    if (player.tag.widget.gameModeSelect) {
      player.tag.widget.gameModeSelect.destroy();
      player.tag.widget.gameModeSelect = null;
    }
    player.tag.widget.gameModeSelect = player.showWidget("widgets/game_mode_select.html", "middle", 0, 0);
    player.tag.widget.gameModeSelect.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    player.tag.widget.gameModeSelect.sendMessage({
      type: "init_game_modes",
      modes: GAME_MODES,
      jobs: JOBS
    });
    player.tag.widget.gameModeSelect.onMessage.Add((player, data) => {
      if (data.type === "cancel_mode_select") {
        player.tag.widget.gameModeSelect.destroy();
        player.tag.widget.gameModeSelect = null;
      } else if (data.type === "select_game_mode") {
        const modeId = data.modeId;
        const room = this.mafiaGameRoomManager.getRoom("1");
        room.flowManager.setGameMode(modeId);
        room.flowManager.startGame();
        player.tag.widget.gameModeSelect.destroy();
        player.tag.widget.gameModeSelect = null;
        this.updateRoomInfo();
      }
    });
  }
  showRoleCard(player, role) {
    if (player.tag.widget.roleCard) {
      player.tag.widget.roleCard.destroy();
    }
    player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "middle", 0, 0);
    player.tag.widget.roleCard.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    player.tag.widget.roleCard.sendMessage({
      type: "setRole",
      role: role
    });
    player.tag.widget.roleCard.onMessage.Add((player, data) => {
      if (data.type === "close") {
        player.tag.widget.roleCard.destroy();
        player.tag.widget.roleCard = null;
      }
    });
  }
  onLeavePlayer(player) {
    if (!player || !player.tag) {
      return;
    }
    if (player.tag.roomInfo) {
      const roomNum = player.tag.roomInfo.roomNum;
      const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
      if (room) {
        room.leavePlayer(player.id);
        if (player.tag.widget) {
          if (player.tag.widget.room) {
            player.tag.widget.room.destroy();
            player.tag.widget.room = null;
          }
          if (player.tag.widget.main) {
            player.tag.widget.main.destroy();
            player.tag.widget.main = null;
          }
        }
        this.updateRoomInfo();
      }
    }
  }
  update(dt) {
    for (let i = 1; i <= Game.ROOM_COUNT; i++) {
      const room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room && room.flowManager.isGameInProgress()) {
        if (room.flowManager.phaseTimer > 0) {
          room.flowManager.phaseTimer -= dt;
          if (room.flowManager.phaseTimer <= 0) {
            room.flowManager.nextPhase();
          }
        }
      }
    }
  }
  onDestroy() {}
  getGameModesForUI() {
    const gameModes = [];
    const defaultModes = createDefaultGameModes();
    defaultModes.forEach(mode => {
      gameModes.push({
        id: mode.getId(),
        name: mode.getName(),
        description: mode.getDescription()
      });
    });
    return gameModes;
  }
  sendRoomsList(player) {
    var _a, _b;
    if (!((_b = (_a = player === null || player === void 0 ? void 0 : player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.main)) {
      return;
    }
    const rooms = [];
    for (let i = 1; i <= Game.ROOM_COUNT; i++) {
      const room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room) {
        const players = room.getPlayers();
        let hostName = "알 수 없음";
        let hostId = "";
        if (room.hostId) {
          hostId = room.hostId;
          const hostPlayer = players.find(p => p.id === hostId);
          if (hostPlayer) {
            hostName = hostPlayer.name;
          }
        }
        rooms.push({
          id: room.id,
          title: room.title,
          state: room.flowManager.isGameInProgress() ? "IN_PROGRESS" : "WAITING",
          host: {
            id: hostId,
            name: hostName
          },
          players: players.map(p => ({
            id: p.id,
            name: p.name
          })),
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode.getName()
        });
      }
    }
    player.tag.widget.main.sendMessage({
      type: "updateRooms",
      rooms: rooms
    });
  }
  sendUsersList(player) {
    var _a, _b;
    if (!((_b = (_a = player === null || player === void 0 ? void 0 : player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.main)) {
      return;
    }
    const users = [];
    App.players.forEach(p => {
      var _a, _b;
      const gamePlayer = p;
      users.push({
        id: p.id,
        name: p.name,
        level: ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.level) || 1
      });
    });
    player.tag.widget.main.sendMessage({
      type: "updateUsers",
      users: users
    });
  }
  updateRoomInfo() {
    App.players.forEach(p => {
      var _a, _b;
      const gamePlayer = p;
      if ((_b = (_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.main) {
        this.sendRoomsList(gamePlayer);
        this.sendUsersList(gamePlayer);
      }
    });
  }
  setupGameRoomManagerListeners() {
    this.mafiaGameRoomManager.on("playerLeftRoom", (room, player) => {
      this.notifyPlayerLeftRoom(room, player);
      if (room.getPlayersCount() > 0 && room.hostId) {
        const hostPlayer = getPlayerById(room.hostId);
        if (hostPlayer) {
          this.notifyHostChanged(room, hostPlayer);
        }
      }
    });
    this.mafiaGameRoomManager.on("playerKicked", (room, player) => {
      var _a, _b;
      if ((_b = (_a = player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        player.tag.widget.room.destroy();
        player.tag.widget.room = null;
      }
      this.showLobbyWidget(player);
      this.notifyPlayerKicked(room, player);
    });
    this.mafiaGameRoomManager.on("hostChanged", (room, newHost) => {
      this.notifyHostChanged(room, newHost);
    });
    this.mafiaGameRoomManager.on("readyStatusChanged", (room, player, isReady) => {
      player.tag.isReady = isReady;
      this.notifyReadyStatusChanged(room, player);
    });
    this.mafiaGameRoomManager.on("gameStarted", room => {
      room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;
        if (gamePlayer.tag.widget.room) {
          gamePlayer.tag.widget.room.sendMessage({
            type: "gameStarting"
          });
        }
      });
    });
    this.mafiaGameRoomManager.on("gameEnded", room => {
      room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;
        if (gamePlayer.tag.widget.room) {
          gamePlayer.tag.widget.room.sendMessage({
            type: "gameEnded"
          });
        }
      });
      this.updateRoomInfo();
    });
  }
  notifyHostChanged(room, newHost) {
    const players = room.getPlayers();
    players.forEach(p => {
      var _a, _b;
      const gamePlayer = App.getPlayerByID(p.id);
      if ((_b = (_a = gamePlayer === null || gamePlayer === void 0 ? void 0 : gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "hostChanged",
          newHostId: newHost.id,
          newHostName: newHost.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
}
Game.ROOM_COUNT = 0;
;// ./main.ts

App.onInit.Add(() => {
  App.cameraEffect = 1;
  App.cameraEffectParam1 = 2000;
  App.sendUpdated();
  Game.create();
});
/******/ })()
;