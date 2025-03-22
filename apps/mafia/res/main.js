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
    topGapPC = -2,
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
  let baseTopGap = isMobile ? topGapMobile : topGapPC;
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
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/widget/WidgetType.ts
var WidgetType;
(function (WidgetType) {
  WidgetType["LOBBY"] = "LOBBY";
  WidgetType["ROOM"] = "ROOM";
  WidgetType["GAME_STATUS"] = "GAME_STATUS";
  WidgetType["NIGHT_ACTION"] = "NIGHT_ACTION";
  WidgetType["VOTE"] = "VOTE";
  WidgetType["FINAL_DEFENSE"] = "FINAL_DEFENSE";
  WidgetType["APPROVAL_VOTE"] = "APPROVAL_VOTE";
  WidgetType["DEAD_CHAT"] = "DEAD_CHAT";
  WidgetType["ROLE_CARD"] = "ROLE_CARD";
  WidgetType["GAME_MODE_SELECT"] = "GAME_MODE_SELECT";
})(WidgetType || (WidgetType = {}));
;// CONCATENATED MODULE: ../../libs/core/mafia/managers/widget/WidgetManager.ts


class WidgetManager {
  constructor() {
    this.playerWidgetMap = {};
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
    this.createAndInitializeWidget(player, widgetMap, WidgetType.LOBBY, "widgets/lobby_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.ROOM, "widgets/room_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.GAME_STATUS, "widgets/game_status.html", "middleright");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.NIGHT_ACTION, "widgets/night_action.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.VOTE, "widgets/vote_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.FINAL_DEFENSE, "widgets/final_defense_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.APPROVAL_VOTE, "widgets/approval_vote_widget.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.DEAD_CHAT, "widgets/dead_chat_widget.html", "middleright");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.ROLE_CARD, "widgets/role_card.html", "middle");
    this.createAndInitializeWidget(player, widgetMap, WidgetType.GAME_MODE_SELECT, "widgets/game_mode_select.html", "middle");
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
      case WidgetType.LOBBY:
        player.tag.widget.lobby = widget.element;
        break;
      case WidgetType.ROOM:
        player.tag.widget.room = widget.element;
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
      case WidgetType.DEAD_CHAT:
        player.tag.widget.deadChat = widget.element;
        break;
      case WidgetType.ROLE_CARD:
        player.tag.widget.roleCard = widget.element;
        break;
      case WidgetType.GAME_MODE_SELECT:
        player.tag.widget.gameModeSelect = widget.element;
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
        case WidgetType.LOBBY:
          player.tag.widget.lobby = null;
          break;
        case WidgetType.ROOM:
          player.tag.widget.room = null;
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
        case WidgetType.DEAD_CHAT:
          player.tag.widget.deadChat = null;
          break;
        case WidgetType.ROLE_CARD:
          player.tag.widget.roleCard = null;
          break;
        case WidgetType.GAME_MODE_SELECT:
          player.tag.widget.gameModeSelect = null;
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
      player.tag.widget.lobby = null;
      player.tag.widget.room = null;
      player.tag.widget.gameStatus = null;
      player.tag.widget.nightAction = null;
      player.tag.widget.voteWidget = null;
      player.tag.widget.finalDefense = null;
      player.tag.widget.approvalVote = null;
      player.tag.widget.deadChat = null;
      player.tag.widget.roleCard = null;
      player.tag.widget.gameModeSelect = null;
    }
    sendAdminConsoleMessage(`위젯 정리 완료 (플레이어: ${player.name})`);
  }
  getWidget(player, widgetType) {
    const widgetMap = this.playerWidgetMap[player.id];
    if (!widgetMap) return undefined;
    return widgetMap[widgetType];
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
  constructor(roomNumber) {
    this.state = GameState.WAITING;
    this.dayCount = 0;
    this.gameMode = "classic";
    this.room = null;
    this.phaseEndCallback = null;
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
      this.phaseTimer -= dt;
      if (Math.floor(this.phaseTimer) !== Math.floor(this.phaseTimer + dt)) {
        this.updateAllGameStatusWidgets();
      }
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
    const jobs = getJobsByGameMode(this.gameMode);
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
      myRole: player.jobId,
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
          this.room.actionToRoomPlayers(player => {
            var _a;
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
            if (player.isAlive) {
              widgetManager.clearMessageHandlers(gamePlayer, WidgetType.NIGHT_ACTION);
              widgetManager.showWidget(gamePlayer, WidgetType.NIGHT_ACTION);
              widgetManager.sendMessageToWidget(gamePlayer, WidgetType.NIGHT_ACTION, {
                type: "init",
                players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                role: player.jobId.toLowerCase(),
                timeLimit: phaseDurations[MafiaPhase.NIGHT],
                serverTime: Date.now()
              });
              widgetManager.clearMessageHandlers(gamePlayer, WidgetType.NIGHT_ACTION);
              widgetManager.registerMessageHandler(gamePlayer, WidgetType.NIGHT_ACTION, (player, data) => {
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
                  case "chatMessage":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.broadcastLoverMessage(player, data.message);
                    } else if (data.chatTarget === "dead") {
                      this.broadcastPermanentDeadMessage(player, data.message);
                    }
                    break;
                  case "initChat":
                    if (data.chatTarget === "lover" && mafiaPlayer.jobId === JobId.LOVER) {
                      this.initLoverChat(player);
                    } else if (data.chatTarget === "dead") {
                      this.initMediumChat(player);
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
          this.room.actionToRoomPlayers(player => {
            const gamePlayer = getPlayerById(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
            gamePlayer.tag.mafiaPlayer = player;
          });
          this.phaseTimer = phaseDurations[MafiaPhase.DAY];
          this.phaseEndCallback = () => this.nextPhase();
          this.checkWinCondition();
        }
        break;
      case MafiaPhase.VOTING:
        {
          this.sayToRoom(`투표 단계 - 마피아로 의심되는 플레이어에게 투표하세요.`);
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
          let defendantName = "";
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
          defendantName = defendant.name;
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
    widgetManager.showWidget(gamePlayer, WidgetType.VOTE);
    widgetManager.sendMessageToWidget(gamePlayer, WidgetType.VOTE, {
      type: "init",
      players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players.filter(p => p.isAlive && p.id !== player.id)) || [],
      timeLimit: phaseDurations[MafiaPhase.VOTING],
      serverTime: Date.now()
    });
    widgetManager.clearMessageHandlers(gamePlayer, WidgetType.VOTE);
    widgetManager.registerMessageHandler(gamePlayer, WidgetType.VOTE, (sender, data) => {
      if (data.type === "vote" && data.targetId) {
        const mafiaPlayer = sender.tag.mafiaPlayer;
        if (mafiaPlayer && mafiaPlayer.isAlive) {
          this.processVote(mafiaPlayer.id, data.targetId);
        }
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
    widgetManager.clearMessageHandlers(gamePlayer, WidgetType.FINAL_DEFENSE);
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
    widgetManager.clearMessageHandlers(gamePlayer, WidgetType.APPROVAL_VOTE);
    App.runLater(() => {
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
      widgetManager.clearMessageHandlers(gamePlayer, WidgetType.APPROVAL_VOTE);
      widgetManager.registerMessageHandler(gamePlayer, WidgetType.APPROVAL_VOTE, (sender, data) => {
        if (data.type === "submitApprovalVote" && (data.vote === "approve" || data.vote === "reject")) {
          const mafiaPlayer = sender.tag.mafiaPlayer;
          const currentDefendantId = this.findFinalDefenseDefendant();
          if (mafiaPlayer && mafiaPlayer.isAlive && mafiaPlayer.id !== currentDefendantId) {
            this.processApprovalVote(mafiaPlayer.id, data.vote);
          }
        }
      });
    }, 0.1);
  }
  showPermanentDeadChatWidget(player) {
    if (this.deadChatWidgetShown[player.id]) {
      return;
    }
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
    widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
      type: "initDeadChat",
      messages: this.chatMessages.filter(msg => msg.target === "dead")
    });
    widgetManager.clearMessageHandlers(player, WidgetType.DEAD_CHAT);
    widgetManager.registerMessageHandler(player, WidgetType.DEAD_CHAT, (sender, data) => {
      if (data.type === "sendMessage" && data.message) {
        this.broadcastPermanentDeadMessage(sender, data.message);
      }
    });
    this.deadChatWidgetShown[player.id] = true;
  }
  showMediumChatWidget(player) {
    if (this.deadChatWidgetShown[player.id]) {
      return;
    }
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.DEAD_CHAT);
    widgetManager.sendMessageToWidget(player, WidgetType.DEAD_CHAT, {
      type: "initMediumChat",
      messages: this.chatMessages.filter(msg => msg.target === "dead")
    });
    widgetManager.clearMessageHandlers(player, WidgetType.DEAD_CHAT);
    widgetManager.registerMessageHandler(player, WidgetType.DEAD_CHAT, (sender, data) => {
      if (data.type === "sendMessage" && data.message) {
        this.broadcastPermanentDeadMessage(sender, data.message);
      }
    });
    this.deadChatWidgetShown[player.id] = true;
  }
  getDeadPlayers() {
    return [...this.deadPlayers];
  }
  processVote(voterId, targetId) {
    if (this.currentPhase !== MafiaPhase.VOTING) {
      this.sayToRoom(`현재 단계는 투표 단계가 아닙니다.`);
      return;
    }
    if (this.playerVotes[voterId] === targetId) {
      this.sayToRoom(`이미 해당 플레이어에게 투표했습니다.`);
      return;
    }
    const targetPlayer = this.room.players.find(p => p.id === targetId);
    if (!targetPlayer || !targetPlayer.isAlive) {
      this.sayToRoom(`대상 플레이어가 유효하지 않습니다.`);
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
    let maxVotes = 0;
    let defendantId = null;
    for (const [playerId, votes] of Object.entries(this.voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        defendantId = playerId;
      }
    }
    const defendant = defendantId ? this.room.players.find(p => p.id === defendantId) : null;
    if (defendant && this.approvalVoteResults.approve > this.approvalVoteResults.reject) {
      defendant.isAlive = false;
      this.sayToRoom(`${defendant.name}님이 처형되었습니다.`);
      const gamePlayer = getPlayerById(defendant.id);
      if (gamePlayer) {
        this.showPermanentDeadChatWidget(gamePlayer);
      }
    } else if (defendant) {
      this.sayToRoom(`처형이 부결되었습니다.`);
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
        this.room.endGame();
        this.room.actionToRoomPlayers(player => {
          const gamePlayer = getPlayerById(player.id);
          if (!gamePlayer) return;
          const widgetManager = WidgetManager.instance;
          widgetManager.hideWidget(gamePlayer, WidgetType.GAME_STATUS);
          widgetManager.hideWidget(gamePlayer, WidgetType.NIGHT_ACTION);
          widgetManager.hideWidget(gamePlayer, WidgetType.VOTE);
          widgetManager.hideWidget(gamePlayer, WidgetType.FINAL_DEFENSE);
          widgetManager.hideWidget(gamePlayer, WidgetType.APPROVAL_VOTE);
          widgetManager.hideWidget(gamePlayer, WidgetType.DEAD_CHAT);
          if (gamePlayer.tag.widget.room) {
            gamePlayer.tag.widget.room.sendMessage({
              type: "gameEnded"
            });
          }
        });
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
    this.chatMessages = [];
    this.deadChatWidgetShown = {};
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
      this.finalizeApprovalVoting();
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
  updateAllGameStatusWidgets() {
    if (!this.room) return;
    this.room.actionToRoomPlayers(player => {
      const gamePlayer = getPlayerById(player.id);
      if (!gamePlayer) return;
      this.updateGameStatusWidget(gamePlayer, player);
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
      this.sayToRoom(`투표 결과 ${tiedPlayers.length > 1 ? '동률로' : '유효표가 없어'} 처형이 진행되지 않습니다.`);
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
    var _a;
    this.chatMessages.push({
      target: "dead",
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
  constructor(config) {
    this.hostId = null;
    this.players = [];
    this.readyPlayers = new Set();
    this.state = GameState.WAITING;
    this.roomLocation = null;
    this.callbacks = {};
    this.id = config.id;
    this.title = config.title;
    this.gameMode = config.gameMode;
    this.maxPlayers = config.maxPlayers;
    this.password = config.password;
    this.createdAt = Date.now();
    this.roomLocation = GAMEROOM_LOCATIONS[parseInt(this.id)];
    this.flowManager = new GameFlowManager(parseInt(this.id));
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
    const x = this.roomLocation.x + Math.floor(Math.random() * this.roomLocation.width);
    const y = this.roomLocation.y + Math.floor(Math.random() * this.roomLocation.height);
    player.spawnAt(x, y);
    player.setCameraTarget(this.roomLocation.x + this.roomLocation.width / 2, this.roomLocation.y + this.roomLocation.height / 2, 0);
    this.emit(WaitingRoomEvent.PLAYER_JOIN, this, player);
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
      player.setCameraTarget(-1);
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
    this.state = GameState.IN_PROGRESS;
    try {
      this.actionToRoomPlayers(player => {
        const gamePlayer = getPlayerById(player.id);
        if (gamePlayer) {
          const widgetManager = WidgetManager.instance;
          widgetManager.hideWidget(gamePlayer, WidgetType.LOBBY);
        }
      });
      this.flowManager.startGame();
    } catch (error) {
      sendAdminConsoleMessage("Error starting game:" + error);
      this.state = GameState.WAITING;
      return false;
    }
    this.emit(WaitingRoomEvent.GAME_START);
    return true;
  }
  endGame() {
    this.state = GameState.WAITING;
    this.readyPlayers.clear();
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
        name: hostPlayer ? hostPlayer.name : "알 수 없음"
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
      isReady: false,
      profile: this.getDefaultProfile(player)
    };
    if (!player.isMobile) {
      player.displayRatio = 1.25;
      player.sendUpdated();
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
              type: "initMediumChat"
            });
          }
        }
      }
    } else {
      App.runLater(() => {
        this.showLobbyWidget(player);
      }, 1);
    }
    this.updateUsersInfo();
    this.sendSystemLobbyChatMessage(`${player.name}님이 게임에 입장했습니다.`);
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
    widgetManager.showWidget(player, WidgetType.LOBBY);
    App.runLater(() => {
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
    const lobbyWidget = widgetManager.getWidget(player, WidgetType.LOBBY);
    if (lobbyWidget && lobbyWidget.element) {
      lobbyWidget.element.onMessage.Add((sender, data) => {
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
        } else if (data.type === "lobbyChatMessage" && data.content) {
          this.sendLobbyChatMessage(sender, data.content);
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
              widgetManager.hideWidget(sender, WidgetType.LOBBY);
              this.showRoomWidget(sender, room);
              this.updateRoomInfo();
            }
          }
        } else if (data.type === "joinRoom" && data.roomId) {
          const room = this.mafiaGameRoomManager.getRoom(data.roomId);
          if (room) {
            const joinResult = room.joinPlayer(sender);
            if (joinResult) {
              widgetManager.hideWidget(sender, WidgetType.LOBBY);
              this.showRoomWidget(sender, room);
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
              widgetManager.hideWidget(sender, WidgetType.ROOM);
              this.showLobbyWidget(sender);
              this.updateRoomInfo();
            }
          }
        }
      });
    }
  }
  showRoomWidget(player, room) {
    const widgetManager = WidgetManager.instance;
    widgetManager.showWidget(player, WidgetType.ROOM);
    App.runLater(() => {
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
    }, 0.1);
    this.notifyPlayerJoinedRoom(room, player);
    const roomWidget = widgetManager.getWidget(player, WidgetType.ROOM);
    if (roomWidget && roomWidget.element) {
      roomWidget.element.onMessage.Add((sender, data) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
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
              widgetManager.hideWidget(sender, WidgetType.ROOM);
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
                room.state = GameState.IN_PROGRESS;
                if (!room.hostId) {
                  room.hostId = sender.id;
                }
                room.flowManager.startGame();
                this.notifyGameStarting(room);
                this.updateRoomInfo();
              } else {
                widgetManager.sendMessageToWidget(sender, WidgetType.ROOM, {
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
                  widgetManager.hideWidget(targetPlayer, WidgetType.ROOM);
                  this.showLobbyWidget(targetPlayer);
                  this.notifyPlayerKicked(room, targetPlayer);
                  this.updateRoomInfo();
                }
              }
            }
          }
        } else if (data.type === "sendChatMessage" && data.content) {
          const roomId = (_h = sender.tag.roomInfo) === null || _h === void 0 ? void 0 : _h.roomNum;
          if (roomId) {
            const room = this.mafiaGameRoomManager.getRoom(roomId.toString());
            if (room) {
              this.sendChatMessageToRoom(room, sender, data.content);
            }
          }
        }
      });
    }
  }
  sendRoomInfoToPlayer(player, room) {
    var _a;
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    let hostName = "알 수 없음";
    let hostId = "";
    if (room.hostId) {
      hostId = room.hostId;
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
    widgetManager.sendMessageToWidget(player, WidgetType.ROOM, {
      type: "roomInfo",
      roomData: {
        id: room.id,
        title: room.title,
        maxPlayers: room.maxPlayers,
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
      }
    });
  }
  sendGameModeDetailsToPlayer(player, gameMode) {
    const widgetManager = WidgetManager.instance;
    const jobs = gameMode.getJobs();
    const jobsData = jobs.map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      team: job.team
    }));
    widgetManager.sendMessageToWidget(player, WidgetType.ROOM, {
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
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    players.forEach(p => {
      if (p.id !== player.id) {
        const gamePlayer = App.getPlayerByID(p.id);
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
          type: "playerJoined",
          playerId: player.id,
          playerName: player.name
        });
        this.sendRoomInfoToPlayer(gamePlayer, room);
      }
    });
  }
  notifyPlayerLeftRoom(room, player) {
    room.actionToRoomPlayers(p => {
      if (p.id === player.id) return;
      const gamePlayer = getPlayerById(p.id);
      if (!gamePlayer) return;
      if (gamePlayer.tag.widget.room) {
        gamePlayer.tag.widget.room.sendMessage({
          type: "playerLeft",
          playerId: player.id,
          playerName: player.name
        });
      }
    });
    this.updateRoomInfo();
  }
  notifyReadyStatusChanged(room, player) {
    const widgetManager = WidgetManager.instance;
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
        type: "readyStatusChanged",
        playerId: player.id,
        isReady: player.tag.isReady
      });
      this.sendRoomInfoToPlayer(gamePlayer, room);
    });
  }
  notifyGameStarting(room) {
    const widgetManager = WidgetManager.instance;
    room.state = GameState.IN_PROGRESS;
    const players = room.getPlayers();
    players.forEach(p => {
      const gamePlayer = App.getPlayerByID(p.id);
      widgetManager.hideWidget(gamePlayer, WidgetType.LOBBY);
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, {
        type: "gameStarting"
      });
    });
  }
  notifyPlayerKicked(room, player) {
    var _a, _b;
    if ((_b = (_a = player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.room) {
      const widgetManager = WidgetManager.instance;
      widgetManager.hideWidget(player, WidgetType.ROOM);
    }
    this.showLobbyWidget(player);
    showLabel(player, "방에서 강퇴되었습니다.");
  }
  sendChatMessageToRoom(room, sender, content) {
    const widgetManager = WidgetManager.instance;
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
      widgetManager.sendMessageToWidget(gamePlayer, WidgetType.ROOM, chatMessage);
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
    const widgetManager = WidgetManager.instance;
    widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);
    widgetManager.showWidget(player, WidgetType.GAME_MODE_SELECT);
    player.tag.widget.gameModeSelect.sendMessage({
      type: "init_game_modes",
      modes: GAME_MODES,
      jobs: JOBS
    });
    player.tag.widget.gameModeSelect.onMessage.Add((player, data) => {
      if (data.type === "cancel_mode_select") {
        const widgetManager = WidgetManager.instance;
        widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);
      } else if (data.type === "select_game_mode") {
        const modeId = data.modeId;
        const room = this.mafiaGameRoomManager.getRoom("1");
        room.flowManager.setGameMode(modeId);
        room.flowManager.startGame();
        const widgetManager = WidgetManager.instance;
        widgetManager.hideWidget(player, WidgetType.GAME_MODE_SELECT);
        this.updateRoomInfo();
      }
    });
  }
  showRoleCard(player, role) {
    const widgetManager = WidgetManager.instance;
    widgetManager.hideWidget(player, WidgetType.ROLE_CARD);
    widgetManager.showWidget(player, WidgetType.ROLE_CARD);
    player.tag.widget.roleCard.sendMessage({
      type: "setRole",
      role: role
    });
    player.tag.widget.roleCard.onMessage.Add((player, data) => {
      if (data.type === "close") {
        const widgetManager = WidgetManager.instance;
        widgetManager.hideWidget(player, WidgetType.ROLE_CARD);
      }
    });
  }
  onLeavePlayer(player) {
    var _a;
    sendAdminConsoleMessage(`[Game] Player ${player.name} (${player.id}) 퇴장`);
    if ((_a = player.tag) === null || _a === void 0 ? void 0 : _a.roomInfo) {
      const roomNum = player.tag.roomInfo.roomNum;
      const room = this.mafiaGameRoomManager.getRoom(roomNum.toString());
      if (room) {
        room.leavePlayer(player.id);
        this.notifyPlayerLeftRoom(room, player);
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
    for (const p of App.players) {
      const gamePlayer = p;
      if (!((_a = gamePlayer.tag) === null || _a === void 0 ? void 0 : _a.roomInfo)) {
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, {
          type: "roomsList",
          rooms: roomsList
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
  sendLobbyChatMessage(sender, content) {
    var _a;
    const widgetManager = WidgetManager.instance;
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
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, chatMessage);
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
        widgetManager.sendMessageToWidget(gamePlayer, WidgetType.LOBBY, chatMessage);
      }
    }
    sendAdminConsoleMessage(`[Lobby System] ${content}`);
  }
}
Game.ROOM_COUNT = 0;
;// CONCATENATED MODULE: ./main.ts

App.onInit.Add(() => {
  App.cameraEffect = 1;
  App.cameraEffectParam1 = 2000;
  App.sendUpdated();
  Game.create();
});
/******/ })()
;