/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 169:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __spreadArray = this && this.__spreadArray || function (to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.log = void 0;
exports.isDevServer = isDevServer;
exports.parseJsonString = parseJsonString;
exports.isEmpty = isEmpty;
exports.sendConsoleMessage = sendConsoleMessage;
exports.getPlayerId = getPlayerId;
exports.getPlayerById = getPlayerById;
exports.actionToAllPlayers = actionToAllPlayers;
exports.getCurrentTimeString = getCurrentTimeString;
exports.msToTime = msToTime;
exports.shuffleAndSplit = shuffleAndSplit;
exports.hexTo0xColor = hexTo0xColor;
exports.getLocationAreaCoordinates = getLocationAreaCoordinates;
var Localizer_1 = __webpack_require__(773);
function isDevServer() {
  //@ts-ignore
  return App.getServerEnv() !== "live";
}
function parseJsonString(str) {
  if (!str) return false;
  try {
    // JSON으로 파싱을 시도하고 결과를 반환합니다.
    return JSON.parse(str);
  } catch (e) {
    // 파싱 중 오류가 발생하면 false를 반환합니다.
    return false;
  }
}
function isEmpty(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
function sendConsoleMessage(player, message) {
  var playerId = getPlayerId(player);
  setTimeout(function () {
    if (!getPlayerById(playerId)) return;
  }, 500);
}
function getPlayerId(player) {
  var _a;
  return player.isGuest ? (_a = player.tag.guestId) !== null && _a !== void 0 ? _a : player.id : player.id;
  // return player.id;
}
function getPlayerById(playerId) {
  return App.players.find(function (player) {
    return getPlayerId(player) === playerId;
  });
  // return ScriptApp.getPlayerByID(playerId);
}
function actionToAllPlayers(action) {
  var args = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }
  for (var _a = 0, _b = App.players; _a < _b.length; _a++) {
    var player = _b[_a];
    if (!player) continue;
    try {
      action.apply(void 0, __spreadArray([player], args, false));
    } catch (error) {}
  }
}
function getCurrentTimeString() {
  var date = new Date();
  var utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  var kstGap = 9 * 60 * 60 * 1000;
  var today = new Date(utc + kstGap);
  return today.toISOString();
}
function msToTime(player, duration) {
  var milliseconds = parseInt((duration % 1000 / 100).toString(), 10),
    seconds = Math.floor(duration / 1000 % 60),
    minutes = Math.floor(duration / (1000 * 60) % 60);
  var minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
  var secondsStr = seconds < 10 ? "0" + seconds : seconds.toString();
  return Localizer_1.Localizer.getLocalizeString(player, "game_quiz_builder_dashboard_info_solve_time").replace("((MM))", minutesStr).replace("((SS))", secondsStr);
}
function shuffleAndSplit(arr) {
  var _a;
  // Fisher-Yates 알고리즘으로 배열 섞기
  var shuffledArr = __spreadArray([], arr, true);
  for (var i = shuffledArr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    _a = [shuffledArr[j], shuffledArr[i]], shuffledArr[i] = _a[0], shuffledArr[j] = _a[1];
  }
  var midIndex = Math.floor(shuffledArr.length / 2);
  // 배열을 반으로 나누기
  var firstHalf = shuffledArr.slice(0, midIndex);
  var secondHalf = shuffledArr.slice(midIndex);
  return [firstHalf, secondHalf];
}
function hexTo0xColor(hex) {
  return parseInt(hex.replace("#", ""), 16);
}
function getLocationAreaCoordinates(locationName) {
  if (!Map.hasLocation(locationName)) return null;
  var locationInfo = Map.getLocationList(locationName)[0];
  var coordinates = [];
  if (locationInfo) {
    for (var x = locationInfo.x; x < locationInfo.x + locationInfo.width; x++) {
      for (var y = locationInfo.y; y < locationInfo.y + locationInfo.height; y++) {
        coordinates.push([x, y]);
      }
    }
  }
  return coordinates;
}

/***/ }),

