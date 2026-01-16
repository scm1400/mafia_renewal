/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// CONCATENATED MODULE: ../../libs/utils/Localizer.ts
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
;// CONCATENATED MODULE: ../../libs/utils/Common.ts


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
function sendAdminConsoleMessage(message) {
  if (adminList.length === 0) return;
  adminList.forEach(adminId => {
    const player = getPlayerById(adminId);
    if (!player) return;
    if (player.tag.widget.system) {
      player.tag.widget.system.sendMessage({
        message
      });
    }
  });
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
function isAdmin(player) {
  return player.role >= 3000 || adminList.includes(player.id);
}
;// CONCATENATED MODULE: ../../libs/utils/CustomLabelFunctions.ts

const LABEL_SPACING = 60;
const labelCounts = {};
const playerLabels = {};
function clearCustomLabel(player = null) {
  if (player) {
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "main"
    });
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "sub"
    });
    if (player.id) {
      Object.keys(playerLabels).forEach(idAndKey => {
        if (idAndKey.startsWith(`${player.id}_`)) {
          delete playerLabels[idAndKey];
        }
      });
      labelCounts[player.id] = 0;
    }
  } else {
    actionToAllPlayers(player => {
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "main"
      });
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "sub"
      });
      if (player.id) {
        Object.keys(playerLabels).forEach(idAndKey => {
          if (idAndKey.startsWith(`${player.id}_`)) {
            delete playerLabels[idAndKey];
          }
        });
        labelCounts[player.id] = 0;
      }
    });
    Object.keys(labelCounts).forEach(key => {
      labelCounts[key] = 0;
    });
    Object.keys(playerLabels).forEach(key => {
      delete playerLabels[key];
    });
  }
}
function cleanupLabel(playerId, key, timeout) {
  setTimeout(() => {
    const labelKey = `${playerId}_${key}`;
    if (playerLabels[labelKey] !== undefined) {
      delete playerLabels[labelKey];
      if (labelCounts[playerId] && labelCounts[playerId] > 0) {
        labelCounts[playerId]--;
      }
      const playerActiveLabels = Object.keys(playerLabels).filter(k => k.startsWith(`${playerId}_`)).sort((a, b) => playerLabels[a] - playerLabels[b]);
      playerActiveLabels.forEach((labelId, index) => {
        playerLabels[labelId] = index;
      });
    }
  }, timeout);
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
    topGapPC = 90,
    backgroundColor = 0x27262e,
    borderRadius = "12px",
    padding = "8px",
    fontOpacity = false,
    labelDisplayTime = 3000,
    texts = [],
    fixedPosition = false
  } = options;
  const isMobile = player.isMobile && !player.isTablet;
  const isTablet = player.isMobile && player.isTablet;
  const baseTopGap = isMobile ? topGapMobile : topGapPC;
  let topGap = baseTopGap;
  if (!fixedPosition && player.id) {
    const labelKey = `${player.id}_${key}`;
    if (!labelCounts[player.id]) {
      labelCounts[player.id] = 0;
    }
    if (playerLabels[labelKey] !== undefined) {
      topGap = baseTopGap + playerLabels[labelKey] * LABEL_SPACING;
    } else {
      playerLabels[labelKey] = labelCounts[player.id];
      topGap = baseTopGap + labelCounts[player.id] * LABEL_SPACING;
      labelCounts[player.id]++;
    }
    cleanupLabel(player.id, key, labelDisplayTime);
  }
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
;// CONCATENATED MODULE: ../../libs/core/GameBase.ts
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
;// CONCATENATED MODULE: ../../libs/core/mafia/types/JobTypes.ts
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
  JobTeam["MAFIA"] = "MAFIA";
  JobTeam["CITIZEN"] = "CITIZEN";
  JobTeam["NEUTRAL"] = "NEUTRAL";
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
  abilityDescription: "[첩보] 밤마다 플레이어 한 명을 선택하여 직업을 알아낼 수 있다. 마피아와 접선할 경우, 한 번 더 능력을 사용할 수 있다.",
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
  description: "마피아에게 길들여지면 플레이어를 제거할 수 있습니다.",
  abilityType: JobAbilityType.CONVERT,
  abilityDescription: "1) 밤에 선택한 플레이어가 마피아에게 살해당하면 길들여집니다. 2) 마피아의 공격으로부터 죽지 않으며, 마피아의 처형 대상이 되면 길들여집니다. 3) 길들여진 후 밤에 선택한 플레이어를 제거할 수 있습니다.",
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
  abilityDescription: "[유혹] VOTE 시간에 투표한 플레이어를 유혹하여 직업의 고유 능력을 사용하지 못하도록 한다. 마피아를 유혹할 경우 접선한다.",
  icon: "💋",
  nightAbility: false,
  dayAbility: true,
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
function getGameModeConfigById(modeId) {
  return GAME_MODES.find(mode => mode.id === modeId);
}
function getJobsByGameMode(modeId) {
  const gameMode = getGameModeConfigById(modeId);
  if (!gameMode) return [];
  return gameMode.jobIds.map(jobId => {
    const job = getJobById(jobId);
    return job ? job : null;
  }).filter(job => job !== null);
}
var JobCategory;
(function (JobCategory) {
  JobCategory["BASIC_CITIZEN"] = "BASIC_CITIZEN";
  JobCategory["SPECIAL_CITIZEN"] = "SPECIAL_CITIZEN";
  JobCategory["POLICE"] = "POLICE";
  JobCategory["DOCTOR"] = "DOCTOR";
  JobCategory["BASIC_MAFIA"] = "BASIC_MAFIA";
  JobCategory["SUPPORT_MAFIA"] = "SUPPORT_MAFIA";
})(JobCategory || (JobCategory = {}));
function categorizeJobs(jobs) {
  const categories = {
    [JobCategory.BASIC_CITIZEN]: [],
    [JobCategory.SPECIAL_CITIZEN]: [],
    [JobCategory.POLICE]: [],
    [JobCategory.DOCTOR]: [],
    [JobCategory.BASIC_MAFIA]: [],
    [JobCategory.SUPPORT_MAFIA]: []
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
function getSpecialCitizenCount(playerCount) {
  if (playerCount <= 4) return 1;
  if (playerCount <= 6) return 2;
  if (playerCount <= 9) return 3;
  return 4;
}
function getSupportMafiaCount(playerCount) {
  return playerCount >= 6 ? 1 : 0;
}
function distributeJobsByPlayerCount(modeId, playerCount) {
  const allJobs = getJobsByGameMode(modeId);
  const categorizedJobs = categorizeJobs(allJobs);
  const selectedJobs = [];
  if (categorizedJobs[JobCategory.POLICE].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.POLICE][0]);
  }
  if (categorizedJobs[JobCategory.DOCTOR].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.DOCTOR][0]);
  }
  if (categorizedJobs[JobCategory.BASIC_MAFIA].length > 0) {
    selectedJobs.push(categorizedJobs[JobCategory.BASIC_MAFIA][0]);
  }
  const specialCitizenCount = getSpecialCitizenCount(playerCount);
  const availableSpecialCitizens = [...categorizedJobs[JobCategory.SPECIAL_CITIZEN]];
  for (let i = 0; i < specialCitizenCount && availableSpecialCitizens.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableSpecialCitizens.length);
    selectedJobs.push(availableSpecialCitizens[randomIndex]);
    availableSpecialCitizens.splice(randomIndex, 1);
  }
  const supportMafiaCount = getSupportMafiaCount(playerCount);
  const availableSupportMafia = [...categorizedJobs[JobCategory.SUPPORT_MAFIA]];
  for (let i = 0; i < supportMafiaCount && availableSupportMafia.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableSupportMafia.length);
    selectedJobs.push(availableSupportMafia[randomIndex]);
    availableSupportMafia.splice(randomIndex, 1);
  }
  const remainingSlots = playerCount - selectedJobs.length;
  for (let i = 0; i < remainingSlots; i++) {
    if (categorizedJobs[JobCategory.BASIC_CITIZEN].length > 0) {
      selectedJobs.push(categorizedJobs[JobCategory.BASIC_CITIZEN][0]);
    }
  }
  return shuffleArray(selectedJobs);
}
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/widget/WidgetType.ts
var WidgetType;
(function (WidgetType) {
  WidgetType["LOBBY_NAVBAR"] = "LOBBY_NAVBAR";
  WidgetType["LOBBY"] = "LOBBY";
  WidgetType["LOBBY_CHAT"] = "LOBBY_CHAT";
  WidgetType["GAME_STATUS"] = "GAME_STATUS";
  WidgetType["NIGHT_ACTION"] = "NIGHT_ACTION";
  WidgetType["VOTE"] = "VOTE";
  WidgetType["FINAL_DEFENSE"] = "FINAL_DEFENSE";
  WidgetType["APPROVAL_VOTE"] = "APPROVAL_VOTE";
  WidgetType["DEAD_CHAT"] = "DEAD_CHAT";
  WidgetType["ROLE_CARD"] = "ROLE_CARD";
  WidgetType["DAY_CHAT"] = "DAY_CHAT";
  WidgetType["UNIFIED_CHAT"] = "UNIFIED_CHAT";
})(WidgetType || (WidgetType = {}));
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/widget/WidgetManager.ts


class WidgetManager {
  constructor() {
    this.playerWidgetMap = {};
    App.addOnKeyDown(13, player => {
      if (player.tag.widget.lobbyChat) {
        player.tag.widget.lobbyChat.sendMessage({
          type: "focusInput"
        });
      }
      if (player.tag.widget.finalDefense) {
        player.tag.widget.finalDefense.sendMessage({
          type: "focusInput"
        });
      }
      if (player.tag.widget.unifiedChat) {
        player.tag.widget.unifiedChat.sendMessage({
          type: "focusInput"
        });
      }
    });
  }
  static get instance() {
    if (!this._instance) {
      this._instance = new WidgetManager();
    }
    return this._instance;
  }
  initPlayerWidgets(player) {
    if (this.playerWidgetMap[player.id]) {
      return;
    }
    this.playerWidgetMap[player.id] = {};
    this.createWidgets(player);
  }
  createWidgets(player) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    this.createAndInitializeWidget(player, widgetMap, WidgetType.LOBBY_NAVBAR, "widgets/lobby_navbar.html", "top");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.LOBBY, "widgets/lobby_widget.html", "top");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.LOBBY_CHAT, "widgets/lobby_chat_widget.html", "bottomleft");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.GAME_STATUS, "widgets/game_status.html", "middleright");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.NIGHT_ACTION, "widgets/night_action.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.VOTE, "widgets/vote_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.FINAL_DEFENSE, "widgets/final_defense_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.APPROVAL_VOTE, "widgets/approval_vote_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.ROLE_CARD, "widgets/role_card.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.UNIFIED_CHAT, "widgets/unified_chat_widget.html", "bottom");
  }
  createAndInitializeWidget(player, widgetMap, widgetType, widgetPath, anchor) {
    const widget = player.showWidget(widgetPath, anchor, 0, 0);
    widget.sendMessage({
      type: "setWidget",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    widgetMap[widgetType] = {
      element: widget,
      widgetType: widgetType,
      revealWidget: () => this.showWidget(player, widgetType),
      hideWidget: () => this.hideWidget(player, widgetType),
      sendMessage: message => widget.sendMessage(message),
      initialize: data => {},
      destroy: () => widget.destroy(),
      messageHandlers: [],
      lastHandlerId: 0
    };
  }
  showWidget(player, widgetType) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    const widget = widgetMap[widgetType];
    if (!widget) return;
    if (!player.tag.widget) {
      player.tag.widget = {};
    }
    switch (widgetType) {
      case WidgetType.LOBBY_NAVBAR:
        player.tag.widget.lobbyNavbar = widget.element;
        break;
      case WidgetType.LOBBY:
        player.tag.widget.lobby = widget.element;
        break;
      case WidgetType.LOBBY_CHAT:
        player.tag.widget.lobbyChat = widget.element;
        break;
      case WidgetType.GAME_STATUS:
        player.tag.widget.gameStatus = widget.element;
        break;
      case WidgetType.NIGHT_ACTION:
        player.tag.widget.nightAction = widget.element;
        break;
      case WidgetType.VOTE:
        player.tag.widget.voteWidget = widget.element;
        break;
      case WidgetType.FINAL_DEFENSE:
        player.tag.widget.finalDefense = widget.element;
        break;
      case WidgetType.APPROVAL_VOTE:
        player.tag.widget.approvalVote = widget.element;
        break;
      case WidgetType.ROLE_CARD:
        player.tag.widget.roleCard = widget.element;
        break;
      case WidgetType.UNIFIED_CHAT:
        player.tag.widget.unifiedChat = widget.element;
        break;
      default:
        break;
    }
    widget.element.sendMessage({
      type: "showWidget"
    });
    sendAdminConsoleMessage(`위젯 표시: ${widgetType} (플레이어: ${player.name})`);
  }
  hideWidget(player, widgetType) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    const widget = widgetMap[widgetType];
    if (!widget) return;
    if (player.tag.widget) {
      switch (widgetType) {
        case WidgetType.LOBBY_NAVBAR:
          player.tag.widget.lobbyNavbar = null;
          break;
        case WidgetType.LOBBY:
          player.tag.widget.lobby = null;
          break;
        case WidgetType.LOBBY_CHAT:
          player.tag.widget.lobbyChat = null;
          break;
        case WidgetType.GAME_STATUS:
          player.tag.widget.gameStatus = null;
          break;
        case WidgetType.NIGHT_ACTION:
          player.tag.widget.nightAction = null;
          break;
        case WidgetType.VOTE:
          player.tag.widget.voteWidget = null;
          break;
        case WidgetType.FINAL_DEFENSE:
          player.tag.widget.finalDefense = null;
          break;
        case WidgetType.APPROVAL_VOTE:
          player.tag.widget.approvalVote = null;
          break;
        case WidgetType.ROLE_CARD:
          player.tag.widget.roleCard = null;
          break;
        case WidgetType.UNIFIED_CHAT:
          player.tag.widget.unifiedChat = null;
          break;
        default:
          break;
      }
    }
    widget.element.sendMessage({
      type: "hideWidget"
    });
    sendAdminConsoleMessage(`위젯 숨김: ${widgetType} (플레이어: ${player.name})`);
  }
  hideAllWidgets(player) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    Object.values(widgetMap).forEach(widget => {
      widget.element.sendMessage({
        type: "hideWidget"
      });
    });
    sendAdminConsoleMessage(`모든 위젯 숨김 (플레이어: ${player.name})`);
  }
  sendMessageToWidget(player, widgetType, message) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    const widget = widgetMap[widgetType];
    if (!widget) return;
    widget.element.sendMessage(message);
  }
  initializeWidget(player, widgetType, data) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    const widget = widgetMap[widgetType];
    if (!widget) return;
    widget.initialize(data);
  }
  registerMessageHandler(player, widgetType, callback) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return -1;
    const widget = widgetMap[widgetType];
    if (!widget) return -1;
    const handlerId = ++widget.lastHandlerId;
    const handlerWrapper = (sender, data) => {
      callback(sender, data);
    };
    widget.messageHandlers.push({
      id: handlerId,
      handler: handlerWrapper
    });
    widget.element.onMessage.Add(handlerWrapper);
    return handlerId;
  }
  clearMessageHandlers(player, widgetType) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    const widget = widgetMap[widgetType];
    if (!widget) return;
    widget.messageHandlers.forEach(handlerInfo => {
      widget.element.onMessage.Remove(handlerInfo.handler);
    });
    widget.messageHandlers = [];
    sendAdminConsoleMessage(`위젯 핸들러 모두 제거: ${widgetType} (플레이어: ${player.name})`);
  }
  removeMessageHandler(player, widgetType, handlerId) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return false;
    const widget = widgetMap[widgetType];
    if (!widget) return false;
    const handlerIndex = widget.messageHandlers.findIndex(info => info.id === handlerId);
    if (handlerIndex === -1) return false;
    const handlerInfo = widget.messageHandlers[handlerIndex];
    widget.element.onMessage.Remove(handlerInfo.handler);
    widget.messageHandlers.splice(handlerIndex, 1);
    sendAdminConsoleMessage(`위젯 핸들러 제거: ${widgetType}, ID: ${handlerId} (플레이어: ${player.name})`);
    return true;
  }
  cleanupPlayerWidgets(player) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return;
    Array.from(Object.entries(widgetMap)).forEach(([type, widget]) => {
      widget.element.sendMessage({
        type: "hideWidget"
      });
      this.clearMessageHandlers(player, widget.widgetType);
    });
    if (player.tag && player.tag.widget) {
      player.tag.widget.lobbyNavbar = null;
      player.tag.widget.lobby = null;
      player.tag.widget.lobbyChat = null;
      player.tag.widget.gameStatus = null;
      player.tag.widget.nightAction = null;
      player.tag.widget.voteWidget = null;
      player.tag.widget.finalDefense = null;
      player.tag.widget.approvalVote = null;
      player.tag.widget.roleCard = null;
      player.tag.widget.gameModeSelect = null;
      player.tag.widget.unifiedChat = null;
    }
    sendAdminConsoleMessage(`위젯 정리 완료 (플레이어: ${player.name})`);
  }
  getWidget(player, widgetType) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return undefined;
    return widgetMap[widgetType];
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/command/CommandParser.ts
class CommandParser {
  static isCommand(message) {
    if (!message) return false;
    return message.trim().startsWith(this.COMMAND_PREFIX);
  }
  static parse(message) {
    if (!this.isCommand(message)) {
      return null;
    }
    const trimmed = message.trim();
    const withoutPrefix = trimmed.substring(this.COMMAND_PREFIX.length);
    if (!withoutPrefix) {
      return null;
    }
    const parts = [];
    let currentPart = "";
    let inQuotes = false;
    for (let i = 0; i < withoutPrefix.length; i++) {
      const char = withoutPrefix[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === " " && !inQuotes) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = "";
        }
      } else {
        currentPart += char;
      }
    }
    if (currentPart) {
      parts.push(currentPart);
    }
    if (parts.length === 0) {
      return null;
    }
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    return {
      command,
      args,
      rawMessage: message
    };
  }
}
CommandParser.COMMAND_PREFIX = "/";
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/command/CommandManager.ts