/***/ 206:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __spreadArray = this && this.__spreadArray || function (to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameFlowManager = exports.phaseDurations = exports.MafiaPhase = exports.GameState = void 0;
var Common_1 = __webpack_require__(169);
var JobTypes_1 = __webpack_require__(669);
// GameState Enum: 게임의 주요 상태를 정의
var GameState;
(function (GameState) {
  GameState["WAITING"] = "WAITING";
  GameState["IN_PROGRESS"] = "IN_PROGRESS";
  GameState["ENDED"] = "ENDED";
})(GameState || (exports.GameState = GameState = {}));
// 마피아 게임의 단계(phase)를 정의합니다.
var MafiaPhase;
(function (MafiaPhase) {
  // 4명보다 많은 경우에 사용되는 단계 순서: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 …
  MafiaPhase["NIGHT"] = "NIGHT";
  MafiaPhase["DAY"] = "DAY";
  MafiaPhase["VOTING"] = "VOTING";
  MafiaPhase["FINAL_DEFENSE"] = "FINAL_DEFENSE";
  MafiaPhase["APPROVAL_VOTING"] = "APPROVAL_VOTING";
})(MafiaPhase || (exports.MafiaPhase = MafiaPhase = {}));
exports.phaseDurations = (_a = {}, _a[MafiaPhase.NIGHT] = 30, _a[MafiaPhase.DAY] = 20, _a[MafiaPhase.VOTING] = 30, _a[MafiaPhase.FINAL_DEFENSE] = 20, _a[MafiaPhase.APPROVAL_VOTING] = 30, _a);
var GameFlowManager = /** @class */function () {
  function GameFlowManager(roomNumber) {
    this.state = GameState.WAITING;
    this.dayCount = 0;
    this.gameMode = "classic"; // 기본 게임 모드
    this.room = null;
    // 밤에 수행되는 액션들을 저장하는 변수들
    this.nightActions = [];
    // 투표 결과를 저장하는 변수
    this.voteResults = {};
    this.playerVotes = {}; // 각 플레이어가 누구에게 투표했는지
    this.roomNumber = roomNumber;
  }
  /**
   * 게임 룸 설정
   */
  GameFlowManager.prototype.setGameRoom = function (room) {
    this.room = room;
  };
  /**
   * 게임 모드 설정
   * @param mode 게임 모드 ID
   */
  GameFlowManager.prototype.setGameMode = function (mode) {
    this.gameMode = mode;
  };
  /**
   * 게임 시작
   * - 최소 4명의 플레이어가 있어야 합니다.
   * - 플레이어 역할을 무작위로 배정합니다.
   * - 플레이어 수에 따라 초기 단계가 결정됩니다.
   *   → 4명: 낮부터 시작
   *   → 4명보다 많은 경우: 밤부터 시작
   */
  GameFlowManager.prototype.startGame = function () {
    var _this = this;
    if (!this.room) {
      console.error("게임 룸이 설정되지 않았습니다.");
      return;
    }
    if (this.room.players.length < 4) {
      App.showCenterLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
      return;
    }
    // 플레이어 역할 무작위 배정
    var playersShuffled = __spreadArray([], this.room.players, true);
    playersShuffled.sort(function () {
      return Math.random() - 0.5;
    });
    // 기본 이모지 할당
    var emojis = ["😀", "😎", "🤠", "🧐", "🤓", "😊", "🙂", "��", "😁", "🤩"];
    // 게임 모드에 따른 직업 배정
    var availableJobs = this.getAvailableJobs();
    var jobsNeeded = Math.min(playersShuffled.length, availableJobs.length);
    // 직업 배정 및 이모지 할당
    for (var i = 0; i < playersShuffled.length; i++) {
      // 이모지 할당
      playersShuffled[i].emoji = emojis[i % emojis.length];
      // 직업 배정
      if (i < jobsNeeded) {
        playersShuffled[i].jobId = availableJobs[i].id;
        // 능력 사용 횟수 초기화
        if (availableJobs[i].usesPerGame) {
          playersShuffled[i].abilityUses = availableJobs[i].usesPerGame;
        }
      } else {
        // 남은 플레이어는 시민으로 설정
        playersShuffled[i].jobId = JobTypes_1.JobId.CITIZEN;
      }
      playersShuffled[i].isAlive = true;
    }
    // 게임 상태 초기화
    this.state = GameState.IN_PROGRESS;
    this.dayCount = 1;
    // 플레이어 수에 따라 초기 단계 결정
    if (this.room.players.length <= 4) {
      this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
      this.setPhase(MafiaPhase.DAY);
    } else {
      this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
      this.setPhase(MafiaPhase.NIGHT);
    }
    // 게임 시작 메시지 표시
    App.showCenterLabel("게임이 시작되었습니다!");
    // 각 플레이어에게 역할 카드 표시
    this.room.players.forEach(function (player) {
      var gamePlayer = _this.room.getGamePlayer(player.id);
      if (gamePlayer) {
        _this.showRoleCard(gamePlayer, player.jobId);
        _this.initGameStatusWidgets();
      }
    });
    // 첫 단계 실행
    this.executePhaseActions();
  };
  // 게임 모드에 따라 사용 가능한 직업 목록 가져오기
  GameFlowManager.prototype.getAvailableJobs = function () {
    // JobTypes.ts에서 getJobsByGameMode 함수 사용
    var jobs = (0, JobTypes_1.getJobsByGameMode)(this.gameMode);
    // 직업 섞기
    return __spreadArray([], jobs, true).sort(function () {
      return Math.random() - 0.5;
    });
  };
  // 역할 카드 표시
  GameFlowManager.prototype.showRoleCard = function (player, jobId) {
    var job = (0, JobTypes_1.getJobById)(jobId);
    if (!job) return;
    // 역할 카드 위젯 표시
    player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "popup", 300, 400);
    // 초기화 메시지 전송
    player.tag.widget.roleCard.sendMessage({
      type: "init",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    // 역할 정보 전송
    player.tag.widget.roleCard.sendMessage({
      type: "role_info",
      role: job.name,
      team: job.team,
      description: job.description,
      ability: job.abilityDescription,
      icon: job.icon || "❓"
    });
  };
  /**
   * 게임 상태 위젯을 모든 플레이어에게 초기화합니다.
   */
  GameFlowManager.prototype.initGameStatusWidgets = function () {
    var _this = this;
    if (!this.room) return;
    this.room.actionToRoomPlayers(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
      if (!gamePlayer) return;
      // 게임 상태 위젯 생성
      if (!gamePlayer.tag.widget) {
        gamePlayer.tag.widget = {};
      }
      // 게임 상태 위젯 생성
      gamePlayer.tag.widget.gameStatus = gamePlayer.showWidget("widgets/game_status.html", "middleright", 10, 10);
      // 초기화 메시지 전송
      gamePlayer.tag.widget.gameStatus.sendMessage({
        type: "init",
        isMobile: gamePlayer.isMobile,
        isTablet: gamePlayer.isTablet
      });
      // 게임 상태 정보 전송
      _this.updateGameStatusWidget(gamePlayer, player);
    });
  };
  /**
   * 특정 플레이어의 게임 상태 위젯을 업데이트합니다.
   */
  GameFlowManager.prototype.updateGameStatusWidget = function (gamePlayer, player) {
    var _a;
    if (!gamePlayer || !gamePlayer.tag.widget.gameStatus) return;
    gamePlayer.tag.widget.gameStatus.sendMessage({
      type: 'updateGameStatus',
      phase: this.currentPhase,
      day: this.dayCount,
      players: ((_a = this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
      myRole: player.jobId,
      myPlayerId: player.id,
      timeRemaining: this.phaseTimer
    });
  };
  /**
   * 모든 플레이어의 게임 상태 위젯을 업데이트합니다.
   */
  GameFlowManager.prototype.updateAllGameStatusWidgets = function () {
    var _this = this;
    if (!this.room) return;
    this.room.actionToRoomPlayers(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
      if (!gamePlayer) return;
      _this.updateGameStatusWidget(gamePlayer, player);
    });
  };
  /**
   * 현재 단계에서 다음 단계로 전환합니다.
   * 단계 순서는 phaseCycle 배열에 따라 진행되며,
   * 사이클이 처음으로 돌아오면 dayCount를 증가시킵니다.
   */
  GameFlowManager.prototype.nextPhase = function () {
    if (this.state !== GameState.IN_PROGRESS) {
      App.sayToAll("게임이 진행 중이 아닙니다.");
      return;
    }
    var currentIndex = this.phaseCycle.indexOf(this.currentPhase);
    var nextIndex = (currentIndex + 1) % this.phaseCycle.length;
    // 사이클이 처음으로 돌아오면 dayCount 증가
    if (nextIndex === 0) {
      this.dayCount++;
    }
    this.setPhase(this.phaseCycle[nextIndex]);
    App.sayToAll("Room ".concat(this.room.id, ": \uB2E8\uACC4 \uC804\uD658 -> ").concat(this.currentPhase, " (Day ").concat(this.dayCount, ")"));
    // 모든 플레이어의 게임 상태 위젯 업데이트
    this.updateAllGameStatusWidgets();
    // 단계별 액션 실행
    this.executePhaseActions();
  };
  /**
   * 각 단계에 따른 행동을 추상화하여 처리합니다.
   */
  GameFlowManager.prototype.executePhaseActions = function () {
    var _this = this;
    if (!this.room) return;
    switch (this.currentPhase) {
      case MafiaPhase.NIGHT:
        {
          App.sayToAll("Room ".concat(this.room.id, ": \uBC24 \uB2E8\uACC4 - \uB9C8\uD53C\uC544\uAC00 \uD76C\uC0DD\uC790\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4."));
          // 투표 결과 초기화
          this.voteResults = {};
          this.playerVotes = {};
          this.room.actionToRoomPlayers(function (player) {
            var _a;
            var gamePlayer = (0, Common_1.getPlayerById)(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            // 밤 액션 위젯 표시
            if (player.isAlive) {
              // 밤 액션 위젯 생성
              gamePlayer.tag.widget.nightAction = gamePlayer.showWidget("widgets/night_action.html", "middle", 0, 0);
              // 초기화 메시지 전송
              gamePlayer.tag.widget.nightAction.sendMessage({
                type: 'init',
                isMobile: gamePlayer.isMobile,
                isTablet: gamePlayer.isTablet
              });
              // 밤 액션 위젯에 데이터 전송
              gamePlayer.tag.widget.nightAction.sendMessage({
                type: 'init',
                players: ((_a = _this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                role: player.jobId,
                timeLimit: exports.phaseDurations[MafiaPhase.NIGHT]
              });
              // 밤 액션 위젯 메시지 처리
              gamePlayer.tag.widget.nightAction.onMessage.Add(function (player, data) {
                var mafiaPlayer = player.tag.mafiaPlayer;
                if (data.type === "kill" && (mafiaPlayer === null || mafiaPlayer === void 0 ? void 0 : mafiaPlayer.jobId) === JobTypes_1.JobId.MAFIA) {
                  _this.mafiaAction(data.targetId);
                } else if (data.type === "investigate" && (mafiaPlayer === null || mafiaPlayer === void 0 ? void 0 : mafiaPlayer.jobId) === JobTypes_1.JobId.POLICE) {
                  _this.policeAction(data.targetId, player);
                } else if (data.type === "heal" && (mafiaPlayer === null || mafiaPlayer === void 0 ? void 0 : mafiaPlayer.jobId) === JobTypes_1.JobId.DOCTOR) {
                  _this.doctorAction(data.targetId);
                } else if (data.type === "close") {
                  player.tag.widget.nightAction.destroy();
                  player.tag.widget.nightAction = null;
                }
              });
            }
          });
        }
        break;
      case MafiaPhase.DAY:
        {
          // 밤 액션 결과 평가
          this.evaluateNightActions();
          App.sayToAll("Room ".concat(this.room.id, ": \uB0AE \uB2E8\uACC4 - \uD50C\uB808\uC774\uC5B4\uB4E4\uC774 \uD1A0\uB860\uC744 \uC9C4\uD589\uD569\uB2C8\uB2E4."));
          this.room.actionToRoomPlayers(function (player) {
            var gamePlayer = (0, Common_1.getPlayerById)(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            // 밤 액션 위젯 제거
            if (gamePlayer.tag.widget.nightAction) {
              gamePlayer.tag.widget.nightAction.destroy();
              gamePlayer.tag.widget.nightAction = null;
            }
            // 플레이어 정보 저장
            gamePlayer.tag.mafiaPlayer = player;
          });
          // 승리 조건 체크
          this.checkWinCondition();
        }
        break;
      case MafiaPhase.VOTING:
        {
          App.sayToAll("Room ".concat(this.room.id, ": \uD22C\uD45C \uB2E8\uACC4 - \uB9C8\uD53C\uC544\uB85C \uC758\uC2EC\uB418\uB294 \uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uD22C\uD45C\uD558\uC138\uC694."));
          // 투표 결과 초기화
          this.voteResults = {};
          this.playerVotes = {};
          this.room.actionToRoomPlayers(function (player) {
            var _a;
            var gamePlayer = (0, Common_1.getPlayerById)(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            // 투표 위젯 표시 (살아있는 플레이어만)
            if (player.isAlive) {
              // 투표 위젯 생성
              gamePlayer.tag.widget.voteWidget = gamePlayer.showWidget("widgets/vote_widget.html", "middle", 0, 0);
              // 초기화 메시지 전송
              gamePlayer.tag.widget.voteWidget.sendMessage({
                type: 'init',
                isMobile: gamePlayer.isMobile,
                isTablet: gamePlayer.isTablet
              });
              // 투표 위젯에 데이터 전송
              gamePlayer.tag.widget.voteWidget.sendMessage({
                type: 'init',
                players: ((_a = _this.room) === null || _a === void 0 ? void 0 : _a.players) || [],
                myPlayerId: player.id,
                timeLimit: exports.phaseDurations[MafiaPhase.VOTING]
              });
              // 투표 위젯 메시지 처리
              gamePlayer.tag.widget.voteWidget.onMessage.Add(function (player, data) {
                if (data.type === "vote") {
                  _this.processVote(player.id, data.targetId);
                } else if (data.type === "close") {
                  player.tag.widget.voteWidget.destroy();
                  player.tag.widget.voteWidget = null;
                }
              });
            }
          });
        }
        break;
      default:
        App.sayToAll("Room ".concat(this.room.id, ": \uC54C \uC218 \uC5C6\uB294 \uB2E8\uACC4\uC785\uB2C8\uB2E4."));
    }
    if (this.dayCount == 0) this.dayCount = 1;
  };
  /**
   * 투표 처리
   * @param voterId 투표한 플레이어 ID
   * @param targetId 투표 대상 플레이어 ID
   */
  GameFlowManager.prototype.processVote = function (voterId, targetId) {
    // 이미 투표한 경우 이전 투표 취소
    if (this.playerVotes[voterId]) {
      var previousTarget = this.playerVotes[voterId];
      this.voteResults[previousTarget]--;
    }
    // 새 투표 등록
    this.playerVotes[voterId] = targetId;
    // 투표 결과 업데이트
    if (!this.voteResults[targetId]) {
      this.voteResults[targetId] = 1;
    } else {
      this.voteResults[targetId]++;
    }
    // 모든 플레이어에게 투표 결과 업데이트
    this.updateVoteResults();
    // 모든 플레이어가 투표했는지 확인
    var alivePlayers = this.room.players.filter(function (p) {
      return p.isAlive;
    });
    var votedPlayers = Object.keys(this.playerVotes).length;
    if (votedPlayers >= alivePlayers.length) {
      // 모든 플레이어가 투표 완료
      this.finalizeVoting();
    }
  };
  /**
   * 모든 플레이어에게 투표 결과 업데이트
   */
  GameFlowManager.prototype.updateVoteResults = function () {
    var _this = this;
    if (!this.room) return;
    this.room.actionToRoomPlayers(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
      gamePlayer.tag.widget.voteWidget.sendMessage({
        type: 'updateVotes',
        votes: _this.voteResults
      });
    });
  };
  /**
   * 투표 종료 및 결과 처리
   */
  GameFlowManager.prototype.finalizeVoting = function () {
    var _this = this;
    if (!this.room) return;
    // 가장 많은 표를 받은 플레이어 찾기
    var maxVotes = 0;
    var eliminatedPlayerId = null;
    for (var _i = 0, _a = Object.entries(this.voteResults); _i < _a.length; _i++) {
      var _b = _a[_i],
        playerId = _b[0],
        votes = _b[1];
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
      }
    }
    // 투표 결과 표시
    this.room.actionToRoomPlayers(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
      if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
      gamePlayer.tag.widget.voteWidget.sendMessage({
        type: 'showResults',
        results: _this.voteResults
      });
    });
    // 3초 후 투표 위젯 제거 및 다음 단계로
    App.runLater(function () {
      if (!_this.room) return;
      // 투표 위젯 제거
      _this.room.actionToRoomPlayers(function (player) {
        var gamePlayer = (0, Common_1.getPlayerById)(player.id);
        if (!gamePlayer || !gamePlayer.tag.widget.voteWidget) return;
        gamePlayer.tag.widget.voteWidget.destroy();
        gamePlayer.tag.widget.voteWidget = null;
      });
      // 플레이어 탈락 처리
      if (eliminatedPlayerId) {
        var targetPlayer = _this.room.players.find(function (p) {
          return p.id === eliminatedPlayerId;
        });
        if (targetPlayer) {
          targetPlayer.isAlive = false;
          App.sayToAll("Room ".concat(_this.room.id, ": ").concat(targetPlayer.name, "(").concat(targetPlayer.jobId, ") \uD50C\uB808\uC774\uC5B4\uAC00 \uD22C\uD45C\uB85C \uD0C8\uB77D\uD588\uC2B5\uB2C8\uB2E4."));
        }
      }
      // 승리 조건 체크
      _this.checkWinCondition();
      // 다음 단계로
      if (_this.state === GameState.IN_PROGRESS) {
        _this.nextPhase();
      }
    }, 3);
  };
  /**
   * 밤 단계에서 마피아가 희생 대상을 선택합니다.
   * @param targetPlayerId 선택한 대상 플레이어의 ID
   */
  GameFlowManager.prototype.mafiaAction = function (targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobTypes_1.JobId.MAFIA
    });
  };
  /**
   * 밤 단계에서 의사가 보호할 대상을 선택합니다.
   * @param targetPlayerId 선택한 보호 대상 플레이어의 ID
   */
  GameFlowManager.prototype.doctorAction = function (targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobTypes_1.JobId.DOCTOR
    });
  };
  /**
   * 밤 단계에서 경찰이 조사할 대상을 선택합니다.
   * @param targetPlayerId 조사할 플레이어의 ID
   * @param policePlayer 경찰 플레이어
   */
  GameFlowManager.prototype.policeAction = function (targetPlayerId, policePlayer) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      return;
    }
    this.nightActions.push({
      playerId: targetPlayerId,
      targetId: targetPlayerId,
      jobId: JobTypes_1.JobId.POLICE
    });
    // 대상 플레이어 찾기
    var targetPlayer = this.room.players.find(function (p) {
      return p.id === targetPlayerId;
    });
    if (!targetPlayer) return;
    // 조사 결과 전송
    var isMafia = targetPlayer.jobId === JobTypes_1.JobId.MAFIA;
    // 경찰 플레이어에게 결과 전송
    if (policePlayer.tag.widget.nightAction) {
      policePlayer.tag.widget.nightAction.sendMessage({
        type: 'investigationResult',
        isMafia: isMafia
      });
    }
  };
  /**
   * 밤 단계 액션 평가
   * - 마피아가 선택한 대상이 의사의 보호 대상과 동일하면 보호 성공.
   * - 그렇지 않으면 해당 플레이어를 사망 처리합니다.
   */
  GameFlowManager.prototype.evaluateNightActions = function () {
    var _this = this;
    // 밤 액션 처리 로직
    var killedPlayers = [];
    var protectedPlayers = [];
    var blockedPlayers = [];
    // 보호 액션 먼저 처리
    this.nightActions.forEach(function (action) {
      var job = (0, JobTypes_1.getJobById)(action.jobId);
      if (!job) return;
      // 의사 등의 보호 능력
      if (job.abilityType === JobTypes_1.JobAbilityType.PROTECT) {
        protectedPlayers.push(action.targetId);
      }
      // 투표 방해 능력
      if (job.abilityType === JobTypes_1.JobAbilityType.BLOCK) {
        blockedPlayers.push(action.targetId);
      }
    });
    // 살해 액션 처리
    this.nightActions.forEach(function (action) {
      var job = (0, JobTypes_1.getJobById)(action.jobId);
      if (!job) return;
      // 마피아 등의 살해 능력
      if (job.abilityType === JobTypes_1.JobAbilityType.KILL) {
        var target = _this.room.players.find(function (p) {
          return p.id === action.targetId;
        });
        if (!target || !target.isAlive) return;
        // 보호되지 않았고, 면역이 없으면 사망
        if (!protectedPlayers.includes(action.targetId) && !target.isImmune) {
          killedPlayers.push(action.targetId);
        } else if (target.isImmune) {
          // 면역이 있으면 면역 소모
          target.isImmune = false;
        }
      }
    });
    // 투표 방해 상태 적용
    blockedPlayers.forEach(function (playerId) {
      var player = _this.room.players.find(function (p) {
        return p.id === playerId;
      });
      if (player) {
        player.isBlocked = true;
      }
    });
    // 사망 처리
    killedPlayers.forEach(function (playerId) {
      var player = _this.room.players.find(function (p) {
        return p.id === playerId;
      });
      if (player) {
        player.isAlive = false;
        // 사망 메시지 표시
        App.showCenterLabel("".concat(player.name, "\uB2D8\uC774 \uC0AC\uB9DD\uD588\uC2B5\uB2C8\uB2E4."));
        // 사망한 플레이어에게 메시지 전송
        var gamePlayer = _this.room.getGamePlayer(playerId);
        if (gamePlayer) {
          gamePlayer.tag.widget.main.sendMessage({
            type: "player_died",
            message: "당신은 사망했습니다."
          });
        }
      }
    });
    // 밤 액션 초기화
    this.nightActions = [];
    // 승리 조건 확인
    this.checkWinCondition();
  };
  /**
   * 승리 조건 체크
   * - 살아있는 플레이어 중 마피아가 0명이면 시민 승리
   * - 마피아 수가 시민(및 기타) 수 이상이면 마피아 승리
   */
  GameFlowManager.prototype.checkWinCondition = function () {
    var _this = this;
    var alivePlayers = this.room.players.filter(function (p) {
      return p.isAlive;
    });
    var aliveMafia = alivePlayers.filter(function (p) {
      return _this.isMafia(p);
    });
    var aliveCitizens = alivePlayers.filter(function (p) {
      return !_this.isMafia(p);
    });
    // 마피아가 모두 사망한 경우 시민 승리
    if (aliveMafia.length === 0) {
      this.showGameResult(JobTypes_1.JobTeam.CITIZEN);
      return true;
    }
    // 마피아 수가 시민 수 이상인 경우 마피아 승리
    if (aliveMafia.length >= aliveCitizens.length) {
      this.showGameResult(JobTypes_1.JobTeam.MAFIA);
      return true;
    }
    return false;
  };
  /**
   * 게임 결과 표시
   * @param winnerTeam 승리한 팀
   */
  GameFlowManager.prototype.showGameResult = function (winnerTeam) {
    var _this = this;
    // 게임 종료 상태로 변경
    this.state = GameState.ENDED;
    // 승리 메시지 표시
    var winMessage = winnerTeam === JobTypes_1.JobTeam.MAFIA ? "마피아 팀이 승리했습니다!" : "시민 팀이 승리했습니다!";
    App.showCenterLabel(winMessage);
    // 모든 플레이어에게 결과 메시지 전송
    this.room.players.forEach(function (player) {
      var gamePlayer = _this.room.getGamePlayer(player.id);
      if (gamePlayer) {
        var job = (0, JobTypes_1.getJobById)(player.jobId);
        var isWinner = (job === null || job === void 0 ? void 0 : job.team) === winnerTeam;
        gamePlayer.tag.widget.main.sendMessage({
          type: "game_result",
          winner: winnerTeam,
          isWinner: isWinner,
          message: winMessage
        });
      }
    });
    // 5초 후 게임 리셋
    setTimeout(function () {
      _this.resetGame();
    }, 5000);
  };
  // 게임 리셋: 게임 상태와 단계 등을 초기화합니다.
  GameFlowManager.prototype.resetGame = function () {
    if (!this.room) return;
    this.state = GameState.WAITING;
    if (this.phaseCycle) {
      this.setPhase(this.phaseCycle[0]);
    } else {
      this.setPhase(MafiaPhase.DAY);
    }
    this.dayCount = 1;
    // 모든 위젯 제거
    this.room.actionToRoomPlayers(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
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
    App.sayToAll("Room ".concat(this.room.id, ": \uAC8C\uC784\uC774 \uB9AC\uC14B\uB418\uC5C8\uC2B5\uB2C8\uB2E4."));
  };
  GameFlowManager.prototype.setPhase = function (phase) {
    this.currentPhase = phase;
    this.phaseTimer = exports.phaseDurations[this.currentPhase];
  };
  GameFlowManager.prototype.getCurrentPhase = function () {
    return this.currentPhase;
  };
  GameFlowManager.prototype.isGameInProgress = function () {
    return this.state === GameState.IN_PROGRESS;
  };
  // 플레이어의 팀 확인 (마피아 여부)
  GameFlowManager.prototype.isMafia = function (player) {
    var job = (0, JobTypes_1.getJobById)(player.jobId);
    return (job === null || job === void 0 ? void 0 : job.team) === JobTypes_1.JobTeam.MAFIA;
  };
  // 능력 사용 처리
  GameFlowManager.prototype.processAbility = function (playerId, targetId) {
    if (!this.room) return;
    var player = this.room.getPlayer(playerId);
    if (!player || !player.isAlive) return;
    var job = (0, JobTypes_1.getJobById)(player.jobId);
    if (!job) return;
    // 능력 사용 횟수 확인
    if (job.usesPerGame !== undefined && player.abilityUses !== undefined) {
      if (player.abilityUses <= 0) return;
      player.abilityUses--;
    }
    // 밤 능력인데 현재 밤이 아니면 사용 불가
    if (job.nightAbility && this.currentPhase !== MafiaPhase.NIGHT) return;
    // 낮 능력인데 현재 낮이 아니면 사용 불가
    if (job.dayAbility && this.currentPhase !== MafiaPhase.DAY) return;
    // 능력 사용 기록
    this.nightActions.push({
      playerId: playerId,
      targetId: targetId,
      jobId: player.jobId
    });
    // 플레이어에게 능력 사용 확인 메시지 전송
    var gamePlayer = this.room.getGamePlayer(playerId);
    if (gamePlayer) {
      gamePlayer.tag.widget.main.sendMessage({
        type: "ability_used",
        success: true,
        message: "".concat(job.name, " \uB2A5\uB825\uC744 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4.")
      });
    }
  };
  return GameFlowManager;
}();
exports.GameFlowManager = GameFlowManager;

/***/ }),

/***/ 401:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __extends = this && this.__extends || function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d, b);
  };
  return function (d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Game = void 0;
var Common_1 = __webpack_require__(169);
var Localizer_1 = __webpack_require__(773);
var GameBase_1 = __webpack_require__(771);
var GameRoomManager_1 = __webpack_require__(500);
var JobTypes_1 = __webpack_require__(669);
var defaultGameModes_1 = __webpack_require__(764);
var ROOM_COUNT = 1;
var Game = /** @class */function (_super) {
  __extends(Game, _super);
  function Game() {
    var _this = _super.call(this) || this;
    _this.mafiaGameRoomManager = new GameRoomManager_1.GameRoomManager();
    _this.addOnStartCallback(_this.onStart.bind(_this));
    _this.addOnJoinPlayerCallback(_this.onJoinPlayer.bind(_this));
    _this.addOnLeavePlayerCallback(_this.onLeavePlayer.bind(_this));
    _this.addOnUpdateCallback(_this.update.bind(_this));
    _this.addOnDestroyCallback(_this.onDestroy.bind(_this));
    // 게임 모드 등록
    var gameModes = (0, defaultGameModes_1.createDefaultGameModes)();
    gameModes.forEach(function (mode) {
      _this.mafiaGameRoomManager.registerGameMode(mode);
    });
    // 기본 게임방 생성
    var defaultGameMode = gameModes.find(function (mode) {
      return mode.getId() === "classic";
    }) || gameModes[0];
    _this.mafiaGameRoomManager.createRoom({
      title: "기본 게임방",
      gameMode: defaultGameMode,
      maxPlayers: 8
    });
    return _this;
  }
  Game.create = function () {
    if (!Game._instance) {
      Game._instance = new Game();
    }
  };
  Game.prototype.onStart = function () {
    App.enableFreeView = false;
    App.sendUpdated();
  };
  Game.prototype.onJoinPlayer = function (player) {
    player.tag = {
      widget: {},
      mafiaPlayer: null
    };
    // 로컬라이징
    Localizer_1.Localizer.prepareLocalizationContainer(player);
    //@ts-ignore
    var customData = (0, Common_1.parseJsonString)(player.customData);
    // 로비 위젯 표시
    this.showLobbyWidget(player);
  };
  /**
   * 로비 위젯을 표시합니다.
   * @param player 플레이어
   */
  Game.prototype.showLobbyWidget = function (player) {
    var _this = this;
    // 이미 메인 위젯이 있으면 제거
    if (player.tag.widget.main) {
      player.tag.widget.main.destroy();
    }
    // 로비 위젯 생성
    player.tag.widget.main = player.showWidget("widgets/lobby_widget.html", "middle", 0, 0);
    // 초기화 메시지 전송
    player.tag.widget.main.sendMessage({
      type: "init",
      message: "코드 마피아",
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    // 게임 방 정보 전송
    var rooms = [];
    for (var i = 1; i <= ROOM_COUNT; i++) {
      var room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room) {
        rooms.push({
          id: room.id,
          title: room.title,
          playerCount: room.getPlayersCount(),
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode.getName(),
          isInProgress: room.flowManager.isGameInProgress()
        });
      }
    }
    player.tag.widget.main.sendMessage({
      type: "updateRooms",
      rooms: rooms
    });
    // 로비 위젯 메시지 처리 설정
    player.tag.widget.main.onMessage.Add(function (player, data) {
      if (data.type === "showRoleDetail" && data.role) {
        _this.showRoleCard(player, data.role);
      } else if (data.type === "startGame") {
        _this.showGameModeSelect(player);
      } else if (data.type === "joinRoom" && data.roomId) {
        var room = _this.mafiaGameRoomManager.getRoom(data.roomId);
        if (room) {
          room.joinPlayer(player);
          // 방 참가 후 UI 업데이트
          player.tag.widget.main.sendMessage({
            type: "joinedRoom",
            roomId: data.roomId,
            roomInfo: {
              id: room.id,
              title: room.title,
              playerCount: room.getPlayersCount(),
              maxPlayers: room.maxPlayers,
              gameMode: room.gameMode.getName(),
              isInProgress: room.flowManager.isGameInProgress()
            }
          });
          // 모든 플레이어에게 방 정보 업데이트 전송
          _this.updateRoomInfo();
        }
      } else if (data.type === "leaveRoom") {
        if (player.tag.roomInfo) {
          var roomNum = player.tag.roomInfo.roomNum;
          _this.mafiaGameRoomManager.getRoom(roomNum.toString()).leavePlayer(player.id);
          // 방 퇴장 후 UI 업데이트
          player.tag.widget.main.sendMessage({
            type: "leftRoom"
          });
          // 모든 플레이어에게 방 정보 업데이트 전송
          _this.updateRoomInfo();
        }
      } else if (data.type === "refreshRooms") {
        // 게임 방 정보 업데이트 전송
        var rooms_1 = [];
        for (var i = 1; i <= ROOM_COUNT; i++) {
          var room = _this.mafiaGameRoomManager.getRoom(i.toString());
          if (room) {
            rooms_1.push({
              id: room.id,
              title: room.title,
              playerCount: room.getPlayersCount(),
              maxPlayers: room.maxPlayers,
              gameMode: room.gameMode.getName(),
              isInProgress: room.flowManager.isGameInProgress()
            });
          }
        }
        player.tag.widget.main.sendMessage({
          type: "updateRooms",
          rooms: rooms_1
        });
      }
    });
  };
  /**
   * 게임 모드 선택 위젯을 표시합니다.
   * @param player 플레이어
   */
  Game.prototype.showGameModeSelect = function (player) {
    var _this = this;
    // 이미 게임 모드 선택 위젯이 있으면 제거
    if (player.tag.widget.gameModeSelect) {
      player.tag.widget.gameModeSelect.destroy();
    }
    // 게임 모드 선택 위젯 생성
    player.tag.widget.gameModeSelect = player.showWidget("widgets/game_mode_select.html", "middle", 0, 0);
    // 초기화 메시지 전송
    player.tag.widget.gameModeSelect.sendMessage({
      type: 'init',
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    // 게임 모드 정보 전송
    player.tag.widget.gameModeSelect.sendMessage({
      type: 'init_game_modes',
      modes: JobTypes_1.GAME_MODES,
      jobs: JobTypes_1.JOBS
    });
    // 게임 모드 선택 위젯 메시지 처리
    player.tag.widget.gameModeSelect.onMessage.Add(function (player, data) {
      if (data.type === "cancel_mode_select") {
        player.tag.widget.gameModeSelect.destroy();
        player.tag.widget.gameModeSelect = null;
      } else if (data.type === "select_game_mode") {
        var modeId = data.modeId;
        var room = _this.mafiaGameRoomManager.getRoom("1");
        // 게임 모드 설정
        room.flowManager.setGameMode(modeId);
        // 게임 시작
        room.flowManager.startGame();
        // 위젯 제거
        player.tag.widget.gameModeSelect.destroy();
        player.tag.widget.gameModeSelect = null;
        // 모든 플레이어에게 방 정보 업데이트 전송
        _this.updateRoomInfo();
      }
    });
  };
  /**
   * 역할 카드 위젯을 표시합니다.
   * @param player 플레이어
   * @param role 역할
   */
  Game.prototype.showRoleCard = function (player, role) {
    // 이미 역할 카드 위젯이 있으면 제거
    if (player.tag.widget.roleCard) {
      player.tag.widget.roleCard.destroy();
    }
    // 역할 카드 위젯 생성
    player.tag.widget.roleCard = player.showWidget("widgets/role_card.html", "middle", 0, 0);
    // 초기화 메시지 전송
    player.tag.widget.roleCard.sendMessage({
      type: 'init',
      isMobile: player.isMobile,
      isTablet: player.isTablet
    });
    // 역할 정보 전송
    player.tag.widget.roleCard.sendMessage({
      type: 'setRole',
      role: role
    });
    // 역할 카드 위젯 메시지 처리
    player.tag.widget.roleCard.onMessage.Add(function (player, data) {
      if (data.type === "close") {
        player.tag.widget.roleCard.destroy();
        player.tag.widget.roleCard = null;
      }
    });
  };
  Game.prototype.onLeavePlayer = function (player) {
    // 플레이어가 속한 방이 있으면 해당 방에서 제거
    if (player.tag.roomInfo) {
      var roomNum = player.tag.roomInfo.roomNum;
      this.mafiaGameRoomManager.getRoom(roomNum.toString()).leavePlayer(player.id);
    }
  };
  Game.prototype.update = function (dt) {
    // 각 방의 게임 상태 업데이트
    for (var i = 1; i <= ROOM_COUNT; i++) {
      var room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room && room.flowManager.isGameInProgress()) {
        // 타이머 업데이트
        if (room.flowManager.phaseTimer > 0) {
          room.flowManager.phaseTimer -= dt;
          // 타이머가 0 이하가 되면 다음 단계로 진행
          if (room.flowManager.phaseTimer <= 0) {
            room.flowManager.nextPhase();
          }
        }
      }
    }
  };
  Game.prototype.onDestroy = function () {
    // 게임 종료 시 필요한 정리 작업
  };
  /**
   * 모든 플레이어에게 방 정보를 업데이트합니다.
   */
  Game.prototype.updateRoomInfo = function () {
    // 게임 방 정보 수집
    var rooms = [];
    for (var i = 1; i <= ROOM_COUNT; i++) {
      var room = this.mafiaGameRoomManager.getRoom(i.toString());
      if (room) {
        rooms.push({
          id: room.id,
          title: room.title,
          playerCount: room.getPlayersCount(),
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode.getName(),
          isInProgress: room.flowManager.isGameInProgress()
        });
      }
    }
    // 모든 플레이어에게 업데이트된 방 정보 전송
    App.players.forEach(function (player) {
      var _a, _b;
      if ((_b = (_a = player.tag) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.main) {
        player.tag.widget.main.sendMessage({
          type: "updateRooms",
          rooms: rooms
        });
      }
    });
  };
  return Game;
}(GameBase_1.GameBase);
exports.Game = Game;

/***/ }),

/***/ 500:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameRoomManager = void 0;
var GameRoom_1 = __webpack_require__(727);
/**
 * 게임방 관리자 클래스
 * 여러 게임방을 생성하고 관리합니다.
 */
var GameRoomManager = /** @class */function () {
  function GameRoomManager() {
    this.gameRooms = new Map();
    this.gameModes = new Map();
    this.callbacks = {};
    // 기본 생성자
  }
  /**
   * 모든 게임방 조회
   */
  GameRoomManager.prototype.getAllRooms = function () {
    return Array.from(this.gameRooms.values());
  };
  /**
   * 특정 ID의 게임방 조회
   */
  GameRoomManager.prototype.getRoom = function (roomId) {
    return this.gameRooms.get(roomId);
  };
  /**
   * 게임방 생성
   */
  GameRoomManager.prototype.createRoom = function (config) {
    // 사용 가능한 방 번호 찾기 (1~8)
    var roomId = "1";
    for (var i = 1; i <= 8; i++) {
      var id = i.toString();
      if (!this.gameRooms.has(id)) {
        roomId = id;
        break;
      }
    }
    // 모든 방이 사용 중인 경우
    if (this.gameRooms.size >= 8) {
      throw new Error("모든 게임방이 사용 중입니다.");
    }
    // 게임방 생성
    var room = new GameRoom_1.GameRoom(__assign({
      id: roomId
    }, config));
    // 게임방 등록
    this.gameRooms.set(roomId, room);
    // 이벤트 리스너 설정
    this.setupRoomEventListeners(room);
    // 방 생성 이벤트 발생
    this.emit("roomCreated", room);
    return room;
  };
  /**
   * 게임방 삭제
   */
  GameRoomManager.prototype.removeRoom = function (roomId) {
    var room = this.gameRooms.get(roomId);
    if (!room) {
      return false;
    }
    // 게임방 리셋
    room.reset();
    // 게임방 삭제
    this.gameRooms.delete(roomId);
    // 방 삭제 이벤트 발생
    this.emit("roomRemoved", roomId);
    return true;
  };
  /**
   * 게임방 초기화
   */
  GameRoomManager.prototype.resetRoom = function (roomId) {
    var room = this.gameRooms.get(roomId);
    if (!room) {
      return false;
    }
    // 게임방 리셋
    room.reset();
    // 방 초기화 이벤트 발생
    this.emit("roomReset", room);
    return true;
  };
  /**
   * 게임 모드 등록
   */
  GameRoomManager.prototype.registerGameMode = function (gameMode) {
    this.gameModes.set(gameMode.getId(), gameMode);
  };
  /**
   * 게임 모드 조회
   */
  GameRoomManager.prototype.getGameMode = function (modeId) {
    return this.gameModes.get(modeId);
  };
  /**
   * 모든 게임 모드 조회
   */
  GameRoomManager.prototype.getAllGameModes = function () {
    return Array.from(this.gameModes.values());
  };
  /**
   * 플레이어를 게임방에 입장시킴
   */
  GameRoomManager.prototype.joinRoom = function (roomId, player) {
    var room = this.gameRooms.get(roomId);
    if (!room) {
      return false;
    }
    return room.joinPlayer(player);
  };
  /**
   * 플레이어를 게임방에서 퇴장시킴
   */
  GameRoomManager.prototype.leaveRoom = function (roomId, playerId) {
    var room = this.gameRooms.get(roomId);
    if (!room) {
      return false;
    }
    return room.leavePlayer(playerId);
  };
  /**
   * 방 이벤트 리스너 설정
   */
  GameRoomManager.prototype.setupRoomEventListeners = function (room) {
    var _this = this;
    // 플레이어 입장 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.PLAYER_JOIN, function (player) {
      _this.emit("playerJoinedRoom", room, player);
    });
    // 플레이어 퇴장 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.PLAYER_LEAVE, function (player) {
      _this.emit("playerLeftRoom", room, player);
      // 방에 플레이어가 없으면 방 삭제
      if (room.getPlayersCount() === 0) {
        _this.removeRoom(room.getId());
      }
    });
    // 플레이어 강퇴 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.PLAYER_KICK, function (player) {
      _this.emit("playerKicked", room, player);
    });
    // 호스트 변경 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.HOST_CHANGE, function (newHost) {
      _this.emit("hostChanged", room, newHost);
    });
    // 준비 상태 변경 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.READY_STATUS_CHANGE, function (player, isReady) {
      _this.emit("readyStatusChanged", room, player, isReady);
    });
    // 게임 시작 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.GAME_START, function () {
      _this.emit("gameStarted", room);
    });
    // 게임 종료 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.GAME_END, function () {
      _this.emit("gameEnded", room);
    });
    // 채팅 메시지 이벤트
    room.on(GameRoom_1.WaitingRoomEvent.CHAT_MESSAGE, function (player, message) {
      _this.emit("chatMessage", room, player, message);
    });
  };
  /**
   * 이벤트 발생
   */
  GameRoomManager.prototype.emit = function (event) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    var callbacks = this.callbacks[event];
    if (!callbacks) return;
    callbacks.forEach(function (callback) {
      try {
        callback.apply(void 0, args);
      } catch (error) {
        console.error("Error in event listener for ".concat(event, ":"), error);
      }
    });
  };
  /**
   * 이벤트 리스너 등록
   */
  GameRoomManager.prototype.on = function (event, listener) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(listener);
  };
  /**
   * 이벤트 리스너 제거
   */
  GameRoomManager.prototype.off = function (event, listener) {
    var callbacks = this.callbacks[event];
    if (!callbacks) return;
    var index = callbacks.indexOf(listener);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
  return GameRoomManager;
}();
exports.GameRoomManager = GameRoomManager;