class CommandManager {
  static get instance() {
    if (!CommandManager._instance) {
      CommandManager._instance = new CommandManager();
    }
    return CommandManager._instance;
  }
  constructor() {
    this.commands = {};
  }
  registerCommand(handler) {
    this.commands[handler.name.toLowerCase()] = handler;
  }
  executeCommand(commandName, args, context) {
    const handler = this.commands[commandName.toLowerCase()];
    if (!handler) {
      return false;
    }
    if (handler.adminOnly && !isAdmin(context.player)) {
      showLabel(context.player, "관리자만 사용할 수 있는 명령어입니다.");
      return true;
    }
    if (handler.requiresGameInProgress) {
      if (!context.flowManager || !context.flowManager.isGameInProgress()) {
        showLabel(context.player, "게임이 진행 중일 때만 사용할 수 있는 명령어입니다.");
        return true;
      }
    }
    try {
      return handler.execute(context, args);
    } catch (error) {
      sendAdminConsoleMessage(`[ERROR] 명령어 실행 중 오류: ${error}`);
      showLabel(context.player, "명령어 실행 중 오류가 발생했습니다.");
      return true;
    }
  }
  getAllCommands() {
    const cmdList = [];
    for (const key in this.commands) {
      cmdList.push(this.commands[key]);
    }
    return cmdList;
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/command/BotManager.ts

class BotManager {
  static get instance() {
    if (!BotManager._instance) {
      BotManager._instance = new BotManager();
    }
    return BotManager._instance;
  }
  constructor() {
    this.botPlayers = {};
  }
  setBot(playerId, isBot) {
    if (isBot) {
      this.botPlayers[playerId] = true;
      sendAdminConsoleMessage(`[BOT] 플레이어 ${playerId}가 봇으로 설정되었습니다.`);
    } else {
      delete this.botPlayers[playerId];
      sendAdminConsoleMessage(`[BOT] 플레이어 ${playerId}의 봇 상태가 해제되었습니다.`);
    }
  }
  isBot(playerId) {
    return this.botPlayers[playerId] === true;
  }
  getAllBotIds() {
    const ids = [];
    for (const id in this.botPlayers) {
      if (this.botPlayers[id]) {
        ids.push(id);
      }
    }
    return ids;
  }
  getBotCount() {
    return this.getAllBotIds().length;
  }
  clearAllBots() {
    this.botPlayers = {};
    sendAdminConsoleMessage("[BOT] 모든 봇 상태가 초기화되었습니다.");
  }
  selectRandomTarget(candidates, excludeId) {
    const filtered = excludeId ? candidates.filter(id => id !== excludeId) : candidates;
    if (filtered.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }
  selectRandomApproval() {
    return Math.random() < 0.5 ? "approve" : "reject";
  }
  shouldUseAbility() {
    return Math.random() < 0.8;
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/command/BotActionScheduler.ts




class BotActionScheduler {
  constructor(flowManager) {
    this.BOT_ACTION_MIN_DELAY = 2;
    this.BOT_ACTION_MAX_DELAY = 5;
    this.flowManager = flowManager;
    this.botManager = BotManager.instance;
  }
  getRandomDelay() {
    return this.BOT_ACTION_MIN_DELAY + Math.random() * (this.BOT_ACTION_MAX_DELAY - this.BOT_ACTION_MIN_DELAY);
  }
  scheduleActionsForPhase(phase) {
    const botIds = this.botManager.getAllBotIds();
    if (botIds.length === 0) return;
    switch (phase) {
      case MafiaPhase.VOTING:
        this.scheduleVotingActions();
        break;
      case MafiaPhase.APPROVAL_VOTING:
        this.scheduleApprovalVotingActions();
        break;
      case MafiaPhase.NIGHT:
        this.scheduleNightActions();
        break;
    }
  }
  scheduleVotingActions() {
    const room = this.flowManager["room"];
    if (!room) return;
    const aliveBots = room.players.filter(p => p.isAlive && this.botManager.isBot(p.id));
    const candidates = room.players.filter(p => p.isAlive).map(p => p.id);
    for (const bot of aliveBots) {
      const delay = this.getRandomDelay();
      App.runLater(() => {
        if (this.flowManager.currentPhase !== MafiaPhase.VOTING) return;
        const target = this.botManager.selectRandomTarget(candidates, bot.id);
        if (target) {
          this.flowManager.processVote(bot.id, target);
          sendAdminConsoleMessage(`[BOT] ${bot.name}가 투표했습니다.`);
        }
      }, delay);
    }
  }
  scheduleApprovalVotingActions() {
    const room = this.flowManager["room"];
    if (!room) return;
    const defendantId = this.flowManager["defendantId"];
    const aliveBots = room.players.filter(p => p.isAlive && this.botManager.isBot(p.id) && p.id !== defendantId);
    for (const bot of aliveBots) {
      const delay = this.getRandomDelay();
      App.runLater(() => {
        if (this.flowManager.currentPhase !== MafiaPhase.APPROVAL_VOTING) return;
        const vote = this.botManager.selectRandomApproval();
        this.flowManager.processApprovalVote(bot.id, vote);
        sendAdminConsoleMessage(`[BOT] ${bot.name}가 ${vote === "approve" ? "찬성" : "반대"} 투표했습니다.`);
      }, delay);
    }
  }
  scheduleNightActions() {
    const room = this.flowManager["room"];
    if (!room) return;
    const aliveBots = room.players.filter(p => p.isAlive && this.botManager.isBot(p.id));
    for (const bot of aliveBots) {
      const job = getJobById(bot.jobId);
      if (!job || !job.nightAbility) continue;
      if (!this.botManager.shouldUseAbility()) continue;
      const delay = this.getRandomDelay();
      App.runLater(() => {
        if (this.flowManager.currentPhase !== MafiaPhase.NIGHT) return;
        this.executeNightAction(bot, job);
      }, delay);
    }
  }
  executeNightAction(bot, job) {
    if (!job) return;
    const room = this.flowManager["room"];
    if (!room) return;
    let candidates = [];
    switch (job.abilityType) {
      case JobAbilityType.ARMOR:
        candidates = [bot.id];
        break;
      case JobAbilityType.COPY:
        candidates = this.flowManager.deadPlayers;
        break;
      case JobAbilityType.KILL:
      case JobAbilityType.INVESTIGATE:
      case JobAbilityType.PROTECT:
      case JobAbilityType.CONTACT:
      case JobAbilityType.LISTEN:
      case JobAbilityType.BLOCK:
      case JobAbilityType.TRACK:
      case JobAbilityType.CONVERT:
      case JobAbilityType.SUICIDE:
      default:
        candidates = room.players.filter(p => p.isAlive && p.id !== bot.id).map(p => p.id);
        break;
    }
    const target = this.botManager.selectRandomTarget(candidates);
    if (target) {
      this.flowManager.processAbility(bot.id, target);
      sendAdminConsoleMessage(`[BOT] ${bot.name}(${job.name})가 능력을 사용했습니다.`);
    }
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/gameFlow/GameFlowManager.ts








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
  constructor() {
    this.state = GameState.WAITING;
    this.dayCount = 0;
    this.room = null;
    this.phaseEndCallback = null;
    this.nightActions = [];
    this.blockedVoters = [];
    this.journalistReport = null;
    this.werewolfTamed = false;
    this.werewolfTargetSelection = null;
    this.soldierArmor = {};
    this.terroristTarget = null;
    this.gravediggerJob = null;
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
    this.mafiaChatPlayers = [];
    this.chatMessages = [];
    this.mafiaChatWidgetShown = {};
    this.dayChatMessages = [];
    this.dayChatCooldowns = {};
    this.CHAT_COOLDOWN = 0.3;
    this.speedMultiplier = 1;
    this.currentPhase = MafiaPhase.DAY;
    this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
    this.phaseTimer = phaseDurations[this.currentPhase];
    this.botScheduler = new BotActionScheduler(this);
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
        }],
        fixedPosition: false
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
        }],
        fixedPosition: false
      });
    });
  }
  setGameRoom(room) {
    this.room = room;
  }
  startGame() {
    const widgetManager = WidgetManager.instance;
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
    this.mafiaChatPlayers = playersShuffled.filter(p => p.jobId === JobId.MAFIA).map(p => p.id);
    this.chatMessages = [];
    this.mafiaChatWidgetShown = {};
    this.state = GameState.IN_PROGRESS;
    this.dayCount = 1;
    if (this.room) {
      this.room.resetAllPlayersReady();
    }
    this.blockedVoters = [];
    this.journalistReport = null;
    this.werewolfTamed = false;
    this.werewolfTargetSelection = null;
    this.soldierArmor = {};
    this.terroristTarget = null;
    this.gravediggerJob = null;
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
        widgetManager.hideAllWidgets(gamePlayer);
        this.showRoleCard(gamePlayer, player.jobId);
      }
    });
    this.initGameStatusWidgets();
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
  updateGameState(dt) {
    if (this.state !== GameState.IN_PROGRESS) return;
    if (this.phaseTimer > 0) {
      this.phaseTimer -= dt * this.speedMultiplier;
      if (Math.floor(this.phaseTimer) !== Math.floor(this.phaseTimer + dt)) {
        this.updateAllGameStatusWidgets();
      }
    }
    if (this.currentPhase === MafiaPhase.DAY) {
      this.updateChatCooldowns();
    }
    if (this.phaseTimer <= 0) {
      if (this.phaseEndCallback) {
        const callback = this.phaseEndCallback;
        this.phaseEndCallback = null;
        callback();
      } else {
        this.nextPhase();
      }
    }
  }
  getAvailableJobs() {
    const jobs = getJobsByGameMode(this.room.gameMode.id);
    return [...jobs].sort(() => Math.random() - 0.5);
  }
  showRoleCard(player, jobId) {
    const job = getJobById(jobId);
    if (!job) return;
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.ROLE_CARD);
    widgetManager.sendMessageToWidget(player, WidgetType.ROLE_CARD, {
      type: "role_info",
      roleId: job.id,
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
      const widgetManager = WidgetManager.instance;
      widgetManager.showWidget(gamePlayer, WidgetType.GAME_STATUS);
      this.updateGameStatusWidget(gamePlayer, player);
    });
  }
  updateGameStatusWidget(gamePlayer, player) {
    var _a;
    const widgetManager = WidgetManager.instance;
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.GAME_STATUS, {
      type: "updateGameStatus",
      phase: this.currentPhase,
      day: this.dayCount,
      players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
      myRole: getJobById(player.jobId),
      myPlayerId: player.id,
      timeRemaining: this.phaseTimer,
      serverTime: Date.now()
    });
  }
  nextPhase() {
    if (this.state !== GameState.IN_PROGRESS) {
      this.sayToRoom("게임이 진행 중이 아닙니다.");
      return;
    }
    this.cleanupPhaseWidgets();
    if (this.currentPhase === MafiaPhase.APPROVAL_VOTING) {
      this.blockedVoters = [];
    }
    const currentIndex = this.phaseCycle.indexOf(this.currentPhase);
    const nextIndex = (currentIndex + 1) % this.phaseCycle.length;
    if (this.phaseCycle[nextIndex] === MafiaPhase.FINAL_DEFENSE) {
      this.defenseText = "";
    }
    if (this.phaseCycle[nextIndex] === MafiaPhase.APPROVAL_VOTING) {
      this.approvalVoteResults = {
        approve: 0,
        reject: 0
      };
      this.approvalPlayerVotes = {};
    }
    if (this.phaseCycle[nextIndex] === MafiaPhase.VOTING) {
      this.voteResults = {};
      this.playerVotes = {};
    }
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
    const widgetManager = WidgetManager.instance;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      switch (this.currentPhase) {
        case MafiaPhase.NIGHT:
          widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
          break;
        case MafiaPhase.DAY:
          break;
        case MafiaPhase.VOTING:
          widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
          break;
        case MafiaPhase.FINAL_DEFENSE:
          widgetManager.hideWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
          break;
        case MafiaPhase.APPROVAL_VOTING:
          widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
          this.approvalVoteResults = {
            approve: 0,
            reject: 0
          };
          this.approvalPlayerVotes = {};
          break;
      }
    });
  }
  executePhaseActions() {
    if (!this.room) return;
    const widgetManager = WidgetManager.instance;
    switch (this.currentPhase) {
      case MafiaPhase.NIGHT:
        {
          this.sayToRoom(`밤 단계 - 마피아가 희생자를 선택합니다.`);
          this.nightActions = [];
          this.werewolfTargetSelection = null;
          this.mafiaChatWidgetShown = {};
          this.room.players.forEach(player => {
            if (player.jobId === JobId.SPY && player.isAlive) {
              player.abilityUses = 1;
            }
          });
          if (this.mafiaChatPlayers.length >= 2) {
            App.runLater(() => {
              this.activateMafiaChat();
            }, 0);
          }
          this.room.actionToRoomPlayers(player => {
            var _a;
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
            if (player.isAlive) {
              widgetManager.showWidget(gamePlayer, WidgetType.NIGHT_ACTION);
              let roleId = player.jobId.toLowerCase();
              if (player.jobId === JobId.WEREWOLF && this.werewolfTamed) {
                roleId = "werewolf_tamed";
              }
              widgetManager.sendMessageToWidget(gamePlayer, WidgetType.NIGHT_ACTION, {
                type: "init",
                players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                role: roleId,
                timeLimit: phaseDurations[MafiaPhase.NIGHT],
                serverTime: Date.now()
              });
              if (this.mafiaChatPlayers.includes(player.id)) {
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'setReadOnly',
                  channel: 'mafia',
                  readOnly: false
                });
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'switchChannel',
                  channel: 'mafia'
                });
              }
              if (this.loverPlayers.includes(player.id)) {
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'setReadOnly',
                  channel: 'lover',
                  readOnly: false
                });
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'switchChannel',
                  channel: 'lover'
                });
              }
              if (player.jobId === JobId.MEDIUM && player.isAlive) {
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'setReadOnly',
                  channel: 'dead',
                  readOnly: false
                });
                widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                  type: 'switchChannel',
                  channel: 'dead'
                });
              }
              widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
                type: 'setReadOnly',
                channel: 'day',
                readOnly: true
              });
              const canUseMafiaChat = this.mafiaChatPlayers.includes(player.id) || player.jobId === JobId.WEREWOLF && this.werewolfTamed;
              if (this.mafiaChatPlayers.length >= 2 && canUseMafiaChat) {
                App.runLater(() => {
                  if (gamePlayer && gamePlayer.tag.widget.nightAction) {
                    this.initMafiaChat(gamePlayer);
                    this.mafiaChatWidgetShown[player.id] = true;
                  }
                }, 1);
              }
              widgetManager.clearMessageHandlers(gamePlayer, WidgetType.NIGHT_ACTION);
              widgetManager.registerMessageHandler(gamePlayer, WidgetType.NIGHT_ACTION, (player, data) => {
                var _a;
                const mafiaPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === player.id);
                if (!mafiaPlayer) return;
                switch (data.type) {
                  case "kill":
                    if (mafiaPlayer.jobId === JobId.MAFIA) {
                      this.mafiaAction(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "investigate":
                    if (mafiaPlayer.jobId === JobId.POLICE) {
                      this.policeAction(data.targetId, player);
                    }
                    break;
                  case "heal":
                    if (mafiaPlayer.jobId === JobId.DOCTOR) {
                      this.doctorAction(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "contact":
                    if (mafiaPlayer.jobId === JobId.SPY) {
                      this.spyAction(data.targetId, player);
                    } else if (mafiaPlayer.jobId === JobId.MADAM) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "listen":
                    if (mafiaPlayer.jobId === JobId.MEDIUM) {
                      this.processAbility(mafiaPlayer.id, data.targetId);
                    }
                    break;
                  case "block":
                    if (mafiaPlayer.jobId === JobId.GANGSTER) {
                      this.gangsterAction(data.targetId, player);
                    }
                    break;
                  case "track":
                    if (mafiaPlayer.jobId === JobId.DETECTIVE) {
                      this.detectiveAction(data.targetId, player);
                    }
                    break;
                  case "announce":
                    if (mafiaPlayer.jobId === JobId.JOURNALIST) {
                      this.journalistAction(data.targetId, player);
                    }
                    break;
                  case "convert":
                    if (mafiaPlayer.jobId === JobId.WEREWOLF) {
                      this.werewolfAction(data.targetId, player);
                    }
                    break;
                  case "suicide":
                    if (mafiaPlayer.jobId === JobId.TERRORIST) {
                      this.terroristAction(data.targetId, player);
                    }
                    break;
                  case "seduce":
                    if (mafiaPlayer.jobId === JobId.MADAM) {
                      this.madamAction(mafiaPlayer.id, data.targetId, player);
                    }
                    break;
                  case "chatMessage":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.broadcastLoverMessage(player, data.message);
                    } else if (data.chatTarget === "dead") {
                      this.broadcastPermanentDeadMessage(player, data.message);
                    } else if (data.chatTarget === "mafia" && (mafiaPlayer.jobId === JobId.MAFIA || mafiaPlayer.jobId === JobId.SPY || mafiaPlayer.jobId === JobId.WEREWOLF && this.werewolfTamed)) {
                      this.broadcastMafiaMessage(player, data.message);
                    }
                    break;
                  case "initChat":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.initLoverChat(player);
                    } else if (data.chatTarget === "dead") {
                      this.initMediumChat(player);
                    } else if (data.chatTarget === "mafia" && (mafiaPlayer.jobId === JobId.MAFIA || mafiaPlayer.jobId === JobId.SPY || mafiaPlayer.jobId === JobId.WEREWOLF && this.werewolfTamed)) {
                      this.initMafiaChat(player);
                    }
                    break;
                }
              });
            }
            if (player.jobId === JobId.LOVER) {
              App.runLater(() => {
                const gamePlayer = getPlayerById(player.id);
                if (gamePlayer && gamePlayer.tag.widget.nightAction) {
                  this.initLoverChat(gamePlayer);
                }
              }, 1);
            }
            if (player.jobId === JobId.MAFIA && this.mafiaChatPlayers.includes(player.id)) {
              App.runLater(() => {
                const gamePlayer = getPlayerById(player.id);
                if (gamePlayer && gamePlayer.tag.widget.nightAction) {
                  this.initMafiaChat(gamePlayer);
                }
              }, 1);
            }
            if (player.jobId === JobId.SPY && this.mafiaChatPlayers.includes(player.id)) {
              App.runLater(() => {
                const gamePlayer = getPlayerById(player.id);
                if (gamePlayer && gamePlayer.tag.widget.nightAction) {
                  this.initMafiaChat(gamePlayer);
                }
              }, 1);
            }
          });
          this.phaseTimer = phaseDurations[MafiaPhase.NIGHT];
          this.phaseEndCallback = () => {
            this.evaluateNightActions();
            this.nextPhase();
          };
        }
        break;
      case MafiaPhase.DAY:
        {
          this.sayToRoom(`낮 단계 - 플레이어들이 토론을 진행합니다.`);
          if (this.journalistReport) {
            this.showRoomLabel(`📰 특종! ${this.journalistReport.targetName}님의 직업은 ${this.journalistReport.targetJob}입니다!`, 5000);
            this.journalistReport = null;
          }
          this.dayChatMessages = [];
          this.dayChatCooldowns = {};
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
            if (player.isAlive) {
              const channels = ['day'];
              const readOnlyChannels = [];
              if (this.mafiaChatPlayers.includes(player.id)) {
                channels.push('mafia');
                readOnlyChannels.push('mafia');
              }
              if (this.loverPlayers.includes(player.id)) {
                channels.push('lover');
                readOnlyChannels.push('lover');
              }
              if (player.jobId === JobId.MEDIUM) {
                channels.push('dead');
                readOnlyChannels.push('dead');
              }
              this.initUnifiedChat(gamePlayer, channels, 'day', readOnlyChannels);
            }
          });
          this.phaseTimer = phaseDurations[MafiaPhase.DAY];
          this.phaseEndCallback = () => this.nextPhase();
          this.checkWinCondition();
        }
        break;
      case MafiaPhase.VOTING:
        {
          this.sayToRoom(`투표 단계 - 마피아로 의심되는 플레이어에게 투표하세요.`);
          this.voteResults = {};
          this.playerVotes = {};
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (player.isAlive) {
              this.showVoteWidget(player);
            }
          });
          this.phaseTimer = phaseDurations[MafiaPhase.VOTING];
          this.phaseEndCallback = () => this.finalizeVoting();
        }
        break;
      case MafiaPhase.FINAL_DEFENSE:
        {
          this.sayToRoom(`최후 변론 단계 - 투표 결과로 선정된 플레이어의 최후 변론 시간입니다.`);
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
            this.sayToRoom(`투표 결과가 없거나 동률이어서 변론 없이 진행됩니다.`);
            this.phaseTimer = 5;
            this.phaseEndCallback = () => this.nextPhase();
            return;
          }
          defendantName = defendant.name;
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (gamePlayer) {
              this.showFinalDefenseWidget(player, defendant);
            }
          });
          this.phaseTimer = phaseDurations[MafiaPhase.FINAL_DEFENSE];
          this.phaseEndCallback = () => this.nextPhase();
        }
        break;
      case MafiaPhase.APPROVAL_VOTING:
        {
          this.sayToRoom(`찬반 투표 단계 - 최후 변론을 들은 후 처형에 대한 찬반 투표를 진행합니다.`);
          this.approvalVoteResults = {
            approve: 0,
            reject: 0
          };
          this.approvalPlayerVotes = {};
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (gamePlayer) {
              const widgetManager = WidgetManager.instance;
              widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
            }
          });
          let maxVotes = 0;
          let defendantId = null;
          const defendantName = "";
          for (const [playerId, votes] of Object.entries(this.voteResults)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              defendantId = playerId;
            }
          }
          const defendant = this.room.players.find(p => p.id === defendantId);
          if (!defendant) {
            this.sayToRoom(`투표 결과 동률로 처형이 진행되지 않습니다.`);
            this.nextPhase();
            return;
          }
          this.room.actionToRoomPlayers(player => {
            if (player.isAlive && player.id !== defendant.id) {
              const gamePlayer = getPlayerById(player.id);
              if (gamePlayer) {
                this.showApprovalVoteWidget(player, defendant);
              }
            }
          });
          this.phaseTimer = phaseDurations[MafiaPhase.APPROVAL_VOTING];
          this.phaseEndCallback = () => this.finalizeApprovalVoting();
        }
        break;
      default:
        this.sayToRoom(`알 수 없는 단계입니다.`);
    }
    if (this.dayCount == 0) this.dayCount = 1;
  }
  showVoteWidget(player) {
    var _a;
    if (!player.isAlive) return;
    const gamePlayer = getPlayerById(player.id);
    if (!gamePlayer) return;
    const widgetManager = WidgetManager.instance;
    widgetManager.clearMessageHandlers(gamePlayer, WidgetType.VOTE);
    widgetManager.showWidget(gamePlayer, WidgetType.VOTE);
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.VOTE, {
      type: "init",
      players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players.filter(p => p.isAlive)) || [],
      myPlayerId: player.id,
      timeLimit: phaseDurations[MafiaPhase.VOTING],
      serverTime: Date.now(),
      blockedVoters: this.blockedVoters
    });
    widgetManager.registerMessageHandler(gamePlayer, WidgetType.VOTE, (sender, data) => {
      var _a;
      if (data.type === "vote" && data.targetId) {
        const mafiaPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === sender.id);
        if (mafiaPlayer && mafiaPlayer.isAlive) {
          if (mafiaPlayer.jobId === JobId.MADAM) {
            this.processVote(mafiaPlayer.id, data.targetId);
            this.madamAction(mafiaPlayer.id, data.targetId, sender);
          } else {
            this.processVote(mafiaPlayer.id, data.targetId);
          }
        } else {}
      }
    });
  }
  findFinalDefenseDefendant() {
    let maxVotes = 0;
    let defendantId = null;
    for (const [playerId, votes] of Object.entries(this.voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        defendantId = playerId;
      }
    }
    return defendantId;
  }
  showFinalDefenseWidget(player, targetPlayer) {
    const gamePlayer = getPlayerById(player.id);
    if (!gamePlayer) return;
    const widgetManager = WidgetManager.instance;
    widgetManager.clearMessageHandlers(gamePlayer, WidgetType.FINAL_DEFENSE);
    widgetManager.showWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.FINAL_DEFENSE, {
      type: "init",
      timeLimit: phaseDurations[MafiaPhase.FINAL_DEFENSE],
      serverTime: Date.now(),
      isDefendant: player.id === targetPlayer.id,
      defendantName: targetPlayer.name,
      defendantId: targetPlayer.id,
      myPlayerId: player.id
    });
    widgetManager.registerMessageHandler(gamePlayer, WidgetType.FINAL_DEFENSE, (sender, data) => {
      if (data.type === "submitDefense") {
        const currentDefendantId = this.findFinalDefenseDefendant();
        if (sender.id === currentDefendantId) {
          this.defenseText = data.defense || "";
          this.broadcastDefense(this.defenseText);
        }
      }
    });
  }
  showApprovalVoteWidget(player, targetPlayer) {
    if (!player.isAlive || player.id === targetPlayer.id) return;
    const gamePlayer = getPlayerById(player.id);
    if (!gamePlayer) return;
    const widgetManager = WidgetManager.instance;
    App.runLater(() => {
      widgetManager.clearMessageHandlers(gamePlayer, WidgetType.APPROVAL_VOTE);
      widgetManager.showWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.APPROVAL_VOTE, {
        type: "init",
        timeLimit: phaseDurations[MafiaPhase.APPROVAL_VOTING],
        serverTime: Date.now(),
        defendantName: targetPlayer.name,
        defendantId: targetPlayer.id,
        myPlayerId: player.id,
        isAlive: player.isAlive,
        defenseText: this.defenseText
      });
      widgetManager.registerMessageHandler(gamePlayer, WidgetType.APPROVAL_VOTE, (sender, data) => {
        var _a;
        if (data.type === "submitApprovalVote" && (data.vote === "approve" || data.vote === "reject")) {
          const mafiaPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === sender.id);
          const currentDefendantId = this.findFinalDefenseDefendant();
          if (mafiaPlayer && mafiaPlayer.isAlive && mafiaPlayer.id !== currentDefendantId) {
            this.processApprovalVote(mafiaPlayer.id, data.vote);
          } else {}
        }
      });
    }, 0.1);
  }
  showPermanentDeadChatWidget(player) {}
  showMediumChatWidget(player) {}
  getDeadPlayers() {
    return [...this.deadPlayers];
  }
  processVote(voterId, targetId) {
    if (this.currentPhase !== MafiaPhase.VOTING) {
      this.sayToRoom(`현재 단계는 투표 단계가 아닙니다.`);
      return;
    }
    if (this.blockedVoters.includes(voterId)) {
      const voter = getPlayerById(voterId);
      if (voter && voter.tag.widget.voteWidget) {
        voter.tag.widget.voteWidget.sendMessage({
          type: "voteRejected",
          message: "건달에 의해 투표가 차단되었습니다."
        });
      }
      return;
    }
    if (this.playerVotes[voterId] === targetId) {
      const voter = getPlayerById(voterId);
      if (voter && voter.tag.widget.voteWidget) {
        voter.tag.widget.voteWidget.sendMessage({
          type: "voteRejected",
          message: "이미 해당 플레이어에게 투표했습니다."
        });
      }
      return;
    }
    const targetPlayer = this.room.players.find(p => p.id === targetId);
    if (!targetPlayer || !targetPlayer.isAlive) {
      const voter = getPlayerById(voterId);
      if (voter && voter.tag.widget.voteWidget) {
        voter.tag.widget.voteWidget.sendMessage({
          type: "voteRejected",
          message: "대상 플레이어가 유효하지 않습니다."
        });
      }
      return;
    }
    if (this.playerVotes[voterId]) {
      const previousTargetId = this.playerVotes[voterId];
      if (this.voteResults[previousTargetId] > 0) {
        this.voteResults[previousTargetId]--;
      }
    }
    this.playerVotes[voterId] = targetId;
    if (!this.voteResults[targetId]) {
      this.voteResults[targetId] = 1;
    } else {
      this.voteResults[targetId]++;
    }
    const voterInfo = this.room.players.find(p => p.id === voterId);
    const targetInfo = this.room.players.find(p => p.id === targetId);
    this.sayToRoom(`[투표] ${voterInfo === null || voterInfo === void 0 ? void 0 : voterInfo.name}님이 ${targetInfo === null || targetInfo === void 0 ? void 0 : targetInfo.name}님에게 투표했습니다. (현재 ${this.voteResults[targetId]}표)`);
    const voter = getPlayerById(voterId);
    if (voter && voter.tag.widget.voteWidget) {
      voter.tag.widget.voteWidget.sendMessage({
        type: "voteConfirmed",
        targetId: targetId
      });
    }
    this.updateVoteResults();
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const aliveVoters = Object.keys(this.playerVotes).filter(playerId => {
      const player = this.room.players.find(p => p.id === playerId);
      return player && player.isAlive;
    });
    if (aliveVoters.length >= alivePlayers.length) {
      if (this.phaseEndCallback) {
        const callback = this.phaseEndCallback;
        this.phaseEndCallback = null;
        callback();
      }
    }
  }
  updateVoteResults() {
    if (!this.room) return;
    const widgetManager = WidgetManager.instance;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.VOTE, {
        type: "updateVotes",
        votes: this.voteResults
      });
    });
  }
  finalizeApprovalVoting() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget || !gamePlayer.tag.widget.approvalVote) return;
      gamePlayer.tag.widget.approvalVote.sendMessage({
        type: "showResults",
        results: this.approvalVoteResults,
        isFinalResult: true
      });
    });
    const defendant = this.findFinalDefenseDefendant();
    const defendantPlayer = defendant ? this.room.players.find(p => p.id === defendant) : null;
    const approveVotes = this.approvalVoteResults.approve || 0;
    const rejectVotes = this.approvalVoteResults.reject || 0;
    const totalVotes = approveVotes + rejectVotes;
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const votablePlayerCount = alivePlayers.length - 1;
    const majorityThreshold = Math.floor(votablePlayerCount / 2) + 1;
    this.sayToRoom(`찬반 투표 결과: 찬성 ${approveVotes}표, 반대 ${rejectVotes}표 (과반수: ${majorityThreshold}표)`);
    if (defendantPlayer && approveVotes >= majorityThreshold) {
      if (defendantPlayer.jobId === JobId.POLITICIAN) {
        this.sayToRoom(`${defendantPlayer.name}님은 정치인이라 처형되지 않습니다!`);
      } else {
        defendantPlayer.isAlive = false;
        this.sayToRoom(`${defendantPlayer.name}님이 처형되었습니다.`);
        if (defendantPlayer.jobId === JobId.TERRORIST && this.terroristTarget) {
          const targetPlayer = this.room.players.find(p => p.id === this.terroristTarget);
          if (targetPlayer && targetPlayer.isAlive) {
            targetPlayer.isAlive = false;
            this.sayToRoom(`💣 ${defendantPlayer.name}님의 자폭으로 ${targetPlayer.name}님도 함께 처형되었습니다!`);
            const targetGamePlayer = getPlayerById(targetPlayer.id);
            if (targetGamePlayer) {
              this.showPermanentDeadChatWidget(targetGamePlayer);
            }
          }
          this.terroristTarget = null;
        }
        const gamePlayer = getPlayerById(defendantPlayer.id);
        if (gamePlayer) {
          this.showPermanentDeadChatWidget(gamePlayer);
        }
      }
    } else if (defendantPlayer) {
      this.sayToRoom(`처형이 부결되었습니다. (찬성 ${approveVotes}표, 과반수 ${majorityThreshold}표 필요)`);
    }
    this.updateAllGameStatusWidgets();
    this.phaseTimer = 5;
    this.phaseEndCallback = () => {
      this.room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;
        const widgetManager = WidgetManager.instance;
        widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
      });
      if (this.checkWinCondition()) {
        return;
      }
      if (this.state === GameState.IN_PROGRESS) {
        this.nextPhase();
      }
    };
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
    const winMessage = winnerTeam === JobTeam.MAFIA ? "마피아 승리!" : "시민 승리!";
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
      if (this.room) {
        this.room.actionToRoomPlayers(player => {
          const gamePlayer = getPlayerById(player.id);
          if (!gamePlayer) return;
          const widgetManager = WidgetManager.instance;
          widgetManager.hideWidget(gamePlayer, WidgetType.GAME_STATUS);
          widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
          widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
          widgetManager.hideWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
          widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
          widgetManager.hideWidget(gamePlayer, WidgetType.ROLE_CARD);
          widgetManager.hideWidget(gamePlayer, WidgetType.UNIFIED_CHAT);
          if (gamePlayer.tag.widget.room) {
            gamePlayer.tag.widget.room.sendMessage({
              type: "gameEnded"
            });
          }
        });
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
      const widgetManager = WidgetManager.instance;
      widgetManager.cleanupPlayerWidgets(gamePlayer);
    });
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
    this.mafiaChatPlayers = [];
    this.chatMessages = [];
    this.speedMultiplier = 1;
    this.mafiaChatWidgetShown = {};
  }
  setPhase(phase) {
    this.currentPhase = phase;
    this.botScheduler.scheduleActionsForPhase(phase);
  }
  getCurrentPhase() {
    return this.currentPhase;
  }
  isGameInProgress() {
    return this.state === GameState.IN_PROGRESS;
  }
  isMafia(player) {
    const job = getJobById(player.jobId);
    return (job === null || job === void 0 ? void 0 : job.team) === JobTeam.MAFIA || player.jobId === JobId.WEREWOLF && this.werewolfTamed;
  }
  getMafiaCount() {
    if (!this.room) return 0;
    return this.room.players.filter(p => p.isAlive && this.isMafia(p)).length;
  }
  processAbility(playerId, targetId) {
    if (!this.room) return;
    const player = this.room.getPlayer(playerId);
    if (!player || !player.isAlive) return;
    const job = getJobById(player.jobId);
    if (!job) return;
    if (player.seducedBy) {
      const gamePlayer = getPlayerById(player.id);
      if (gamePlayer && gamePlayer.tag.widget.nightAction) {
        gamePlayer.tag.widget.nightAction.sendMessage({
          type: "abilityBlocked",
          message: "당신은 마담에게 유혹당해 능력을 사용할 수 없습니다."
        });
      }
      return;
    }
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
    const gamePlayer = getPlayerById(playerId);
    if (gamePlayer && gamePlayer.tag.widget.nightAction) {
      gamePlayer.tag.widget.nightAction.sendMessage({
        type: "abilityResult",
        message: "능력을 사용했습니다."
      });
    }
  }
  broadcastDefense(defense) {
    if (!this.room) return;
    this.defenseText = defense;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget || !gamePlayer.tag.widget.finalDefense) return;
      gamePlayer.tag.widget.finalDefense.sendMessage({
        type: "updateDefense",
        defense: defense
      });
    });
    this.sayToRoom(`최후 변론 내용: ${defense.substring(0, 100)}${defense.length > 100 ? "..." : ""}`);
  }
  processApprovalVote(voterId, vote) {
    if (this.currentPhase !== MafiaPhase.APPROVAL_VOTING) {
      this.sayToRoom(`현재 단계는 찬반 투표 단계가 아닙니다.`);
      return;
    }
    if (this.approvalPlayerVotes[voterId] === vote) {
      this.sayToRoom(`이미 ${vote === "approve" ? "찬성" : "반대"}에 투표했습니다.`);
      return;
    }
    if (this.approvalPlayerVotes[voterId]) {
      const previousVote = this.approvalPlayerVotes[voterId];
      if (this.approvalVoteResults[previousVote] > 0) {
        this.approvalVoteResults[previousVote]--;
      }
    }
    this.approvalPlayerVotes[voterId] = vote;
    if (!this.approvalVoteResults[vote]) {
      this.approvalVoteResults[vote] = 1;
    } else {
      this.approvalVoteResults[vote]++;
    }
    this.updateApprovalVoteResults();
    const alivePlayers = this.room.players.filter(p => p.isAlive);
    const votablePlayerCount = alivePlayers.length - 1;
    if (Object.keys(this.approvalPlayerVotes).length >= votablePlayerCount) {
      if (this.phaseEndCallback) {
        const callback = this.phaseEndCallback;
        this.phaseEndCallback = null;
        callback();
      }
    }
  }
  updateApprovalVoteResults() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.approvalVote) return;
      if (this.approvalPlayerVotes[player.id]) {
        gamePlayer.tag.widget.approvalVote.sendMessage({
          type: "showResults",
          results: this.approvalVoteResults
        });
      }
    });
  }
  initLoverChat(player) {
    if (!player.tag.widget || !player.tag.widget.nightAction) return;
    player.tag.widget.nightAction.sendMessage({
      type: "initChat",
      chatTarget: "lover"
    });
    this.chatMessages.filter(msg => msg.target === "lover").forEach(msg => {
      player.tag.widget.nightAction.sendMessage({
        type: "chatMessage",
        chatTarget: "lover",
        sender: msg.senderName,
        message: msg.message
      });
    });
  }
  initMediumChat(player) {
    this.chatMessages.filter(msg => msg.target === "dead").forEach(msg => {
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
    const widgetManager = WidgetManager.instance;
    this.chatMessages.push({
      target: "lover",
      sender: sender.id,
      senderName: sender.name,
      message: message
    });
    this.loverPlayers.forEach(loverId => {
      var _a;
      if (loverId === sender.id) return;
      const player = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === loverId);
      if (!player || !player.isAlive) return;
      const loverPlayer = getPlayerById(loverId);
      if (loverPlayer) {
        if (loverPlayer.tag.widget.nightAction) {
          loverPlayer.tag.widget.nightAction.sendMessage({
            type: "chatMessage",
            chatTarget: "lover",
            sender: sender.name,
            message: message
          });
        }
        widgetManager.sendMessageToWidget(loverPlayer, WidgetType.UNIFIED_CHAT, {
          type: 'newMessage',
          channel: 'lover',
          senderId: sender.id,
          senderName: sender.name,
          message: message,
          timestamp: Date.now()
        });
      }
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
  mafiaAction(mafiaId, targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: mafiaId,
      targetId: targetPlayerId,
      jobId: JobId.MAFIA
    });
    const gamePlayer = getPlayerById(mafiaId);
    if (gamePlayer && gamePlayer.tag.widget.nightAction) {
      gamePlayer.tag.widget.nightAction.sendMessage({
        type: "abilityResult",
        message: "살해 대상이 선택되었습니다."
      });
    }
  }
  doctorAction(doctorId, targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: doctorId,
      targetId: targetPlayerId,
      jobId: JobId.DOCTOR
    });
    const gamePlayer = getPlayerById(doctorId);
    if (gamePlayer && gamePlayer.tag.widget.nightAction) {
      gamePlayer.tag.widget.nightAction.sendMessage({
        type: "abilityResult",
        message: "치료 대상이 선택되었습니다."
      });
    }
  }
  policeAction(targetPlayerId, policePlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: policePlayer.id,
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
    if (!this.room) return;
    const killedPlayers = [];
    const protectedPlayers = [];
    const blockedPlayers = [];
    const werewolfTargets = [];
    this.nightActions.forEach(action => {
      const job = getJobById(action.jobId);
      if (!job) return;
      if (job.abilityType === JobAbilityType.PROTECT) {
        protectedPlayers.push(action.targetId);
      }
    });
    this.nightActions.forEach(action => {
      const job = getJobById(action.jobId);
      if (!job) return;
      if (job.abilityType === JobAbilityType.BLOCK) {
        blockedPlayers.push(action.targetId);
        this.blockedVoters.push(action.targetId);
      }
    });
    this.nightActions.forEach(action => {
      const job = getJobById(action.jobId);
      if (!job) return;
      if (job.abilityType === JobAbilityType.KILL || action.jobId === JobId.WEREWOLF && this.werewolfTamed) {
        const target = this.room.players.find(p => p.id === action.targetId);
        if (!target || !target.isAlive) return;
        if (target.jobId === JobId.WEREWOLF && action.jobId === JobId.MAFIA) {
          if (!this.werewolfTamed) {
            this.werewolfTamed = true;
            if (!this.mafiaChatPlayers.includes(target.id)) {
              this.mafiaChatPlayers.push(target.id);
            }
            this.showRoomLabel(`짐승인간이 마피아에게 길들여졌습니다!`);
            const werewolfGamePlayer = getPlayerById(target.id);
            if (werewolfGamePlayer && werewolfGamePlayer.tag.widget.nightAction) {
              werewolfGamePlayer.tag.widget.nightAction.sendMessage({
                type: "werewolfTamed",
                message: "마피아에게 길들여졌습니다! 이제 밤에 플레이어를 제거할 수 있습니다."
              });
            }
          }
          return;
        }
        if (target.jobId === JobId.SOLDIER && !this.soldierArmor[target.id]) {
          this.soldierArmor[target.id] = true;
          this.showRoomLabel(`${target.name}님이 방탄복으로 공격을 막았습니다!`);
          const soldierGamePlayer = getPlayerById(target.id);
          if (soldierGamePlayer && soldierGamePlayer.tag.widget.gameStatus) {
            soldierGamePlayer.tag.widget.gameStatus.sendMessage({
              type: "armorUsed"
            });
          }
          return;
        }
        if (!protectedPlayers.includes(action.targetId) && !target.isImmune) {
          killedPlayers.push(action.targetId);
        } else if (target.isImmune) {
          target.isImmune = false;
        }
      }
      if (action.jobId === JobId.WEREWOLF && !this.werewolfTamed) {
        werewolfTargets.push({
          werewolfId: action.playerId,
          targetId: action.targetId
        });
        this.werewolfTargetSelection = action.targetId;
      }
    });
    werewolfTargets.forEach(({
      werewolfId,
      targetId
    }) => {
      if (killedPlayers.includes(targetId)) {
        const werewolf = this.room.players.find(p => p.id === werewolfId);
        if (werewolf) {
          this.werewolfTamed = true;
          if (!this.mafiaChatPlayers.includes(werewolfId)) {
            this.mafiaChatPlayers.push(werewolfId);
          }
          this.showRoomLabel(`짐승인간이 마피아에게 길들여졌습니다!`);
          const werewolfGamePlayer = getPlayerById(werewolfId);
          if (werewolfGamePlayer && werewolfGamePlayer.tag.widget.nightAction) {
            werewolfGamePlayer.tag.widget.nightAction.sendMessage({
              type: "werewolfTamed",
              message: "선택한 플레이어가 마피아에게 살해당했습니다! 마피아에게 길들여졌습니다."
            });
          }
        }
      }
    });
    if (this.dayCount === 1 && killedPlayers.length > 0) {
      const gravediggers = this.room.players.filter(p => p.jobId === JobId.GRAVEDIGGER && p.isAlive);
      if (gravediggers.length > 0 && killedPlayers.length > 0) {
        const deadPlayer = this.room.players.find(p => p.id === killedPlayers[0]);
        if (deadPlayer) {
          this.gravediggerJob = deadPlayer.jobId;
          gravediggers.forEach(gravedigger => {
            var _a;
            gravedigger.jobId = deadPlayer.jobId;
            const gamePlayer = getPlayerById(gravedigger.id);
            if (gamePlayer && gamePlayer.tag.widget.main) {
              gamePlayer.tag.widget.main.sendMessage({
                type: "job_changed",
                newJob: ((_a = getJobById(deadPlayer.jobId)) === null || _a === void 0 ? void 0 : _a.name) || "알 수 없음"
              });
            }
          });
        }
      }
    }
    blockedPlayers.forEach(playerId => {
      const player = this.room.players.find(p => p.id === playerId);
      if (player) {
        player.isBlocked = true;
      }
    });
    this.room.players.forEach(player => {
      if (player.seducedBy) {
        player.seducedBy = undefined;
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
          this.updateUnifiedChatOnDeath(gamePlayer);
        }
      }
    });
    this.nightActions = [];
    this.checkWinCondition();
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
    if (tiedPlayers.length > 1 || maxVotes === 0 || Object.keys(this.voteResults).length === 0) {
      const reason = tiedPlayers.length > 1 ? "동률로" : Object.keys(this.voteResults).length === 0 ? "투표가 없어" : "유효표가 없어";
      this.sayToRoom(`투표 결과 ${reason} 처형이 진행되지 않습니다. (투표수: ${Object.keys(this.voteResults).length}, 최대표: ${maxVotes})`);
      this.room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (gamePlayer) {
          const widgetManager = WidgetManager.instance;
          widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
        }
      });
      this.phaseTimer = 3;
      this.phaseEndCallback = () => {
        this.cleanupPhaseWidgets();
        this.setPhase(MafiaPhase.NIGHT);
        this.sayToRoom(`단계 전환 -> ${this.currentPhase} (Day ${this.dayCount})`);
        this.updateAllGameStatusWidgets();
        this.executePhaseActions();
      };
      return null;
    }
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (gamePlayer) {
        const widgetManager = WidgetManager.instance;
        widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
      }
    });
    this.phaseTimer = 3;
    this.phaseEndCallback = () => this.nextPhase();
    return executedPlayerId;
  }
  broadcastPermanentDeadMessage(sender, message) {
    this.chatMessages.push({
      target: "dead",
      sender: sender.id,
      senderName: sender.name,
      message: message
    });
    this.broadcastDeadChatMessage(sender, message);
  }
  processDayChatMessage(player, message) {
    var _a;
    if (!this.room) return;
    if (this.currentPhase !== MafiaPhase.DAY) return;
    if (CommandParser.isCommand(message)) {
      const parsed = CommandParser.parse(message);
      if (parsed) {
        const executed = CommandManager.instance.executeCommand(parsed.command, parsed.args, {
          player: player,
          room: this.room,
          flowManager: this
        });
        if (executed) {
          return;
        }
      }
    }
    const mafiaPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === player.id);
    if (!mafiaPlayer || !mafiaPlayer.isAlive) return;
    const currentTime = Date.now();
    const lastMessageTime = this.dayChatCooldowns[player.id] || 0;
    const cooldownTime = this.CHAT_COOLDOWN * 1000;
    if (lastMessageTime !== 0 && currentTime - lastMessageTime < cooldownTime) {
      const widgetManager = WidgetManager.instance;
      widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
        type: "cooldown",
        channel: "day",
        remainingTime: Math.ceil((cooldownTime - (currentTime - lastMessageTime)) / 1000)
      });
      return;
    }
    const filteredMessage = this.filterChatMessage(message);
    this.dayChatCooldowns[player.id] = currentTime;
    const chatMessage = {
      sender: player.id,
      senderName: player.name,
      message: filteredMessage,
      timestamp: Date.now()
    };
    this.dayChatMessages.push(chatMessage);
    this.broadcastDayChatMessage(chatMessage);
  }
  filterChatMessage(message) {
    return message.substring(0, 200);
  }
  broadcastDayChatMessage(chatMessage) {
    if (!this.room) return;
    const widgetManager = WidgetManager.instance;
    this.room.actionToRoomPlayers(player => {
      if (!player.isAlive) return;
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
        type: 'newMessage',
        channel: 'day',
        senderId: chatMessage.sender,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp
      });
    });
  }
  sendDayChatHistory(player) {
    const widgetManager = WidgetManager.instance;
    widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
      type: "chatHistory",
      channel: "day",
      messages: this.dayChatMessages
    });
  }
  initUnifiedChat(player, channels, activeChannel, readOnlyChannels = []) {
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.UNIFIED_CHAT);
    widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
      type: 'init',
      myPlayerId: player.id,
      channels: channels,
      activeChannel: activeChannel,
      readOnlyChannels: readOnlyChannels,
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    widgetManager.clearMessageHandlers(player, WidgetType.UNIFIED_CHAT);
    widgetManager.registerMessageHandler(player, WidgetType.UNIFIED_CHAT, (sender, data) => {
      this.handleUnifiedChatMessage(sender, data);
    });
  }
  handleUnifiedChatMessage(player, data) {
    if (data.type === 'sendMessage' && data.message) {
      const channel = data.channel;
      const message = data.message.trim();
      if (!message) return;
      switch (channel) {
        case 'day':
          this.processDayChatMessage(player, message);
          break;
        case 'dead':
          this.broadcastDeadChatMessage(player, message);
          break;
        case 'mafia':
          this.broadcastMafiaMessage(player, message);
          break;
        case 'lover':
          this.broadcastLoverMessage(player, message);
          break;
      }
    }
  }
  broadcastDeadChatMessage(sender, message) {
    var _a;
    const widgetManager = WidgetManager.instance;
    this.deadPlayers.forEach(deadId => {
      const deadPlayer = getPlayerById(deadId);
      if (deadPlayer) {
        widgetManager.sendMessageToWidget(deadPlayer, WidgetType.UNIFIED_CHAT, {
          type: 'newMessage',
          channel: 'dead',
          senderId: sender.id,
          senderName: sender.name,
          message: message,
          timestamp: Date.now()
        });
      }
    });
    (_a = this.room) === null || _a === void 0 ? void 0 : _a.actionToRoomPlayers(player => {
      if (player.jobId === JobId.MEDIUM && player.isAlive) {
        const mediumPlayer = getPlayerById(player.id);
        if (mediumPlayer) {
          widgetManager.sendMessageToWidget(mediumPlayer, WidgetType.UNIFIED_CHAT, {
            type: 'newMessage',
            channel: 'dead',
            senderId: sender.id,
            senderName: sender.name,
            message: message,
            timestamp: Date.now()
          });
        }
      }
    });
  }
  updateUnifiedChatOnDeath(player) {
    const widgetManager = WidgetManager.instance;
    const channels = ['dead', 'day'];
    const readOnlyChannels = ['day'];
    if (this.mafiaChatPlayers.includes(player.id)) {
      channels.push('mafia');
      readOnlyChannels.push('mafia');
    }
    if (this.loverPlayers.includes(player.id)) {
      channels.push('lover');
      readOnlyChannels.push('lover');
    }
    widgetManager.sendMessageToWidget(player, WidgetType.UNIFIED_CHAT, {
      type: 'setChannels',
      channels: channels,
      activeChannel: 'dead',
      readOnlyChannels: readOnlyChannels
    });
  }
  updateChatCooldowns() {
    const currentTime = Date.now() / 1000;
    const widgetManager = WidgetManager.instance;
    for (const playerId in this.dayChatCooldowns) {
      const cooldownTime = this.dayChatCooldowns[playerId];
      if (currentTime - cooldownTime >= this.CHAT_COOLDOWN) {
        delete this.dayChatCooldowns[playerId];
        const gamePlayer = this.room.getGamePlayer(playerId);
        if (gamePlayer) {
          widgetManager.sendMessageToWidget(gamePlayer, WidgetType.UNIFIED_CHAT, {
            type: "cooldownEnd",
            channel: "day"
          });
        }
      }
    }
  }
  spyAction(targetPlayerId, spyPlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    const spy = this.room.players.find(p => p.id === spyPlayer.id);
    if (!spy) return;
    if (spy.abilityUses !== undefined && spy.abilityUses <= 0) {
      return;
    }
    this.nightActions.push({
      playerId: spyPlayer.id,
      targetId: targetPlayerId,
      jobId: JobId.SPY
    });
    const targetPlayer = this.room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;
    const targetJob = getJobById(targetPlayer.jobId);
    if (!targetJob) return;
    if (spy.abilityUses === undefined || spy.abilityUses > 0) {
      spy.abilityUses = (spy.abilityUses || 1) - 1;
    }
    if (targetPlayer.jobId === JobId.MAFIA) {
      spy.abilityUses = (spy.abilityUses || 0) + 1;
      if (!this.mafiaChatPlayers.includes(spy.id)) {
        this.mafiaChatPlayers.push(spy.id);
      }
      if (!this.mafiaChatPlayers.includes(targetPlayer.id)) {
        this.mafiaChatPlayers.push(targetPlayer.id);
      }
      if (this.mafiaChatPlayers.length >= 2) {
        if (!this.mafiaChatWidgetShown[spy.id]) {
          this.initMafiaChat(spyPlayer);
          this.mafiaChatWidgetShown[spy.id] = true;
        }
        App.runLater(() => {
          this.activateMafiaChat();
        }, 100);
        const mafiaGamePlayer = getPlayerById(targetPlayer.id);
        if (mafiaGamePlayer && mafiaGamePlayer.tag.widget.nightAction) {
          mafiaGamePlayer.tag.widget.nightAction.sendMessage({
            type: "spyContact",
            spyName: spyPlayer.name,
            spyId: spyPlayer.id,
            message: `스파이 ${spyPlayer.name}님이 접선했습니다!`
          });
        }
      }
    }
    if (spyPlayer.tag.widget.nightAction) {
      spyPlayer.tag.widget.nightAction.sendMessage({
        type: "spyResult",
        targetName: targetPlayer.name,
        targetJob: targetJob.name,
        isMafia: targetJob.team === JobTeam.MAFIA,
        canUseAgain: targetPlayer.jobId === JobId.MAFIA,
        enableMafiaChat: targetPlayer.jobId === JobId.MAFIA
      });
    }
  }
  activateMafiaChat() {
    if (!this.room) return;
    if (this.mafiaChatPlayers.length < 2) return;
    this.mafiaChatPlayers.forEach(playerId => {
      const player = this.room.getPlayer(playerId);
      if (player && player.isAlive) {
        const gamePlayer = getPlayerById(playerId);
        if (gamePlayer && !this.mafiaChatWidgetShown[playerId]) {
          this.initMafiaChat(gamePlayer);
          this.mafiaChatWidgetShown[playerId] = true;
          const isSpy = player.jobId === JobId.SPY;
          const isMadam = player.jobId === JobId.MADAM;
          let systemMessage = "";
          if (isSpy) {
            systemMessage = "마피아와 접선에 성공했습니다! 마피아와 대화할 수 있습니다.";
          } else if (isMadam) {
            systemMessage = "마피아를 유혹했습니다! 마피아와 대화할 수 있습니다.";
          } else {
            systemMessage = "마피아팀 채팅이 활성화되었습니다.";
          }
          this.chatMessages.push({
            target: "mafia",
            sender: "system",
            senderName: "시스템",
            message: systemMessage
          });
          if (gamePlayer.tag.widget.nightAction) {
            gamePlayer.tag.widget.nightAction.sendMessage({
              type: "chatMessage",
              chatTarget: "mafia",
              sender: "시스템",
              message: systemMessage
            });
          }
        }
      }
    });
  }
  initMafiaChat(player) {
    if (!player.tag.widget || !player.tag.widget.nightAction) {
      return;
    }
    player.tag.widget.nightAction.sendMessage({
      type: "initChat",
      chatTarget: "mafia"
    });
    this.chatMessages.filter(msg => msg.target === "mafia").forEach(msg => {
      player.tag.widget.nightAction.sendMessage({
        type: "chatMessage",
        chatTarget: "mafia",
        sender: msg.senderName,
        message: msg.message
      });
    });
  }
  broadcastMafiaMessage(sender, message) {
    const widgetManager = WidgetManager.instance;
    this.chatMessages.push({
      target: "mafia",
      sender: sender.id,
      senderName: sender.name,
      message: message
    });
    this.mafiaChatPlayers.forEach(mafiaId => {
      var _a;
      if (mafiaId === sender.id) return;
      const player = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === mafiaId);
      if (!player || !player.isAlive) return;
      const mafiaPlayer = getPlayerById(mafiaId);
      if (mafiaPlayer) {
        if (mafiaPlayer.tag.widget.nightAction) {
          mafiaPlayer.tag.widget.nightAction.sendMessage({
            type: "chatMessage",
            chatTarget: "mafia",
            sender: sender.name,
            message: message
          });
        }
        widgetManager.sendMessageToWidget(mafiaPlayer, WidgetType.UNIFIED_CHAT, {
          type: 'newMessage',
          channel: 'mafia',
          senderId: sender.id,
          senderName: sender.name,
          message: message,
          timestamp: Date.now()
        });
      }
    });
  }
  gangsterAction(targetPlayerId, gangsterPlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: gangsterPlayer.id,
      targetId: targetPlayerId,
      jobId: JobId.GANGSTER
    });
    if (gangsterPlayer.tag.widget.nightAction) {
      gangsterPlayer.tag.widget.nightAction.sendMessage({
        type: "abilityResult",
        message: "다음날 투표시 대상 플레이어가 투표할 수 없게 됩니다."
      });
    }
  }
  detectiveAction(targetPlayerId, detectivePlayer) {
    var _a;
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: detectivePlayer.id,
      targetId: targetPlayerId,
      jobId: JobId.DETECTIVE
    });
    const targetActions = this.nightActions.filter(action => action.playerId === targetPlayerId);
    if (detectivePlayer.tag.widget.nightAction) {
      if (targetActions.length > 0) {
        const targetAction = targetActions[0];
        const targetPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === targetAction.targetId);
        detectivePlayer.tag.widget.nightAction.sendMessage({
          type: "trackResult",
          message: `대상이 ${(targetPlayer === null || targetPlayer === void 0 ? void 0 : targetPlayer.name) || '누군가'}에게 능력을 사용했습니다.`
        });
      } else {
        detectivePlayer.tag.widget.nightAction.sendMessage({
          type: "trackResult",
          message: "대상이 아무런 능력도 사용하지 않았습니다."
        });
      }
    }
  }
  journalistAction(targetPlayerId, journalistPlayer) {
    var _a, _b;
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: journalistPlayer.id,
      targetId: targetPlayerId,
      jobId: JobId.JOURNALIST
    });
    const targetPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;
    this.journalistReport = {
      targetName: targetPlayer.name,
      targetJob: ((_b = getJobById(targetPlayer.jobId)) === null || _b === void 0 ? void 0 : _b.name) || "알 수 없음"
    };
    if (journalistPlayer.tag.widget.nightAction) {
      journalistPlayer.tag.widget.nightAction.sendMessage({
        type: "investigateResult",
        targetName: targetPlayer.name,
        targetJob: this.journalistReport.targetJob,
        message: "다음날 아침에 모든 플레이어에게 공개됩니다."
      });
    }
  }
  werewolfAction(targetPlayerId, werewolfPlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: werewolfPlayer.id,
      targetId: targetPlayerId,
      jobId: JobId.WEREWOLF
    });
    if (this.werewolfTamed) {
      if (werewolfPlayer.tag.widget.nightAction) {
        werewolfPlayer.tag.widget.nightAction.sendMessage({
          type: "abilityResult",
          message: "선택한 플레이어를 제거합니다."
        });
      }
    } else {
      if (werewolfPlayer.tag.widget.nightAction) {
        werewolfPlayer.tag.widget.nightAction.sendMessage({
          type: "abilityResult",
          message: "선택한 플레이어가 마피아에게 살해당하면 마피아에게 길들여집니다."
        });
      }
    }
  }
  terroristAction(targetPlayerId, terroristPlayer) {
    var _a;
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.terroristTarget = targetPlayerId;
    const targetPlayer = (_a = this.room) === null || _a === void 0 ? void 0 : _a.players.find(p => p.id === targetPlayerId);
    if (terroristPlayer.tag.widget.nightAction) {
      terroristPlayer.tag.widget.nightAction.sendMessage({
        type: "abilityResult",
        message: `${(targetPlayer === null || targetPlayer === void 0 ? void 0 : targetPlayer.name) || '선택한 플레이어'}를 자폭 대상으로 지정했습니다. 처형될 때 함께 죽게 됩니다.`
      });
    }
  }
  madamAction(madamId, targetPlayerId, madamPlayer) {
    var _a;
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    const targetPlayer = this.room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;
    this.nightActions.push({
      playerId: madamId,
      targetId: targetPlayerId,
      jobId: JobId.MADAM
    });
    if (targetPlayer.jobId === JobId.MAFIA) {
      const madam = this.room.players.find(p => p.id === madamId);
      if (madam) {
        if (!this.mafiaChatPlayers.includes(madam.id)) {
          this.mafiaChatPlayers.push(madam.id);
        }
        if (!this.mafiaChatPlayers.includes(targetPlayer.id)) {
          this.mafiaChatPlayers.push(targetPlayer.id);
        }
        if (this.mafiaChatPlayers.length >= 2) {
          this.activateMafiaChat();
        }
      }
    }
    if (madamPlayer.tag.widget.nightAction) {
      madamPlayer.tag.widget.nightAction.sendMessage({
        type: "seduceResult",
        targetName: targetPlayer.name,
        targetJob: ((_a = getJobById(targetPlayer.jobId)) === null || _a === void 0 ? void 0 : _a.name) || "알 수 없음",
        isMafia: targetPlayer.jobId === JobId.MAFIA,
        enableMafiaChat: targetPlayer.jobId === JobId.MAFIA
      });
    }
  }
  handlePlayerLeave(playerId) {
    if (this.state !== GameState.IN_PROGRESS || !this.room) {
      return;
    }
    const leavingPlayer = this.room.players.find(p => p.id === playerId);
    if (!leavingPlayer) {
      return;
    }
    if (leavingPlayer.isAlive) {
      leavingPlayer.isAlive = false;
      this.sayToRoom(`${leavingPlayer.name}님이 게임을 떠나 사망 처리되었습니다.`);
      this.showRoomLabel(`⚠️ ${leavingPlayer.name}님이 게임을 떠났습니다!`, 3000);
      const gamePlayer = getPlayerById(playerId);
      if (gamePlayer) {
        const widgetManager = WidgetManager.instance;
        widgetManager.hideAllWidgets(gamePlayer);
      }
      switch (this.currentPhase) {
        case MafiaPhase.VOTING:
          if (this.playerVotes[playerId]) {
            const targetId = this.playerVotes[playerId];
            if (this.voteResults[targetId] > 0) {
              this.voteResults[targetId]--;
            }
            delete this.playerVotes[playerId];
            this.updateVoteResults();
          }
          break;
        case MafiaPhase.APPROVAL_VOTING:
          if (this.approvalPlayerVotes[playerId]) {
            const vote = this.approvalPlayerVotes[playerId];
            if (this.approvalVoteResults[vote] > 0) {
              this.approvalVoteResults[vote]--;
            }
            delete this.approvalPlayerVotes[playerId];
            this.updateApprovalVoteResults();
          }
          break;
        case MafiaPhase.NIGHT:
          this.nightActions = this.nightActions.filter(action => action.playerId !== playerId);
          break;
      }
      const mafiaIndex = this.mafiaChatPlayers.indexOf(playerId);
      if (mafiaIndex !== -1) {
        this.mafiaChatPlayers.splice(mafiaIndex, 1);
      }
      const loverIndex = this.loverPlayers.indexOf(playerId);
      if (loverIndex !== -1) {
        this.loverPlayers.splice(loverIndex, 1);
      }
      const blockedIndex = this.blockedVoters.indexOf(playerId);
      if (blockedIndex !== -1) {
        this.blockedVoters.splice(blockedIndex, 1);
      }
      this.checkWinCondition();
      this.updateAllGameStatusWidgets();
    }
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/gameRoom/GameRoom.ts





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
class GameRoom {
  constructor(config, gameMode) {
    this.hostId = null;
    this.players = [];
    this.readyPlayers = new Set();
    this.state = GameState.WAITING;
    this.roomLocation = null;
    this.callbacks = {};
    this.id = config.id;
    this.title = config.title;
    this.gameMode = gameMode;
    this.maxPlayers = config.maxPlayers;
    this.password = config.password;
    this.createdAt = Date.now();
    this.roomLocation = GAMEROOM_LOCATIONS[parseInt(this.id)] || null;
    this.flowManager = new GameFlowManager();
    this.flowManager.setGameRoom(this);
  }
  getGamePlayer(playerId) {
    return getPlayerById(playerId);
  }
  actionToRoomPlayers(action, data) {
    if (typeof action === "function") {
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
  removeAllListeners() {
    this.callbacks = {};
  }
  emit(event, ...args) {
    const callbacks = this.callbacks[event];
    if (!callbacks) return;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        sendAdminConsoleMessage(`Error in event listener for ${event}:` + error);
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
    if (this.state === GameState.IN_PROGRESS) {
      return false;
    }
    const mafiaPlayer = {
      id: player.id,
      name: player.name,
      jobId: JobId.CITIZEN,
      isAlive: true
    };
    this.players.push(mafiaPlayer);
    player.tag.roomInfo = {
      roomNum: parseInt(this.id)
    };
    if (this.players.length === 1 || !this.hostId) {
      this.hostId = player.id;
    }
    if (this.roomLocation) {
      const x = this.roomLocation.x + Math.floor(Math.random() * this.roomLocation.width);
      const y = this.roomLocation.y + Math.floor(Math.random() * this.roomLocation.height);
      player.spawnAt(x, y);
    }
    if (this.roomLocation) {
      player.setCameraTarget(-1, -1, 0);
      player.setCameraTarget(this.roomLocation.x + this.roomLocation.width / 2, this.roomLocation.y + this.roomLocation.height / 2, 0);
    }
    this.emit(WaitingRoomEvent.PLAYER_JOIN, this, player);
    return true;
  }
  leavePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }
    const player = getPlayerById(playerId);
    if (this.state === GameState.IN_PROGRESS && this.flowManager) {
      this.flowManager.handlePlayerLeave(playerId);
      if (player) {
        this.readyPlayers.delete(playerId);
        if (player.tag) {
          const widgetManager = WidgetManager.instance;
          widgetManager.hideAllWidgets(player);
        }
        if (this.hostId && this.hostId === playerId) {
          this.assignNewHostFromAlivePlayers();
        }
        this.emit(WaitingRoomEvent.PLAYER_LEAVE, player);
        return true;
      }
    }
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
      player.spawnAtLocation("Lobby");
      const lobbyLocation = Map.getLocationList("Lobby");
      player.setCameraTarget(-1, -1, 0);
      player.setCameraTarget(lobbyLocation[0].x + lobbyLocation[0].width / 2, lobbyLocation[0].y + lobbyLocation[0].height / 2, 0);
      const widgetManager = WidgetManager.instance;
      widgetManager.cleanupPlayerWidgets(player);
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
  assignNewHostFromAlivePlayers() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    if (alivePlayers.length === 0) {
      this.hostId = null;
      return;
    }
    const firstAlivePlayerId = alivePlayers[0].id;
    this.hostId = firstAlivePlayerId;
    const newHost = getPlayerById(firstAlivePlayerId);
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
  setPlayerReady(playerId, ready) {
    const player = getPlayerById(playerId);
    if (!player) return false;
    const isCurrentlyReady = this.readyPlayers.has(playerId);
    if (isCurrentlyReady === ready) return true;
    if (ready) {
      this.readyPlayers.add(playerId);
    } else {
      this.readyPlayers.delete(playerId);
    }
    this.emit(WaitingRoomEvent.READY_STATUS_CHANGE, player, ready);
    return true;
  }
  autoReadyBots() {
    const botManager = BotManager.instance;
    for (const mafiaPlayer of this.players) {
      if (botManager.isBot(mafiaPlayer.id)) {
        this.setPlayerReady(mafiaPlayer.id, true);
        sendAdminConsoleMessage(`[BOT] ${mafiaPlayer.name}가 자동 준비되었습니다.`);
      }
    }
  }
  endGame() {
    this.state = GameState.WAITING;
    this.readyPlayers.clear();
    this.flowManager = new GameFlowManager();
    this.flowManager.setGameRoom(this);
    this.emit(WaitingRoomEvent.GAME_END);
  }
  reset() {
    this.players.forEach(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      const widgetManager = WidgetManager.instance;
      widgetManager.cleanupPlayerWidgets(gamePlayer);
    });
    this.players = [];
    this.readyPlayers.clear();
    this.hostId = null;
    this.state = GameState.WAITING;
    this.flowManager = new GameFlowManager();
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
        name: (hostPlayer === null || hostPlayer === void 0 ? void 0 : hostPlayer.name) || "알 수 없음"
      } : null,
      state: this.state,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        isReady: this.isPlayerReady(player.id),
        isHost: this.hostId === player.id
      })),
      createdAt: new Date(this.createdAt).toISOString()
    };
  }
  resetAllPlayersReady() {
    this.readyPlayers.clear();
    this.players.forEach(player => {
      if (this.hostId !== player.id) {
        const gamePlayer = getPlayerById(player.id);
        if (gamePlayer) {
          this.emit(WaitingRoomEvent.READY_STATUS_CHANGE, gamePlayer, false);
        }
      }
    });
    sendAdminConsoleMessage(`[GameRoom] 방 ${this.id}의 모든 플레이어 준비 상태 초기화됨`);
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/gameRoom/GameRoomManager.ts



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
    }, config), this.gameModes[config.gameModeId]);
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
    this.cleanupRoomEventListeners(room);
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
        sendAdminConsoleMessage(`[GameRoomManager] 방 ${room.getId()} (${room.getTitle()})에 플레이어가 없어 삭제합니다.`);
        const removed = this.removeRoom(room.getId());
        sendAdminConsoleMessage(`[GameRoomManager] 방 삭제 결과: ${removed ? "성공" : "실패"}`);
        if (!removed) {
          delete this.gameRooms[room.getId()];
          sendAdminConsoleMessage(`[GameRoomManager] 방을 강제로 삭제했습니다: ${room.getId()}`);
          this.emit("roomRemoved", room);
        }
      }
    });
    room.on(WaitingRoomEvent.PLAYER_KICK, player => {
      this.emit("playerKicked", room, player);
      if (room.getPlayersCount() === 0) {
        sendAdminConsoleMessage(`[GameRoomManager] 강퇴 후 방 ${room.getId()}에 플레이어가 없어 삭제합니다.`);
        this.removeRoom(room.getId());
      }
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
        sendAdminConsoleMessage(`Error in event listener for ${event}:` + error);
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
  cleanupRoomEventListeners(room) {
    room.removeAllListeners();
  }
  cleanup() {
    Object.values(this.gameRooms).forEach(room => {
      this.cleanupRoomEventListeners(room);
      room.reset();
    });
    this.gameRooms = {};
    this.callbacks = {};
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/gameMode/GameMode.ts
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
;// CONCATENATED MODULE: ../../libs/core/mafia/gameMode/defaultGameModes.ts


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
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/Sprite/SpriteManager.ts
var SpriteType;
(function (SpriteType) {
  SpriteType["CHARACTER_BASIC"] = "character_basic";
})(SpriteType || (SpriteType = {}));
class SpriteManager {
  static getInstance() {
    return this._instance || (this._instance = new this());
  }
  constructor() {
    this.sprites = {};
    const characterSprite = App.loadSpritesheet("images/character_basic.png", 48, 48, {
      left_idle: [0, 1, 2, 3],
      right_idle: [4, 5, 6, 7],
      down_idle: [8, 9, 10, 11],
      up_idle: [12, 13, 14, 15],
      left: [16, 17, 18, 19, 20, 21, 22, 23],
      right: [24, 25, 26, 27, 28, 29, 30, 31],
      down: [32, 33, 34, 35, 36, 37, 38, 39],
      up: [40, 41, 42, 43, 44, 45, 46, 47]
    }, 8);
    this.addSprite(SpriteType.CHARACTER_BASIC, characterSprite);
  }
  getSprite(type) {
    return this.sprites[type].sprite;
  }
  addSprite(type, sprite) {
    this.sprites[type] = {
      name: type,
      sprite
    };
  }
}
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/command/CheatCommands.ts







class SkipPhaseCommand {
  constructor() {
    this.name = "skip";
    this.description = "현재 페이즈를 즉시 스킵합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager) return false;
    context.flowManager.phaseTimer = 0;
    sendAdminConsoleMessage(`[CHEAT] ${context.player.name}가 페이즈를 스킵했습니다.`);
    showLabel(context.player, "페이즈를 스킵했습니다.");
    return true;
  }
  getUsage() {
    return "/skip";
  }
}
class SpeedCommand {
  constructor() {
    this.name = "speed";
    this.description = "타이머 속도를 배수로 조절합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager) return false;
    const multiplier = parseInt(args[0]) || 1;
    if (multiplier < 1 || multiplier > 100) {
      showLabel(context.player, "속도 배수는 1-100 사이의 정수여야 합니다.");
      return false;
    }
    context.flowManager.speedMultiplier = multiplier;
    sendAdminConsoleMessage(`[CHEAT] 타이머 속도가 ${multiplier}배로 설정되었습니다.`);
    showLabel(context.player, `타이머 속도: ${multiplier}배`);
    return true;
  }
  getUsage() {
    return "/speed [multiplier] - 예: /speed 10 (10배 빠르게)";
  }
}
class EndGameCommand {
  constructor() {
    this.name = "endgame";
    this.description = "게임을 즉시 종료합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager) return false;
    context.flowManager.resetGame();
    sendAdminConsoleMessage(`[CHEAT] ${context.player.name}가 게임을 강제 종료했습니다.`);
    showLabel(context.player, "게임을 종료했습니다.");
    return true;
  }
  getUsage() {
    return "/endgame";
  }
}
class GameStateCommand {
  constructor() {
    this.name = "gamestate";
    this.description = "현재 게임 상태를 출력합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = false;
  }
  execute(context, args) {
    if (!context.flowManager || !context.room) {
      showLabel(context.player, "게임이 진행 중이 아닙니다.");
      return false;
    }
    const state = {
      phase: context.flowManager.currentPhase,
      day: context.flowManager.dayCount,
      timer: Math.floor(context.flowManager.phaseTimer),
      alivePlayers: context.room.players.filter(p => p.isAlive).length,
      totalPlayers: context.room.players.length,
      speed: context.flowManager.speedMultiplier
    };
    const message = `Phase: ${state.phase} | Day: ${state.day} | Timer: ${state.timer}s | Alive: ${state.alivePlayers}/${state.totalPlayers} | Speed: ${state.speed}x`;
    showLabel(context.player, message, {
      labelDisplayTime: 5000
    });
    sendAdminConsoleMessage(`[GAMESTATE] ${message}`);
    return true;
  }
  getUsage() {
    return "/gamestate";
  }
}
class SetPhaseCommand {
  constructor() {
    this.name = "setphase";
    this.description = "특정 페이즈로 즉시 이동합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager) return false;
    const phaseMap = {
      night: MafiaPhase.NIGHT,
      day: MafiaPhase.DAY,
      voting: MafiaPhase.VOTING,
      defense: MafiaPhase.FINAL_DEFENSE,
      approval: MafiaPhase.APPROVAL_VOTING
    };
    const phaseName = (args[0] || "").toLowerCase();
    const targetPhase = phaseMap[phaseName];
    if (!targetPhase) {
      showLabel(context.player, `유효하지 않은 페이즈: ${args[0]}`);
      return false;
    }
    context.flowManager.setPhase(targetPhase);
    sendAdminConsoleMessage(`[CHEAT] 페이즈가 ${targetPhase}로 변경되었습니다.`);
    showLabel(context.player, `페이즈 변경: ${targetPhase}`);
    return true;
  }
  getUsage() {
    return "/setphase [night|day|voting|defense|approval]";
  }
}
class KillPlayerCommand {
  constructor() {
    this.name = "kill";
    this.description = "특정 플레이어를 강제로 사망시킵니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager || !context.room) return false;
    const playerName = args.join(" ");
    if (!playerName) {
      showLabel(context.player, "플레이어 이름을 입력하세요.");
      return false;
    }
    const targetPlayer = context.room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!targetPlayer) {
      showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
      return false;
    }
    if (!targetPlayer.isAlive) {
      showLabel(context.player, `${targetPlayer.name}는 이미 사망했습니다.`);
      return false;
    }
    targetPlayer.isAlive = false;
    context.flowManager.deadPlayers.push(targetPlayer.id);
    context.flowManager.showRoomLabel(`⚠️ ${targetPlayer.name}이(가) 관리자에 의해 사망했습니다.`);
    context.flowManager.updateAllGameStatusWidgets();
    context.flowManager.checkWinCondition();
    sendAdminConsoleMessage(`[CHEAT] ${targetPlayer.name}를 강제 사망시켰습니다.`);
    showLabel(context.player, `${targetPlayer.name}를 사망시켰습니다.`);
    return true;
  }
  getUsage() {
    return "/kill [PlayerName] - 예: /kill Alice";
  }
}
class RevivePlayerCommand {
  constructor() {
    this.name = "revive";
    this.description = "사망한 플레이어를 부활시킵니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    if (!context.flowManager || !context.room) return false;
    const playerName = args.join(" ");
    if (!playerName) {
      showLabel(context.player, "플레이어 이름을 입력하세요.");
      return false;
    }
    const targetPlayer = context.room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!targetPlayer) {
      showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
      return false;
    }
    if (targetPlayer.isAlive) {
      showLabel(context.player, `${targetPlayer.name}는 이미 살아있습니다.`);
      return false;
    }
    targetPlayer.isAlive = true;
    const deadIndex = context.flowManager.deadPlayers.indexOf(targetPlayer.id);
    if (deadIndex !== -1) {
      context.flowManager.deadPlayers.splice(deadIndex, 1);
    }
    context.flowManager.showRoomLabel(`✨ ${targetPlayer.name}이(가) 부활했습니다!`);
    context.flowManager.updateAllGameStatusWidgets();
    sendAdminConsoleMessage(`[CHEAT] ${targetPlayer.name}를 부활시켰습니다.`);
    showLabel(context.player, `${targetPlayer.name}를 부활시켰습니다.`);
    return true;
  }
  getUsage() {
    return "/revive [PlayerName] - 예: /revive Alice";
  }
}
class SetRoleCommand {
  constructor() {
    this.name = "setrole";
    this.description = "플레이어의 직업을 강제로 변경합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = true;
  }
  execute(context, args) {
    var _a, _b;
    if (!context.flowManager || !context.room) return false;
    if (args.length < 2) {
      showLabel(context.player, "사용법: /setrole [PlayerName] [RoleName]");
      return false;
    }
    const roleName = args[args.length - 1].toLowerCase();
    const playerName = args.slice(0, -1).join(" ");
    const targetPlayer = context.room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!targetPlayer) {
      showLabel(context.player, `플레이어를 찾을 수 없습니다: ${playerName}`);
      return false;
    }
    const roleMap = {
      mafia: JobId.MAFIA,
      police: JobId.POLICE,
      doctor: JobId.DOCTOR,
      citizen: JobId.CITIZEN,
      spy: JobId.SPY,
      detective: JobId.DETECTIVE,
      journalist: JobId.JOURNALIST,
      lover: JobId.LOVER,
      medium: JobId.MEDIUM,
      werewolf: JobId.WEREWOLF,
      terrorist: JobId.TERRORIST,
      madam: JobId.MADAM,
      soldier: JobId.SOLDIER,
      gangster: JobId.GANGSTER,
      gravedigger: JobId.GRAVEDIGGER,
      politician: JobId.POLITICIAN
    };
    const jobId = roleMap[roleName];
    if (!jobId) {
      showLabel(context.player, `유효하지 않은 직업: ${roleName}`);
      return false;
    }
    const oldJobId = targetPlayer.jobId;
    targetPlayer.jobId = jobId;
    const gamePlayer = getPlayerById(targetPlayer.id);
    if (gamePlayer) {
      context.flowManager.showRoleCard(gamePlayer, jobId);
    }
    const oldJobName = ((_a = getJobById(oldJobId)) === null || _a === void 0 ? void 0 : _a.name) || oldJobId;
    const newJobName = ((_b = getJobById(jobId)) === null || _b === void 0 ? void 0 : _b.name) || jobId;
    sendAdminConsoleMessage(`[CHEAT] ${targetPlayer.name}의 직업이 ${oldJobName} -> ${newJobName}로 변경되었습니다.`);
    showLabel(context.player, `${targetPlayer.name}: ${oldJobName} -> ${newJobName}`);
    return true;
  }
  getUsage() {
    return "/setrole [PlayerName] [RoleName] - 예: /setrole Alice mafia";
  }
}
class HelpCommand {
  constructor() {
    this.name = "help";
    this.description = "사용 가능한 명령어 목록을 표시합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = false;
  }
  execute(context, args) {
    const commands = CommandManager.instance.getAllCommands();
    let helpText = "=== 치트 명령어 목록 ===\n";
    commands.forEach(cmd => {
      helpText += `\n/${cmd.name} - ${cmd.description}`;
      const usage = cmd.getUsage();
      if (usage && usage !== `/${cmd.name}`) {
        helpText += `\n  사용법: ${usage}`;
      }
    });
    sendAdminConsoleMessage(helpText);
    showLabel(context.player, "명령어 목록이 관리자 콘솔에 출력되었습니다.");
    return true;
  }
  getUsage() {
    return "/help";
  }
}
class AutoBotCommand {
  constructor() {
    this.name = "autobot";
    this.description = "플레이어를 봇으로 설정/해제합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = false;
  }
  execute(context, args) {
    if (args.length === 0) {
      showLabel(context.player, "사용법: /autobot [플레이어 이름]");
      return true;
    }
    const targetName = args.join(" ");
    const botManager = BotManager.instance;
    let targetPlayer = null;
    if (context.room) {
      const mafiaPlayer = context.room.players.find(p => p.name.toLowerCase() === targetName.toLowerCase());
      if (mafiaPlayer) {
        targetPlayer = getPlayerById(mafiaPlayer.id);
      }
    }
    if (!targetPlayer) {
      showLabel(context.player, `플레이어 "${targetName}"를 찾을 수 없습니다.`);
      return true;
    }
    if (targetPlayer.id === context.player.id) {
      showLabel(context.player, "자기 자신을 봇으로 설정할 수 없습니다.");
      return true;
    }
    const isCurrentlyBot = botManager.isBot(targetPlayer.id);
    botManager.setBot(targetPlayer.id, !isCurrentlyBot);
    const status = !isCurrentlyBot ? "봇으로 설정" : "봇 해제";
    showLabel(context.player, `${targetPlayer.name}이(가) ${status}되었습니다.`);
    if (!isCurrentlyBot && context.room) {
      context.room.setPlayerReady(targetPlayer.id, true);
    }
    return true;
  }
  getUsage() {
    return "/autobot [플레이어 이름] - 봇 설정/해제 토글";
  }
}
class AutoBotAllCommand {
  constructor() {
    this.name = "autobotall";
    this.description = "자신을 제외한 모든 플레이어를 봇으로 설정합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = false;
  }
  execute(context, args) {
    const botManager = BotManager.instance;
    if (!context.room) {
      showLabel(context.player, "게임 방에서만 사용할 수 있습니다.");
      return true;
    }
    let botCount = 0;
    for (const mafiaPlayer of context.room.players) {
      if (mafiaPlayer.id === context.player.id) continue;
      if (!botManager.isBot(mafiaPlayer.id)) {
        botManager.setBot(mafiaPlayer.id, true);
        context.room.setPlayerReady(mafiaPlayer.id, true);
        botCount++;
      }
    }
    showLabel(context.player, `${botCount}명의 플레이어가 봇으로 설정되었습니다.`);
    sendAdminConsoleMessage(`[BOT] ${context.player.name}가 ${botCount}명을 봇으로 설정했습니다.`);
    return true;
  }
  getUsage() {
    return "/autobotall - 자신 제외 모든 플레이어를 봇으로 설정";
  }
}
class ClearBotsCommand {
  constructor() {
    this.name = "clearbots";
    this.description = "모든 봇 상태를 해제합니다";
    this.adminOnly = true;
    this.requiresGameInProgress = false;
  }
  execute(context, args) {
    const botManager = BotManager.instance;
    const botCount = botManager.getBotCount();
    botManager.clearAllBots();
    showLabel(context.player, `${botCount}명의 봇 상태가 해제되었습니다.`);
    return true;
  }
  getUsage() {
    return "/clearbots - 모든 봇 상태 해제";
  }
}
function registerCheatCommands() {
  const manager = CommandManager.instance;
  manager.registerCommand(new SkipPhaseCommand());
  manager.registerCommand(new SpeedCommand());
  manager.registerCommand(new EndGameCommand());
  manager.registerCommand(new GameStateCommand());
  manager.registerCommand(new SetPhaseCommand());
  manager.registerCommand(new KillPlayerCommand());
  manager.registerCommand(new RevivePlayerCommand());
  manager.registerCommand(new SetRoleCommand());
  manager.registerCommand(new HelpCommand());
  manager.registerCommand(new AutoBotCommand());
  manager.registerCommand(new AutoBotAllCommand());
  manager.registerCommand(new ClearBotsCommand());
}
;// CONCATENATED MODULE: ../../libs/core/mafia/Game.ts