/***/ }),

/***/ 668:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameMode = void 0;
/**
 * 게임 모드 클래스
 * 마피아 게임의 모드를 정의합니다. (클래식, 확장, 커스텀 등)
 */
var GameMode = /** @class */function () {
  function GameMode(config) {
    this.jobs = [];
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
  GameMode.prototype.getId = function () {
    return this.id;
  };
  /**
   * 게임 모드 이름 반환
   */
  GameMode.prototype.getName = function () {
    return this.name;
  };
  /**
   * 게임 모드 설명 반환
   */
  GameMode.prototype.getDescription = function () {
    return this.description;
  };
  /**
   * 최소 인원 반환
   */
  GameMode.prototype.getMinPlayers = function () {
    return this.minPlayers;
  };
  /**
   * 최대 인원 반환
   */
  GameMode.prototype.getMaxPlayers = function () {
    return this.maxPlayers;
  };
  /**
   * 직업 목록 설정
   */
  GameMode.prototype.setJobs = function (jobs) {
    this.jobs = jobs;
  };
  /**
   * 직업 목록 반환
   */
  GameMode.prototype.getJobs = function () {
    return this.jobs;
  };
  /**
   * JSON 변환
   */
  GameMode.prototype.toJSON = function () {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      jobIds: this.jobIds
    };
  };
  return GameMode;
}();
exports.GameMode = GameMode;

/***/ }),

/***/ 669:
/***/ ((__unused_webpack_module, exports) => {



// 마피아 게임의 직업 타입과 데이터를 정의합니다.
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GAME_MODES = exports.JOBS = exports.JobAbilityType = exports.JobTeam = exports.JobId = void 0;
exports.getJobById = getJobById;
exports.getGameModeById = getGameModeById;
exports.getJobsByGameMode = getJobsByGameMode;
// 직업 ID enum
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
})(JobId || (exports.JobId = JobId = {}));
// 직업 소속 팀 타입
var JobTeam;
(function (JobTeam) {
  JobTeam["MAFIA"] = "\uB9C8\uD53C\uC544\uD300";
  JobTeam["CITIZEN"] = "\uC2DC\uBBFC\uD300";
  JobTeam["NEUTRAL"] = "\uC911\uB9BD";
})(JobTeam || (exports.JobTeam = JobTeam = {}));
// 직업 능력 타입
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
  JobAbilityType["SUICIDE"] = "\uC0B0\uD654"; // 자폭
})(JobAbilityType || (exports.JobAbilityType = JobAbilityType = {}));
// 직업 데이터
exports.JOBS = [{
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
// 게임 모드 데이터
exports.GAME_MODES = [{
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
// 직업 ID로 직업 정보 가져오기
function getJobById(jobId) {
  return exports.JOBS.find(function (job) {
    return job.id === jobId;
  });
}
// 게임 모드 ID로 게임 모드 정보 가져오기
function getGameModeById(modeId) {
  return exports.GAME_MODES.find(function (mode) {
    return mode.id === modeId;
  });
}
// 게임 모드에 따른 직업 목록 가져오기
function getJobsByGameMode(modeId) {
  var gameMode = getGameModeById(modeId);
  if (!gameMode) return [];
  return gameMode.jobIds.map(function (jobId) {
    var job = getJobById(jobId);
    return job ? job : null;
  }).filter(function (job) {
    return job !== null;
  });
}

/***/ }),

/***/ 727:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameRoom = exports.WaitingRoomEvent = exports.GameRoomState = void 0;
var GameFlowManager_1 = __webpack_require__(206);
var Common_1 = __webpack_require__(169);
var JobTypes_1 = __webpack_require__(669);
// GameRoomState 열거형
var GameRoomState;
(function (GameRoomState) {
  /** 대기 중 */
  GameRoomState["WAITING"] = "waiting";
  /** 게임 진행 중 */
  GameRoomState["PLAYING"] = "playing";
  /** 게임 종료 */
  GameRoomState["ENDED"] = "ended";
})(GameRoomState || (exports.GameRoomState = GameRoomState = {}));
// WaitingRoomEvent 열거형
var WaitingRoomEvent;
(function (WaitingRoomEvent) {
  /** 플레이어 입장 */
  WaitingRoomEvent["PLAYER_JOIN"] = "playerJoin";
  /** 플레이어 퇴장 */
  WaitingRoomEvent["PLAYER_LEAVE"] = "playerLeave";
  /** 플레이어 강퇴 */
  WaitingRoomEvent["PLAYER_KICK"] = "playerKick";
  /** 호스트 변경 */
  WaitingRoomEvent["HOST_CHANGE"] = "hostChange";
  /** 준비 상태 변경 */
  WaitingRoomEvent["READY_STATUS_CHANGE"] = "readyStatusChange";
  /** 게임 시작 */
  WaitingRoomEvent["GAME_START"] = "gameStart";
  /** 게임 종료 */
  WaitingRoomEvent["GAME_END"] = "gameEnd";
  /** 채팅 메시지 */
  WaitingRoomEvent["CHAT_MESSAGE"] = "chatMessage";
})(WaitingRoomEvent || (exports.WaitingRoomEvent = WaitingRoomEvent = {}));
// Define constants based on your code (placeholder values assumed)
var STATE_INIT = "INIT";
var GAMEROOM_LOCATIONS = {
  1: Map.getLocation("GameRoom_1") ? Map.getLocationList("GameRoom_1")[0] : null,
  2: Map.getLocation("GameRoom_2") ? Map.getLocationList("GameRoom_2")[0] : null,
  3: Map.getLocation("GameRoom_3") ? Map.getLocationList("GameRoom_3")[0] : null,
  4: Map.getLocation("GameRoom_4") ? Map.getLocationList("GameRoom_4")[0] : null,
  5: Map.getLocation("GameRoom_5") ? Map.getLocationList("GameRoom_5")[0] : null,
  6: Map.getLocation("GameRoom_6") ? Map.getLocationList("GameRoom_6")[0] : null,
  7: Map.getLocation("GameRoom_7") ? Map.getLocationList("GameRoom_7")[0] : null,
  8: Map.getLocation("GameRoom_8") ? Map.getLocationList("GameRoom_8")[0] : null
};
var START_WAIT_TIME = 30;
var GameRoom = /** @class */function () {
  function GameRoom(config) {
    this.host = null;
    this.players = [];
    this.readyPlayers = new Set();
    this.state = GameRoomState.WAITING;
    /**
     * 이벤트 처리를 위한 콜백 함수 등록
     */
    this.callbacks = {};
    this.id = config.id;
    this.title = config.title;
    this.gameMode = config.gameMode;
    this.maxPlayers = config.maxPlayers;
    this.password = config.password;
    this.createdAt = Date.now();
    // 기존 코드와 호환되도록 수정
    this.flowManager = new GameFlowManager_1.GameFlowManager(parseInt(this.id));
    this.flowManager.setGameRoom(this);
  }
  /**
   * 게임 플레이어 조회 (GameFlowManager 호환용)
   */
  GameRoom.prototype.getGamePlayer = function (playerId) {
    return (0, Common_1.getPlayerById)(playerId);
  };
  /**
   * 방 플레이어들에게 액션 전송 (GameFlowManager 호환용)
   */
  GameRoom.prototype.actionToRoomPlayers = function (action, data) {
    if (typeof action === 'function') {
      // 콜백 함수로 처리
      this.players.forEach(function (player) {
        action(player);
      });
    } else {
      // 문자열 액션으로 처리
      this.players.forEach(function (player) {
        var gamePlayer = (0, Common_1.getPlayerById)(player.id);
        if (gamePlayer) {
          gamePlayer.tag[action] = data;
          gamePlayer.sendUpdated();
        }
      });
    }
  };
  /**
   * 특정 플레이어 조회 (GameFlowManager 호환용)
   */
  GameRoom.prototype.getPlayer = function (playerId) {
    return this.players.find(function (p) {
      return p.id === playerId;
    });
  };
  GameRoom.prototype.getId = function () {
    return this.id;
  };
  GameRoom.prototype.getTitle = function () {
    return this.title;
  };
  GameRoom.prototype.getGameMode = function () {
    return this.gameMode;
  };
  GameRoom.prototype.getMaxPlayers = function () {
    return this.maxPlayers;
  };
  GameRoom.prototype.getPlayers = function () {
    return this.players;
  };
  GameRoom.prototype.getPlayersCount = function () {
    return this.players.length;
  };
  GameRoom.prototype.isFull = function () {
    return this.players.length >= this.maxPlayers;
  };
  GameRoom.prototype.getState = function () {
    return this.state;
  };
  GameRoom.prototype.getHost = function () {
    return this.host;
  };
  GameRoom.prototype.getCreatedAt = function () {
    return this.createdAt;
  };
  GameRoom.prototype.hasPassword = function () {
    return !!this.password;
  };
  GameRoom.prototype.isPasswordCorrect = function (password) {
    return this.password === password;
  };
  GameRoom.prototype.isPlayerReady = function (playerId) {
    return this.readyPlayers.has(playerId);
  };
  GameRoom.prototype.areAllPlayersReady = function () {
    // 호스트는 준비 상태가 필요 없음
    if (this.players.length < 4) return false;
    // 모든 플레이어가 준비 상태인지 확인
    for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
      var player = _a[_i];
      if (this.host && player.id === this.host.id) continue;
      if (!this.readyPlayers.has(player.id)) return false;
    }
    return true;
  };
  /**
   * 이벤트 리스너 등록
   */
  GameRoom.prototype.on = function (event, listener) {
    var _a;
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    (_a = this.callbacks[event]) === null || _a === void 0 ? void 0 : _a.push(listener);
  };
  /**
   * 이벤트 리스너 제거
   */
  GameRoom.prototype.off = function (event, listener) {
    var callbacks = this.callbacks[event];
    if (!callbacks) return;
    var index = callbacks.indexOf(listener);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
  /**
   * 이벤트 발생
   */
  GameRoom.prototype.emit = function (event) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    var callbacks = this.callbacks[event];
    if (!callbacks) return;
    callbacks.forEach(function (callback) {
      try {
        callback.apply(void 0, args);
      } catch (error) {
        console.error("Error in event listener for ".concat(event, ":"), error);
      }
    });
  };
  /**
   * 유저 입장
   */
  GameRoom.prototype.joinPlayer = function (player) {
    // 이미 방에 있는 플레이어인지 확인
    if (this.players.some(function (p) {
      return p.id === player.id;
    })) {
      return false;
    }
    // 방이 꽉 찼는지 확인
    if (this.isFull()) {
      return false;
    }
    // 게임 중인지 확인
    if (this.state !== GameRoomState.WAITING) {
      return false;
    }
    // 플레이어 추가 (기존 코드와 호환되도록 수정)
    var mafiaPlayer = {
      id: player.id,
      name: player.name,
      jobId: JobTypes_1.JobId.CITIZEN,
      // 기본 직업은 시민
      isAlive: true,
      emoji: "👤" // 기본 이모지
    };
    this.players.push(mafiaPlayer);
    // 플레이어 태그에 마피아 플레이어 정보 저장
    player.tag.mafiaPlayer = mafiaPlayer;
    // 플레이어 위치 설정
    var locationInfo = GAMEROOM_LOCATIONS[parseInt(this.id)];
    if (locationInfo) {
      player.spawnAtLocation("GameRoom_".concat(this.id));
      player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
      player.displayRatio = 1.5;
      player.sendUpdated();
    }
    // 방 정보 저장
    player.tag.roomInfo = {
      roomNum: parseInt(this.id)
    };
    // 첫 플레이어인 경우 호스트로 지정
    if (!this.host) {
      this.host = player;
    }
    // 입장 이벤트 발생
    this.emit(WaitingRoomEvent.PLAYER_JOIN, player);
    return true;
  };
  /**
   * 유저 퇴장
   */
  GameRoom.prototype.leavePlayer = function (playerId) {
    var playerIndex = this.players.findIndex(function (p) {
      return p.id === playerId;
    });
    if (playerIndex === -1) {
      return false;
    }
    var player = (0, Common_1.getPlayerById)(playerId);
    if (!player) {
      return false;
    }
    // 플레이어 목록에서 제거
    this.players.splice(playerIndex, 1);
    // 준비 상태도 삭제
    this.readyPlayers.delete(playerId);
    // 플레이어 태그 정보 초기화
    player.tag.roomInfo = null;
    player.tag.mafiaPlayer = null;
    // 플레이어 위치 이동
    player.spawnAtLocation("Lobby");
    // 위젯 제거
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
    }
    // 호스트가 나간 경우 새로운 호스트 지정
    if (this.host && this.host.id === playerId) {
      this.assignNewHost();
    }
    // 퇴장 이벤트 발생
    this.emit(WaitingRoomEvent.PLAYER_LEAVE, player);
    return true;
  };
  /**
   * 유저 강퇴
   */
  GameRoom.prototype.kickPlayer = function (hostId, targetId) {
    // 호스트인지 확인
    if (!this.host || this.host.id !== hostId) {
      return false;
    }
    // 자기 자신은 강퇴할 수 없음
    if (hostId === targetId) {
      return false;
    }
    var targetPlayer = (0, Common_1.getPlayerById)(targetId);
    if (!targetPlayer) {
      return false;
    }
    // 플레이어 퇴장 처리
    var result = this.leavePlayer(targetId);
    if (!result) {
      return false;
    }
    // 강퇴 이벤트 발생
    this.emit(WaitingRoomEvent.PLAYER_KICK, targetPlayer);
    return true;
  };
  /**
   * 새로운 호스트 지정
   */
  GameRoom.prototype.assignNewHost = function () {
    if (this.players.length === 0) {
      this.host = null;
      return;
    }
    // 첫 번째 플레이어를 호스트로 지정
    var firstPlayerId = this.players[0].id;
    var newHost = (0, Common_1.getPlayerById)(firstPlayerId);
    if (newHost) {
      this.host = newHost;
      // 새 호스트 이벤트 발생
      this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
    }
  };
  /**
   * 호스트 변경
   */
  GameRoom.prototype.changeHost = function (hostId, newHostId) {
    // 현재 호스트인지 확인
    if (!this.host || this.host.id !== hostId) {
      return false;
    }
    var newHost = (0, Common_1.getPlayerById)(newHostId);
    if (!newHost) {
      return false;
    }
    // 플레이어가 방에 있는지 확인
    if (!this.players.some(function (p) {
      return p.id === newHostId;
    })) {
      return false;
    }
    this.host = newHost;
    // 새 호스트 이벤트 발생
    this.emit(WaitingRoomEvent.HOST_CHANGE, newHost);
    return true;
  };
  /**
   * 준비 상태 변경
   */
  GameRoom.prototype.toggleReady = function (playerId) {
    // 호스트는 준비 상태가 필요 없음
    if (this.host && this.host.id === playerId) {
      return false;
    }
    // 존재하는 플레이어인지 확인
    if (!this.players.some(function (p) {
      return p.id === playerId;
    })) {
      return false;
    }
    var player = (0, Common_1.getPlayerById)(playerId);
    if (!player) {
      return false;
    }
    // 현재 준비 상태 확인 후 토글
    var isCurrentlyReady = this.readyPlayers.has(playerId);
    if (isCurrentlyReady) {
      this.readyPlayers.delete(playerId);
    } else {
      this.readyPlayers.add(playerId);
    }
    // 준비 상태 변경 이벤트 발생
    this.emit(WaitingRoomEvent.READY_STATUS_CHANGE, player, !isCurrentlyReady);
    return true;
  };
  /**
   * 게임 시작
   */
  GameRoom.prototype.startGame = function (hostId) {
    // 호스트인지 확인
    if (!this.host || this.host.id !== hostId) {
      return false;
    }
    // 최소 인원 확인 (마피아 게임은 일반적으로 최소 4명)
    if (this.players.length < 4) {
      return false;
    }
    // 모든 플레이어가 준비 상태인지 확인 
    if (!this.areAllPlayersReady()) {
      return false;
    }
    // 게임 상태 변경
    this.state = GameRoomState.PLAYING;
    // 게임 시작 처리
    try {
      this.flowManager.startGame();
    } catch (error) {
      console.error("Error starting game:", error);
      this.state = GameRoomState.WAITING;
      return false;
    }
    // 게임 시작 이벤트 발생
    this.emit(WaitingRoomEvent.GAME_START);
    return true;
  };
  /**
   * 게임 종료
   */
  GameRoom.prototype.endGame = function () {
    this.state = GameRoomState.WAITING;
    this.readyPlayers.clear();
    // 게임 종료 이벤트 발생
    this.emit(WaitingRoomEvent.GAME_END);
  };
  /**
   * 방 초기화
   */
  GameRoom.prototype.reset = function () {
    // 모든 플레이어의 위젯 제거
    this.players.forEach(function (player) {
      var gamePlayer = (0, Common_1.getPlayerById)(player.id);
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
    // 플레이어 목록 초기화
    this.players = [];
    this.readyPlayers.clear();
    this.host = null;
    this.state = GameRoomState.WAITING;
    // 게임 플로우 매니저 초기화
    this.flowManager = new GameFlowManager_1.GameFlowManager(parseInt(this.id));
    this.flowManager.setGameRoom(this);
  };
  /**
   * 방 정보 JSON 변환
   */
  GameRoom.prototype.toJSON = function () {
    var _this = this;
    return {
      id: this.id,
      title: this.title,
      gameMode: this.gameMode.getName(),
      maxPlayers: this.maxPlayers,
      hasPassword: this.hasPassword(),
      playersCount: this.getPlayersCount(),
      host: this.host ? {
        id: this.host.id,
        name: this.host.name
      } : null,
      state: this.state,
      players: this.players.map(function (player) {
        return {
          id: player.id,
          name: player.name,
          isReady: _this.isPlayerReady(player.id),
          isHost: _this.host ? player.id === _this.host.id : false
        };
      }),
      createdAt: new Date(this.createdAt).toISOString()
    };
  };
  return GameRoom;
}();
exports.GameRoom = GameRoom;

/***/ }),