const adminList = [];
class Game extends GameBase {
  static create() {
    if (!Game._instance) {
      Game._instance = new Game();
    }
  }
  constructor() {
    super();
    this.mafiaGameRoomManager = new GameRoomManager();
    SpriteManager.getInstance();
    this.addOnStartCallback(this.onStart.bind(this));
    this.addOnJoinPlayerCallback(this.onJoinPlayer.bind(this));
    this.addOnLeavePlayerCallback(this.onLeavePlayer.bind(this));
    this.addOnUpdateCallback(this.update.bind(this));
    this.addOnDestroyCallback(this.onDestroy.bind(this));
    const gameModes = createDefaultGameModes();
    gameModes.forEach(mode => {
      this.mafiaGameRoomManager.registerGameMode(mode);
    });
    registerCheatCommands();
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
      isReady: false,
      profile: this.getDefaultProfile(player)
    };
    if (!player.isMobile) {
      player.displayRatio = 1.25;
    }
    if (player.role >= 3000) {
      adminList.push(player.id);
      player.tag.widget.system = player.showWidget("widgets/system.html", "topleft", 0, 0);
    }
    player.playSound("sounds/lobby_bgm.mp3", true, true, "bgm", 0.4);
    Localizer_Localizer.prepareLocalizationContainer(player);
    const customData = parseJsonString(player.customData);
    const widgetManager = WidgetManager.instance;
    widgetManager.initPlayerWidgets(player);
    if (player.tag.roomInfo) {
      const roomNum = player.tag.roomInfo.roomNum;
      const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
      if (room) {
        const gameFlow = room.flowManager;
        if (gameFlow && gameFlow.isGameInProgress()) {
          const deadPlayers = gameFlow.getDeadPlayers();
          if (deadPlayers && deadPlayers.includes(player.id)) {
            widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
            widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
              type: "initDeadChat",
              messages: []
            });
          }
          const mafiaPlayer = room.getPlayer(player.id);
          if (mafiaPlayer && mafiaPlayer.jobId === JobId.MEDIUM && mafiaPlayer.isAlive) {
            widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
            widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
              type: "init",
              myPlayerId: player.id,
              myName: player.name,
              myRole: "medium"
            });
          }
        }
      }
    } else {
      App.runLater(() => {
        const lobbyLocation = Map.getLocationList("Lobby");
        player.setCameraTarget(lobbyLocation[0].x + lobbyLocation[0].width / 2, lobbyLocation[0].y + lobbyLocation[0].height / 2, 0);
        player.spawnAtLocation("Lobby");
        this.showLobbyWidget(player);
      }, 1);
    }
    this.updateUsersInfo();
    this.sendSystemLobbyChatMessage(`${player.name}님이 게임에 입장했습니다.`);
    player.sendUpdated();
  }
  getDefaultProfile(player) {
    return {
      id: player.id,
      nickname: player.name,
      level: 1,
      experience: 0,
      avatar: ""
    };
  }
  showLobbyWidget(player) {
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.LOBBY_NAVBAR);
    widgetManager.showWidget(player, WidgetType.LOBBY_CHAT);
    App.runLater(() => {
      widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
        type: "init",
        isMobile: player.isMobile,
        isTablet: false
      });
      widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
        type: "init",
        isMobile: player.isMobile,
        isTablet: false,
        userId: player.id,
        userName: player.name
      });
      widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
        type: "init",
        isMobile: player.isMobile,
        isTablet: false,
        userId: player.id,
        userName: player.name
      });
      const gameModes = this.getGameModesForUI();
      sendAdminConsoleMessage(`게임 모드 정보 전송 (플레이어: ${player.name}, 모드 수: ${gameModes.length})`);
      widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
        type: "gameModes",
        modes: gameModes
      });
      this.sendUsersList(player);
      this.updateRoomInfo();
    }, 0.1);
    const lobbyNavbar = widgetManager.getWidget(player, WidgetType.LOBBY_NAVBAR);
    if (lobbyNavbar && lobbyNavbar.element) {
      if (player.tag.lobbyNavbarMessageHandler) {
        lobbyNavbar.element.onMessage.Remove(player.tag.lobbyNavbarMessageHandler);
      }
      const navbarHandler = (sender, data) => {
        if (data.type === "openLobby") {
          widgetManager.showWidget(sender, WidgetType.LOBBY);
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, {
            type: "lobbyOpened"
          });
        } else if (data.type === "closeLobby") {
          widgetManager.hideWidget(sender, WidgetType.LOBBY);
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, {
            type: "lobbyClosed"
          });
        } else if (data.type === "openUsers") {
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, {
            type: "usersOpened"
          });
        } else if (data.type === "closeUsers") {
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, {
            type: "usersClosed"
          });
        } else if (data.type === "openRoomPopup") {
          if (sender.tag.roomInfo) {
            widgetManager.showWidget(sender, WidgetType.LOBBY);
            widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
              type: "showRoomPopup"
            });
          }
        } else if (data.type === "leaveRoom") {
          if (sender.tag.roomInfo) {
            const roomNum = sender.tag.roomInfo.roomNum;
            const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
            if (room) {
              room.leavePlayer(sender.id);
              this.exitRoomState(sender);
              this.notifyPlayerLeftRoom(room, sender);
              this.updateRoomInfo();
            }
          }
        }
      };
      lobbyNavbar.element.onMessage.Add(navbarHandler);
      player.tag.lobbyNavbarMessageHandler = navbarHandler;
    }
    const lobbyChat = widgetManager.getWidget(player, WidgetType.LOBBY_CHAT);
    if (lobbyChat && lobbyChat.element) {
      if (player.tag.lobbyChatMessageHandler) {
        lobbyChat.element.onMessage.Remove(player.tag.lobbyChatMessageHandler);
      }
      const chatHandler = (sender, data) => {
        var _a;
        if (data.type === "lobbyChatMessage" && data.content) {
          if (CommandParser.isCommand(data.content)) {
            const parsed = CommandParser.parse(data.content);
            if (parsed) {
              const executed = CommandManager.instance.executeCommand(parsed.command, parsed.args, {
                player: sender,
                room: null,
                flowManager: null
              });
              if (executed) return;
            }
          }
          this.sendLobbyChatMessage(sender, data.content);
        } else if (data.type === "roomChatMessage" && data.content) {
          const roomId = (_a = sender.tag.roomInfo) === null || _a === void 0 ? void 0 : _a.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              this.sendRoomChatMessage(room, sender, data.content);
            }
          }
        }
      };
      lobbyChat.element.onMessage.Add(chatHandler);
      player.tag.lobbyChatMessageHandler = chatHandler;
    }
    const lobbyWidget = widgetManager.getWidget(player, WidgetType.LOBBY);
    if (lobbyWidget && lobbyWidget.element) {
      if (player.tag.lobbyWidgetMessageHandler) {
        lobbyWidget.element.onMessage.Remove(player.tag.lobbyWidgetMessageHandler);
      }
      const messageHandler = (sender, data) => {
        var _a, _b, _c, _d, _e, _f;
        if (data.type === "requestGameModes") {
          const gameModes = this.getGameModesForUI();
          sendAdminConsoleMessage(`게임 모드 정보 요청 처리 (플레이어: ${sender.name}, 모드 수: ${gameModes.length})`);
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
            type: "gameModes",
            modes: gameModes
          });
        } else if (data.type === "requestRooms") {
          this.updateRoomInfo();
        } else if (data.type === "requestUsers") {
          this.sendUsersList(sender);
        } else if (data.type === "lobbyClosed") {
          widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY_NAVBAR, {
            type: "lobbyClosed"
          });
        } else if (data.type === "createRoom" && data.data) {
          const {
            title,
            maxPlayers,
            gameModeId
          } = data.data;
          if (getGameModeConfigById(gameModeId)) {
            const room = this.mafiaGameRoomManager.createRoom({
              title,
              maxPlayers,
              gameModeId: gameModeId
            });
            if (room) {
              room.joinPlayer(sender);
              this.enterRoomState(sender, room);
              this.updateRoomInfo();
            }
          }
        } else if (data.type === "joinRoom" && data.roomId) {
          const room = this.mafiaGameRoomManager.getRoom(data.roomId);
          if (room) {
            const joinResult = room.joinPlayer(sender);
            if (joinResult) {
              this.enterRoomState(sender, room);
              this.updateRoomInfo();
            } else {
              widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
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
              this.exitRoomState(sender);
              this.updateRoomInfo();
            }
          }
        } else if (data.type === "requestRoomInfo") {
          const roomId = (_a = sender.tag.roomInfo) === null || _a === void 0 ? void 0 : _a.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              const roomData = this.buildRoomData(sender, room);
              widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
                type: "roomInfo",
                roomData: roomData
              });
            }
          }
        } else if (data.type === "requestGameModeDetails") {
          const roomId = (_b = sender.tag.roomInfo) === null || _b === void 0 ? void 0 : _b.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              this.sendGameModeDetailsToLobbyWidget(sender, room.gameMode);
            }
          }
        } else if (data.type === "setReady") {
          const roomId = (_c = sender.tag.roomInfo) === null || _c === void 0 ? void 0 : _c.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              sender.tag.isReady = true;
              this.notifyReadyStatusChanged(room, sender);
            }
          }
        } else if (data.type === "cancelReady") {
          const roomId = (_d = sender.tag.roomInfo) === null || _d === void 0 ? void 0 : _d.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              sender.tag.isReady = false;
              this.notifyReadyStatusChanged(room, sender);
            }
          }
        } else if (data.type === "startGame") {
          const roomId = (_e = sender.tag.roomInfo) === null || _e === void 0 ? void 0 : _e.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              const canStart = this.canStartGame(room);
              if (canStart) {
                room.state = GameState.IN_PROGRESS;
                if (!room.hostId) {
                  room.hostId = sender.id;
                }
                room.flowManager.startGame();
                this.updateRoomInfo();
              } else {
                widgetManager.sendMessageToWidget(sender, WidgetType.LOBBY, {
                  type: "error",
                  message: "모든 플레이어가 준비 상태여야 합니다."
                });
              }
            }
          }
        } else if (data.type === "kickPlayer" && data.playerId) {
          const roomId = (_f = sender.tag.roomInfo) === null || _f === void 0 ? void 0 : _f.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room && room.hostId === sender.id) {
              const targetPlayer = App.getPlayerByID(data.playerId);
              if (targetPlayer) {
                room.leavePlayer(targetPlayer.id);
                this.exitRoomState(targetPlayer);
                this.showLobbyWidget(targetPlayer);
                this.notifyPlayerKicked(room, targetPlayer);
                this.updateRoomInfo();
              }
            }
          }
        }
      };
      lobbyWidget.element.onMessage.Add(messageHandler);
      player.tag.lobbyWidgetMessageHandler = messageHandler;
    }
  }
  hideLobbyPopup(player) {
    const widgetManager = WidgetManager.instance;
    widgetManager.hideWidget(player, WidgetType.LOBBY);
  }
  hideLobbyWidgets(player) {
    const widgetManager = WidgetManager.instance;
    widgetManager.hideWidget(player, WidgetType.LOBBY_NAVBAR);
    widgetManager.hideWidget(player, WidgetType.LOBBY);
    widgetManager.hideWidget(player, WidgetType.LOBBY_CHAT);
  }
  enterRoomState(player, room) {
    const widgetManager = WidgetManager.instance;
    this.hideLobbyPopup(player);
    const roomData = this.buildRoomData(player, room);
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
      type: "enterRoom",
      roomData: roomData
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
      type: "enterRoom",
      roomData: roomData
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
      type: "enterRoom",
      roomData: roomData
    });
    App.runLater(() => {
      this.sendGameModeDetailsToLobbyWidget(player, room.gameMode);
    }, 0.1);
    this.notifyPlayerJoinedRoom(room, player);
  }
  exitRoomState(player) {
    const widgetManager = WidgetManager.instance;
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
      type: "exitRoom"
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
      type: "exitRoom"
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_CHAT, {
      type: "exitRoom"
    });
  }
  buildRoomData(player, room) {
    var _a;
    const players = room.getPlayers();
    let hostName = "알 수 없음";
    let hostId = room.hostId || "";
    if (room.hostId) {
      const hostPlayer = players.find(p => p.id === hostId);
      if (hostPlayer) {
        hostName = hostPlayer.name;
      } else {
        const gamePlayer = getPlayerById(hostId);
        if (gamePlayer) {
          hostName = gamePlayer.name;
        }
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
    const readyCount = playersList.filter(p => p.isReady || p.id === hostId).length;
    return {
      id: room.id,
      title: room.title,
      maxPlayers: room.maxPlayers,
      playerCount: players.length,
      readyCount: readyCount,
      gameMode: room.gameMode.getName(),
      state: room.state,
      isPlaying: room.state === GameState.IN_PROGRESS,
      host: {
        id: hostId,
        name: hostName
      },
      players: playersList,
      currentUser: {
        id: player.id,
        name: player.name,
        isReady: ((_a = player.tag) === null || _a === void 0 ? void 0 : _a.isReady) || false
      }
    };
  }
  sendGameModeDetailsToLobbyWidget(player, gameMode) {
    const widgetManager = WidgetManager.instance;
    const jobs = gameMode.getJobs();
    const jobsData = jobs.map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      team: job.team
    }));
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
      type: "gameModeDetails",
      modeData: {
        id: gameMode.getId(),
        name: gameMode.getName(),
        description: gameMode.getDescription(),
        jobs: jobsData
      }
    });
  }
  sendRoomInfoToPlayer(player, room) {
    const widgetManager = WidgetManager.instance;
    const roomData = this.buildRoomData(player, room);
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
      type: "roomInfo",
      roomData: roomData
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
      type: "updateRoomStatus",
      title: roomData.title,
      readyCount: roomData.readyCount,
      playerCount: roomData.playerCount
    });
  }
  sendGameModeDetailsToPlayer(player, gameMode) {
    this.sendGameModeDetailsToLobbyWidget(player, gameMode);
  }
  notifyPlayerJoinedRoom(room, player) {
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    players.forEach(p => {
      if (p.id !== player.id) {
        const gamePlayer = App.getPlayerByID(p.id);
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
          type: "systemMessage",
          content: `${player.name}님이 입장했습니다.`
        });
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "playerJoined",
          playerId: player.id,
          playerName: player.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  notifyPlayerLeftRoom(room, player) {
    const widgetManager = WidgetManager.instance;
    room.actionToRoomPlayers(p => {
      if (p.id === player.id) return;
      const gamePlayer = getPlayerById(p.id);
      if (!gamePlayer) return;
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
        type: "systemMessage",
        content: `${player.name}님이 퇴장했습니다.`
      });
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
        type: "playerLeft",
        playerId: player.id,
        playerName: player.name
      });
      this.sendRoomInfoToPlayer(gamePlayer, room);
    });
    this.updateRoomInfo();
  }
  notifyReadyStatusChanged(room, player) {
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      const statusMsg = player.tag.isReady ? `${player.name}님이 준비 완료했습니다.` : `${player.name}님이 준비를 취소했습니다.`;
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
        type: "systemMessage",
        content: statusMsg
      });
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
        type: "readyStatusChanged",
        playerId: player.id,
        isReady: player.tag.isReady
      });
      this.sendRoomInfoToPlayer(gamePlayer, room);
    });
  }
  notifyPlayerKicked(room, player) {
    const widgetManager = WidgetManager.instance;
    this.exitRoomState(player);
    showLabel(player, "방에서 강퇴되었습니다.");
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      if (gamePlayer) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
          type: "systemMessage",
          content: `${player.name}님이 강퇴되었습니다.`
        });
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "playerKicked",
          playerId: player.id,
          playerName: player.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  sendRoomChatMessage(room, sender, content) {
    const widgetManager = WidgetManager.instance;
    sender.sendMessageBubbleOnly(content);
    const chatMessage = {
      type: "chatMessage",
      senderId: sender.id,
      senderName: sender.name,
      content: content,
      timestamp: Date.now()
    };
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
    });
    sendAdminConsoleMessage(`[Room Chat ${room.id}] ${sender.name}: ${content}`);
  }
  sendChatMessageToRoom(room, sender, content) {
    this.sendRoomChatMessage(room, sender, content);
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
  onLeavePlayer(player) {
    var _a;
    sendAdminConsoleMessage(`[Game] Player ${player.name} (${player.id}) 퇴장`);
    if ((_a = player.tag) === null || _a === void 0 ? void 0 : _a.roomInfo) {
      const roomNum = player.tag.roomInfo.roomNum;
      const roomId = roomNum.toString();
      const room = this.mafiaGameRoomManager.getRoom(roomId);
      if (room) {
        room.leavePlayer(player.id);
        this.notifyPlayerLeftRoom(room, player);
        if (room.getPlayersCount() === 0) {
          sendAdminConsoleMessage(`[Game] 방 ${roomId}에 플레이어가 없어 삭제 확인`);
          const removed = this.mafiaGameRoomManager.removeRoom(roomId);
          sendAdminConsoleMessage(`[Game] 방 삭제 결과: ${removed ? "성공" : "실패"}`);
          if (!removed && this.mafiaGameRoomManager.getRoom(roomId)) {
            sendAdminConsoleMessage(`[Game] 방을 강제로 삭제합니다: ${roomId}`);
            delete this.mafiaGameRoomManager.gameRooms[roomId];
          }
        }
      }
    } else {
      this.sendSystemLobbyChatMessage(`${player.name}님이 게임을 나갔습니다.`);
    }
    const widgetManager = WidgetManager.instance;
    widgetManager.cleanupPlayerWidgets(player);
    this.updateRoomInfo();
    this.updateUsersInfo();
  }
  update(dt) {
    for (let i = 1; i <= Game.ROOM_COUNT; i++) {
      const room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room && room.flowManager.isGameInProgress()) {
        room.flowManager.updateGameState(dt);
      }
    }
  }
  onDestroy() {}
  getGameModesForUI() {
    const gameModes = [];
    const defaultModes = createDefaultGameModes();
    sendAdminConsoleMessage(`기본 게임 모드 로드: ${defaultModes.length}개`);
    defaultModes.forEach(mode => {
      const jobs = mode.getJobs();
      const jobIds = jobs.map(job => job.id);
      gameModes.push({
        id: mode.getId(),
        name: mode.getName(),
        description: mode.getDescription(),
        minPlayers: mode.getMinPlayers(),
        maxPlayers: mode.getMaxPlayers(),
        jobIds: jobIds
      });
    });
    sendAdminConsoleMessage(`게임 모드 UI 데이터 생성 완료: ${gameModes.length}개`);
    return gameModes;
  }
  sendUsersList(player) {
    var _a, _b;
    const widgetManager = WidgetManager.instance;
    const usersList = [];
    for (const p of App.players) {
      const gamePlayer = p;
      usersList.push({
        id: gamePlayer.id,
        name: gamePlayer.name,
        level: ((_b = (_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.level) || 1
      });
    }
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY, {
      type: "usersList",
      users: usersList
    });
    widgetManager.sendMessageToWidget(player, WidgetType.LOBBY_NAVBAR, {
      type: "updateOnlineCount",
      count: usersList.length
    });
  }
  updateUsersInfo() {
    var _a, _b, _c;
    const widgetManager = WidgetManager.instance;
    const usersList = [];
    for (const p of App.players) {
      const gamePlayer = p;
      usersList.push({
        id: gamePlayer.id,
        name: gamePlayer.name,
        level: ((_b = (_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.level) || 1
      });
    }
    for (const p of App.players) {
      const gamePlayer = p;
      if (!((_c = gamePlayer.tag) === null || _c === void 0 ? void 0 : _c.roomInfo)) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "usersList",
          users: usersList
        });
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_NAVBAR, {
          type: "updateOnlineCount",
          count: usersList.length
        });
      }
    }
  }
  updateRoomInfo() {
    var _a;
    const widgetManager = WidgetManager.instance;
    const roomsList = [];
    for (let i = 1; i <= Game.ROOM_COUNT; i++) {
      const room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room) {
        let hostName = "알 수 없음";
        if (room.hostId) {
          const hostPlayer = getPlayerById(room.hostId);
          if (hostPlayer) {
            hostName = hostPlayer.name;
          }
        }
        roomsList.push({
          id: room.id,
          title: room.title,
          playerCount: room.getPlayersCount(),
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode.getName(),
          isPlaying: room.state === GameState.IN_PROGRESS,
          state: room.state,
          hostId: room.hostId,
          hostName: hostName
        });
      }
    }
    const waitingRoomCount = roomsList.filter(r => r.state === GameState.WAITING).length;
    for (const p of App.players) {
      const gamePlayer = p;
      if (!((_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.roomInfo)) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "roomsList",
          rooms: roomsList
        });
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_NAVBAR, {
          type: "updateRoomCount",
          count: waitingRoomCount
        });
      }
    }
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
    this.mafiaGameRoomManager.on("roomCreated", room => {
      this.updateRoomInfo();
      sendAdminConsoleMessage(`[Game] 새로운 방이 생성되었습니다: ${room.id} - ${room.title}`);
    });
    this.mafiaGameRoomManager.on("playerJoinedRoom", (room, player) => {
      this.updateRoomInfo();
      sendAdminConsoleMessage(`[Game] 플레이어 ${player.name}가 방 ${room.id}에 입장했습니다.`);
    });
    this.mafiaGameRoomManager.on("playerKicked", (room, player) => {
      this.exitRoomState(player);
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
      const widgetManager = WidgetManager.instance;
      room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
          type: "systemMessage",
          content: "게임이 곧 시작됩니다..."
        });
        widgetManager.hideWidget(gamePlayer, WidgetType.LOBBY);
      });
    });
    this.mafiaGameRoomManager.on("gameEnded", room => {
      const widgetManager = WidgetManager.instance;
      room.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (!gamePlayer) return;
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
          type: "systemMessage",
          content: "게임이 종료되었습니다."
        });
      });
      this.updateRoomInfo();
    });
  }
  notifyHostChanged(room, newHost) {
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      if (gamePlayer) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, {
          type: "systemMessage",
          content: `${newHost.name}님이 새로운 방장이 되었습니다.`
        });
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "hostChanged",
          newHostId: newHost.id,
          newHostName: newHost.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  sendLobbyChatMessage(sender, content) {
    var _a;
    const widgetManager = WidgetManager.instance;
    sender.sendMessageBubbleOnly(content);
    const chatMessage = {
      type: "chatMessage",
      senderId: sender.id,
      senderName: sender.name,
      content: content,
      timestamp: Date.now()
    };
    for (const p of App.players) {
      const gamePlayer = p;
      if (!((_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.roomInfo)) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
      }
    }
    sendAdminConsoleMessage(`[Lobby Chat] ${sender.name}: ${content}`);
  }
  sendSystemLobbyChatMessage(content) {
    var _a;
    const widgetManager = WidgetManager.instance;
    const chatMessage = {
      type: "chatMessage",
      senderId: null,
      senderName: null,
      content: content,
      timestamp: Date.now()
    };
    for (const p of App.players) {
      const gamePlayer = p;
      if (!((_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.roomInfo)) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY_CHAT, chatMessage);
      }
    }
    sendAdminConsoleMessage(`[Lobby System] ${content}`);
  }
}
Game.ROOM_COUNT = 0;
;// CONCATENATED MODULE: ./main.ts

App.onInit.Add(() => {
  Game.create();
});
/******/ })()
;