/***/ 764:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createDefaultGameModes = createDefaultGameModes;
var GameMode_1 = __webpack_require__(668);
var JobTypes_1 = __webpack_require__(669);
/**
 * 기존 게임 모드 정보를 사용하여 GameMode 클래스 생성
 */
function createDefaultGameModes() {
  var modes = [];
  // 기존 JobTypes의 게임 모드 설정을 활용
  JobTypes_1.GAME_MODES.forEach(function (modeData) {
    var modeConfig = {
      id: modeData.id,
      name: modeData.name,
      description: modeData.description,
      jobIds: modeData.jobIds,
      minPlayers: modeData.minPlayers,
      maxPlayers: modeData.maxPlayers
    };
    var gameMode = new GameMode_1.GameMode(modeConfig);
    // 직업 정보 설정
    var jobs = (0, JobTypes_1.getJobsByGameMode)(modeData.id);
    if (jobs.length > 0) {
      gameMode.setJobs(jobs);
    }
    modes.push(gameMode);
  });
  return modes;
}

/***/ }),

/***/ 771:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameBase = void 0;
var GameBase = /** @class */function () {
  function GameBase() {
    this.onStartCallbacks = [];
    this.onDestroyCallbacks = [];
    this.onJoinPlayerCallbacks = [];
    this.onLeavePlayerCallbacks = [];
    this.onUpdateCallbacks = [];
    this.onTriggerObjectCallbacks = [];
    this.initEventListeners();
  }
  GameBase.prototype.initEventListeners = function () {
    var _this = this;
    App.onStart.Add(function () {
      _this.onStartCallbacks.forEach(function (callback) {
        try {
          callback();
        } catch (error) {
          //*
        }
      });
    });
    App.onJoinPlayer.Add(function (player) {
      _this.onJoinPlayerCallbacks.forEach(function (callback) {
        try {
          callback(player);
        } catch (error) {
          //*
        }
      });
    });
    App.onLeavePlayer.Add(function (player) {
      _this.onLeavePlayerCallbacks.forEach(function (callback) {
        try {
          callback(player);
        } catch (error) {
          //*
        }
      });
    });
    App.onUpdate.Add(function (dt) {
      _this.onUpdateCallbacks.forEach(function (callback) {
        try {
          callback(dt);
        } catch (error) {
          //*
        }
      });
    });
    App.onDestroy.Add(function () {
      _this.onDestroyCallbacks.forEach(function (callback) {
        try {
          callback();
        } catch (error) {
          //*
        }
      });
    });
    App.onTriggerObject.Add(function (sender, layerId, x, y, key) {
      _this.onTriggerObjectCallbacks.forEach(function (callback) {
        try {
          callback(sender, layerId, x, y, key);
        } catch (error) {
          //*
        }
      });
    });
  };
  GameBase.prototype.addOnStartCallback = function (callback) {
    this.onStartCallbacks.push(callback);
  };
  GameBase.prototype.addOnDestroyCallback = function (callback) {
    this.onDestroyCallbacks.push(callback);
  };
  GameBase.prototype.addOnJoinPlayerCallback = function (callback) {
    this.onJoinPlayerCallbacks.push(callback);
  };
  GameBase.prototype.addOnLeavePlayerCallback = function (callback) {
    this.onLeavePlayerCallbacks.push(callback);
  };
  GameBase.prototype.addOnUpdateCallback = function (callback) {
    this.onUpdateCallbacks.push(callback);
  };
  GameBase.prototype.addOnTriggerObjectCallback = function (callback) {
    this.onTriggerObjectCallbacks.push(callback);
  };
  return GameBase;
}();
exports.GameBase = GameBase;

/***/ }),

/***/ 773:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Localizer = void 0;
var LOCALIZE_KEYS = {};
var LOCALIZE_CONTAINER = {
  ko: null,
  ja: null,
  en: null
};
var Localizer = /** @class */function () {
  function Localizer() {}
  Localizer.getLanguageCode = function (player) {
    return player.language === "ko" || player.language === "ja" ? player.language : "en";
  };
  Localizer.prepareLocalizationContainer = function (player) {
    var language = this.getLanguageCode(player);
    if (LOCALIZE_CONTAINER[language] === null) {
      LOCALIZE_CONTAINER[language] = Object.keys(LOCALIZE_KEYS).reduce(this.localizeKey.bind(null, player), {});
    }
  };
  Localizer.getLocalizeString = function (player, key) {
    var _a;
    var language = this.getLanguageCode(player);
    return (_a = LOCALIZE_CONTAINER[language][key]) !== null && _a !== void 0 ? _a : "";
  };
  Localizer.getLocalizeContainer = function (player) {
    var language = this.getLanguageCode(player);
    return LOCALIZE_CONTAINER[language];
  };
  Localizer.localizeKey = function (player, acc, key) {
    acc[key] = player.localize(key);
    return acc;
  };
  return Localizer;
}();
exports.Localizer = Localizer;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
var Game_1 = __webpack_require__(401);
App.onInit.Add(function () {
  App.cameraEffect = 1; // 1 = 비네팅 효과
  App.cameraEffectParam1 = 2000;
  App.sendUpdated();
  Game_1.Game.create();
});
})();

/******/ })()
;