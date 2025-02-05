/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 96:
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

/***/ 230:
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
var Common_1 = __webpack_require__(224);
var CustomLabelFunctions_1 = __webpack_require__(953);
var Localizer_1 = __webpack_require__(778);
var GameBase_1 = __webpack_require__(96);
var GameFlowManager_1 = __webpack_require__(871);
var GameRoomManager_1 = __webpack_require__(193);
var ROOM_COUNT = 1;
var Game = /** @class */function (_super) {
  __extends(Game, _super);
  function Game() {
    var _this = _super.call(this) || this;
    _this.mafiaGameRoomManager = new GameRoomManager_1.GameRoomManager(ROOM_COUNT);
    _this.addOnStartCallback(_this.onStart.bind(_this));
    _this.addOnJoinPlayerCallback(_this.onJoinPlayer.bind(_this));
    _this.addOnLeavePlayerCallback(_this.onLeavePlayer.bind(_this));
    _this.addOnUpdateCallback(_this.update.bind(_this));
    _this.addOnDestroyCallback(_this.onDestroy.bind(_this));
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
    var _this = this;
    player.tag = {
      widget: {}
    };
    // 로컬라이징
    Localizer_1.Localizer.prepareLocalizationContainer(player);
    //@ts-ignore
    var customData = (0, Common_1.parseJsonString)(player.customData);
    player.tag.widget.main = player.showWidget("widgets/fullscreen_widget.html", "middel", 0, 0);
    player.tag.widget.main.sendMessage({
      type: "init",
      message: "코드 마피아"
    });
    var playerId = player.id;
    App.runLater(function () {
      player.showConfirm("게임에 참가하시겠습니까?", function (res) {
        if (res) {
          _this.mafiaGameRoomManager.getRoom(1).addPlayer(playerId);
        }
      }, {
        content: "게임에 참가하시려면 '확인'을 눌러주세요."
      });
    }, 3);
  };
  Game.prototype.onLeavePlayer = function (player) {};
  Game.prototype.update = function (dt) {
    var rooms = this.mafiaGameRoomManager.getAllRooms();
    var _loop_1 = function (room) {
      if (room.flowManager.state === GameFlowManager_1.GameState.IN_PROGRESS) {
        if (room.flowManager.phaseTimer > 0) {
          room.flowManager.phaseTimer -= dt;
          room.actionToRoomPlayers(function (player) {
            var gamePlayer = App.getPlayerByID(player.id);
            if (!gamePlayer) return;
            (0, CustomLabelFunctions_1.showLabel)(gamePlayer, "main", {
              labelWidth: "S",
              texts: [{
                text: "\u23F1\uFE0F \uB0A8\uC740 \uC2DC\uAC04: ".concat(Math.floor(room.flowManager.phaseTimer), "\uCD08"),
                style: {
                  fontSize: "18px",
                  mobileFontSize: "14px",
                  fontWeight: 700,
                  color: "white"
                }
              }],
              topGapPC: -2,
              topGapMobile: 10,
              labelDisplayTime: 3000,
              backgroundColor: 0x27262e
            });
          });
          if (room.flowManager.phaseTimer < 0) {
            room.flowManager.nextPhase();
          }
        }
      } else {
        if (room.players.length >= 4 && room.flowManager.state == GameFlowManager_1.GameState.WAITING) {
          room.flowManager.startGame();
        }
      }
    };
    for (var _i = 0, _a = Object.entries(rooms); _i < _a.length; _i++) {
      var _b = _a[_i],
        room = _b[1];
      _loop_1(room);
    }
  };
  Game.prototype.onDestroy = function () {};
  return Game;
}(GameBase_1.GameBase);
exports.Game = Game;

/***/ }),

/***/ 871:
/***/ (function(__unused_webpack_module, exports) {



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
exports.GameFlowManager = exports.phaseDurations = exports.MafiaPhase = exports.MafiaGameRole = exports.GameState = void 0;
// GameState Enum: 게임의 주요 상태를 정의
var GameState;
(function (GameState) {
  GameState["WAITING"] = "WAITING";
  GameState["IN_PROGRESS"] = "IN_PROGRESS";
  GameState["ENDED"] = "ENDED";
})(GameState || (exports.GameState = GameState = {}));
// 마피아 게임의 역할을 정의합니다.
var MafiaGameRole;
(function (MafiaGameRole) {
  MafiaGameRole["MAFIA"] = "MAFIA";
  MafiaGameRole["POLICE"] = "POLICE";
  MafiaGameRole["DOCTOR"] = "DOCTOR";
  MafiaGameRole["CITIZEN"] = "CITIZEN";
})(MafiaGameRole || (exports.MafiaGameRole = MafiaGameRole = {}));
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
  function GameFlowManager(room) {
    this.room = room;
    this.state = GameState.WAITING;
    this.dayCount = 0;
    // 밤에 수행되는 액션들을 저장하는 변수들
    this.mafiaTarget = null;
    this.doctorTarget = null;
    this.policeTarget = null;
  }
  /**
   * 게임 시작
   * - 최소 4명의 플레이어가 있어야 합니다.
   * - 플레이어 역할을 무작위로 배정합니다.
   *   (첫 번째: 마피아, 두 번째: 경찰, 세 번째: 의사, 나머지: 시민)
   * - 플레이어 수에 따라 초기 단계가 결정됩니다.
   *   → 4명: 낮부터 시작
   *   → 4명보다 많은 경우: 밤부터 시작
   */
  GameFlowManager.prototype.startGame = function () {
    if (this.room.players.length < 4) {
      App.showCenterLabel("게임 시작을 위해 최소 4명의 플레이어가 필요합니다");
      return;
    }
    // 플레이어 역할 무작위 배정
    var playersShuffled = __spreadArray([], this.room.players, true);
    playersShuffled.sort(function () {
      return Math.random() - 0.5;
    });
    if (playersShuffled.length > 0) playersShuffled[0].role = MafiaGameRole.MAFIA;
    if (playersShuffled.length > 1) playersShuffled[1].role = MafiaGameRole.POLICE;
    if (playersShuffled.length > 2) playersShuffled[2].role = MafiaGameRole.DOCTOR;
    for (var i = 3; i < playersShuffled.length; i++) {
      playersShuffled[i].role = MafiaGameRole.CITIZEN;
    }
    // 역할 배정된 객체는 참조를 공유하므로 room.players에 반영됩니다.
    // 플레이어 수에 따른 게임 단계 순서 설정
    if (this.room.players.length === 4) {
      // 4명인 경우: 낮 → 투표 → 최후 변론 → 찬반 투표 → 낮 …
      // this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
      this.phaseCycle = [MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.NIGHT];
    } else {
      // 4명보다 많은 경우: 밤 → 낮 → 투표 → 최후 변론 → 찬반 투표 → 밤 …
      // this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING, MafiaPhase.FINAL_DEFENSE, MafiaPhase.APPROVAL_VOTING];
      this.phaseCycle = [MafiaPhase.NIGHT, MafiaPhase.DAY, MafiaPhase.VOTING];
    }
    // 초기 단계 설정
    this.setPhase(this.phaseCycle[0]);
    this.state = GameState.IN_PROGRESS;
    App.sayToAll("Room ".concat(this.room.id, ": \uAC8C\uC784 \uC2DC\uC791! \uCD08\uAE30 \uB2E8\uACC4\uB294 ").concat(this.currentPhase, " \uC785\uB2C8\uB2E4."));
    // 초기 단계에 따른 액션 실행 (필요에 따라 확장)
    this.executePhaseActions();
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
    // 사이클이 처음으로 돌아오면 (예, 4명인 경우 DAY 단계) dayCount 증가
    if (nextIndex === 0) {
      this.dayCount++;
    }
    this.setPhase(this.phaseCycle[nextIndex]);
    App.sayToAll("Room ".concat(this.room.id, ": \uB2E8\uACC4 \uC804\uD658 -> ").concat(this.currentPhase, " (Day ").concat(this.dayCount, ")"));
    // 단계별 액션 실행
    this.executePhaseActions();
  };
  /**
   * 각 단계에 따른 행동을 추상화하여 처리합니다.
   * 실제 게임 로직에 맞게 해당 메서드를 확장할 수 있습니다.
   */
  GameFlowManager.prototype.executePhaseActions = function () {
    var _this = this;
    switch (this.currentPhase) {
      case MafiaPhase.NIGHT:
        {
          App.sayToAll("Room ".concat(this.room.id, ": \uBC24 \uB2E8\uACC4 - \uB9C8\uD53C\uC544\uAC00 \uD76C\uC0DD\uC790\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4."));
          this.room.actionToRoomPlayers(function (player) {
            var gamePlayer = App.getPlayerByID(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            var message = "🌙밤이 되었습니다";
            if (_this.dayCount == 0) {
              message += "\n \uB2F9\uC2E0\uC740 [ ".concat(player.role, " ] \uC785\uB2C8\uB2E4");
            }
            if (gamePlayer.tag.widget.main) {
              gamePlayer.tag.widget.main.sendMessage({
                type: "init",
                message: message
              });
            }
            if (!gamePlayer.tag.widget.action) {
              gamePlayer.tag.widget.action = gamePlayer.showWidget("widgets/action.html", "middle", 0, 0);
            }
            if (player.isAlive) {
              gamePlayer.tag.widget.action.sendMessage({
                type: "init",
                gameData: {
                  role: player.role,
                  currentPhase: _this.currentPhase,
                  players: _this.room.players
                }
              });
            }
          });
          // 예: this.mafiaAction();
        }
        break;
      case MafiaPhase.DAY:
        {
          this.evaluateNightActions();
          App.sayToAll("Room ".concat(this.room.id, ": \uB0AE \uB2E8\uACC4 - \uD50C\uB808\uC774\uC5B4\uB4E4\uC774 \uD1A0\uB860\uC744 \uC9C4\uD589\uD569\uB2C8\uB2E4."));
          this.room.actionToRoomPlayers(function (player) {
            var message = "🔅낮이 되었습니다";
            var gamePlayer = App.getPlayerByID(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (_this.dayCount == 0) {
              message += "\n \uB2F9\uC2E0\uC740 [ ".concat(player.role, " ] \uC785\uB2C8\uB2E4");
            }
            if (gamePlayer.tag.widget.main) {
              gamePlayer.tag.widget.main.sendMessage({
                type: "init",
                message: message
              });
            }
            if (gamePlayer.tag.widget.action) {
              gamePlayer.tag.widget.action.sendMessage({
                type: "hide"
              });
            }
          });
        }
        break;
      case MafiaPhase.VOTING:
        {
          var message_1 = "⚖️ 투표 시간 입니다";
          App.sayToAll("Room ".concat(this.room.id, ": \uB0AE \uB2E8\uACC4 - \uD50C\uB808\uC774\uC5B4\uB4E4\uC774 \uD1A0\uB860\uC744 \uC9C4\uD589\uD569\uB2C8\uB2E4."));
          this.room.actionToRoomPlayers(function (player) {
            var gamePlayer = App.getPlayerByID(player.id);
            if (!gamePlayer) {
              player.isAlive = false;
              return;
            }
            if (gamePlayer.tag.widget.main) {
              gamePlayer.tag.widget.main.sendMessage({
                type: "init",
                message: message_1
              });
            }
          });
        }
        break;
      case MafiaPhase.FINAL_DEFENSE:
        App.sayToAll("Room ".concat(this.room.id, ": \uCD5C\uD6C4 \uBCC0\uB860 \uB2E8\uACC4 - \uD53C\uC758\uC790\uAC00 \uCD5C\uD6C4 \uBCC0\uB860\uC744 \uD569\uB2C8\uB2E4."));
        break;
      case MafiaPhase.APPROVAL_VOTING:
        App.sayToAll("Room ".concat(this.room.id, ": \uCC2C\uBC18 \uD22C\uD45C \uB2E8\uACC4 - \uCD5C\uC885 \uD45C\uACB0\uC744 \uC9C4\uD589\uD569\uB2C8\uB2E4."));
        break;
      default:
        App.sayToAll("Room ".concat(this.room.id, ": \uC54C \uC218 \uC5C6\uB294 \uB2E8\uACC4\uC785\uB2C8\uB2E4."));
    }
    if (this.dayCount == 0) this.dayCount = 1;
  };
  /**
   * 투표 종료 후 처리 예시
   * @param votes 각 플레이어의 투표 수를 { playerId: voteCount } 형태로 전달
   */
  GameFlowManager.prototype.endVoting = function (votes) {
    if (this.currentPhase !== MafiaPhase.VOTING && this.currentPhase !== MafiaPhase.APPROVAL_VOTING) {
      App.sayToAll("현재 투표 단계가 아닙니다.");
      return;
    }
    // 가장 많은 표를 받은 플레이어 탈락 처리
    var eliminatedPlayerId = Object.keys(votes).reduce(function (a, b) {
      return votes[a] > votes[b] ? a : b;
    });
    App.sayToAll("Room ".concat(this.room.id, ": \uD50C\uB808\uC774\uC5B4 ").concat(eliminatedPlayerId, " \uD0C8\uB77D."));
    // 해당 플레이어의 isAlive를 false로 업데이트합니다.
    this.room.players = this.room.players.map(function (player) {
      return player.id === eliminatedPlayerId ? __assign(__assign({}, player), {
        isAlive: false
      }) : player;
    });
    // 승리 조건 체크
    this.checkWinCondition();
    // 탈락 후 다음 단계로 전환
    this.nextPhase();
  };
  /**
   * 승리 조건 체크
   * - 살아있는 플레이어 중 마피아가 0명이면 시민 승리
   * - 마피아 수가 시민(및 기타) 수 이상이면 마피아 승리
   */
  GameFlowManager.prototype.checkWinCondition = function () {
    var alivePlayers = this.room.players.filter(function (p) {
      return p.isAlive;
    });
    var mafiaAlive = alivePlayers.filter(function (p) {
      return p.role === MafiaGameRole.MAFIA;
    }).length;
    var othersAlive = alivePlayers.length - mafiaAlive;
    if (mafiaAlive === 0) {
      App.sayToAll("Room ".concat(this.room.id, ": \uC2DC\uBBFC \uD300 \uC2B9\uB9AC!"));
      this.state = GameState.ENDED;
    } else if (mafiaAlive >= othersAlive) {
      App.sayToAll("Room ".concat(this.room.id, ": \uB9C8\uD53C\uC544 \uD300 \uC2B9\uB9AC!"));
      this.state = GameState.ENDED;
    }
  };
  /**
   * 밤 단계에서 마피아가 희생 대상을 선택합니다.
   * @param targetPlayerId 선택한 대상 플레이어의 ID
   */
  GameFlowManager.prototype.mafiaAction = function (targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      App.sayToAll("마피아 액션은 밤 단계에서만 수행할 수 있습니다.");
      return;
    }
    // (선택 대상이 존재하고 살아있는지 등의 추가 검증 로직을 필요 시 추가)
    this.mafiaTarget = targetPlayerId;
    App.sayToAll("Room ".concat(this.room.id, ": \uB9C8\uD53C\uC544\uAC00 ").concat(targetPlayerId, "\uB97C \uD76C\uC0DD \uB300\uC0C1\uC73C\uB85C \uC120\uD0DD\uD588\uC2B5\uB2C8\uB2E4."));
  };
  /**
   * 밤 단계에서 의사가 보호할 대상을 선택합니다.
   * @param targetPlayerId 선택한 보호 대상 플레이어의 ID
   */
  GameFlowManager.prototype.doctorAction = function (targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      App.sayToAll("의사 액션은 밤 단계에서만 수행할 수 있습니다.");
      return;
    }
    this.doctorTarget = targetPlayerId;
    App.sayToAll("Room ".concat(this.room.id, ": \uC758\uC0AC\uAC00 ").concat(targetPlayerId, "\uB97C \uBCF4\uD638 \uB300\uC0C1\uC73C\uB85C \uC120\uD0DD\uD588\uC2B5\uB2C8\uB2E4."));
  };
  /**
   * 밤 단계에서 경찰이 조사할 대상을 선택합니다.
   * 선택한 플레이어의 역할을 확인하여 결과를 출력합니다.
   * @param targetPlayerId 조사할 플레이어의 ID
   */
  GameFlowManager.prototype.policeAction = function (targetPlayerId) {
    if (this.currentPhase !== MafiaPhase.NIGHT) {
      App.sayToAll("경찰 액션은 밤 단계에서만 수행할 수 있습니다.");
      return;
    }
    this.policeTarget = targetPlayerId;
    var targetPlayer = this.room.players.find(function (p) {
      return p.id === targetPlayerId;
    });
    if (!targetPlayer) {
      console.error("Room ".concat(this.room.id, ": \uACBD\uCC30 \uC561\uC158 \uC2E4\uD328 - \uD50C\uB808\uC774\uC5B4 ").concat(targetPlayerId, "\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
      return;
    }
    App.sayToAll("Room ".concat(this.room.id, ": \uACBD\uCC30\uC774 ").concat(targetPlayerId, "\uB97C \uC870\uC0AC\uD55C \uACB0\uACFC, \uC5ED\uD560\uC740 ").concat(targetPlayer.role, " \uC785\uB2C8\uB2E4."));
    // 필요에 따라 경찰에게 조사 결과를 반환하거나 별도 로직을 추가할 수 있습니다.
  };
  /**
   * 밤 단계 액션 평가
   * - 마피아가 선택한 대상이 의사의 보호 대상과 동일하면 보호 성공.
   * - 그렇지 않으면 해당 플레이어를 사망 처리합니다.
   * 밤 액션 평가 후, 내부 액션 변수들을 초기화합니다.
   */
  GameFlowManager.prototype.evaluateNightActions = function () {
    var _this = this;
    if (this.mafiaTarget) {
      if (this.mafiaTarget === this.doctorTarget) {
        App.sayToAll("Room ".concat(this.room.id, ": \uC758\uC0AC\uC758 \uBCF4\uD638\uB85C ").concat(this.mafiaTarget, "\uB294 \uC0B4\uD574\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."));
      } else {
        App.sayToAll("Room ".concat(this.room.id, ": ").concat(this.mafiaTarget, "\uAC00 \uB9C8\uD53C\uC544\uC758 \uACF5\uACA9\uC73C\uB85C \uC0AC\uB9DD\uD588\uC2B5\uB2C8\uB2E4."));
        // 해당 플레이어를 사망 처리 (예: isAlive 상태 변경)
        var targetPlayer = this.room.players.find(function (p) {
          return p.id === _this.mafiaTarget;
        });
        if (targetPlayer) {
          targetPlayer.isAlive = false;
        }
      }
    }
    // 다음 밤을 위해 액션 변수 초기화
    this.mafiaTarget = null;
    this.doctorTarget = null;
    this.policeTarget = null;
  };
  // 게임 리셋: 게임 상태와 단계 등을 초기화합니다.
  GameFlowManager.prototype.resetGame = function () {
    this.state = GameState.WAITING;
    if (this.phaseCycle) {
      this.setPhase(this.phaseCycle[0]);
    } else {
      this.setPhase(MafiaPhase.DAY);
    }
    this.dayCount = 1;
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
  return GameFlowManager;
}();
exports.GameFlowManager = GameFlowManager;

/***/ }),

/***/ 352:
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
exports.GameRoom = void 0;
var GameFlowManager_1 = __webpack_require__(871);
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
  function GameRoom(id) {
    this.players = [];
    this.id = id;
    this.flowManager = new GameFlowManager_1.GameFlowManager(this); // 생성 시 GameFlowManager 초기화
  }
  // 플레이어 추가 (게임 시작 전에는 기본 역할은 CITIZEN)
  GameRoom.prototype.addPlayer = function (playerId) {
    var player = App.getPlayerByID(playerId);
    if (!player) return;
    this.players.push({
      id: playerId,
      name: player.name,
      role: GameFlowManager_1.MafiaGameRole.CITIZEN,
      isAlive: true
    });
    var locationInfo = GAMEROOM_LOCATIONS[this.id];
    player.spawnAtLocation("GameRoom_".concat(this.id));
    player.setCameraTarget(Math.floor(locationInfo.x + locationInfo.width / 2), Math.floor(locationInfo.y + locationInfo.height / 2), 0);
    player.displayRatio = 1.5;
    player.sendUpdated();
    player.tag.roomInfo = {
      roomNum: this.id
    };
  };
  // 플레이어 제거
  GameRoom.prototype.removePlayer = function (playerId) {
    var player = App.getPlayerByID(playerId);
    if (!player) return;
    this.players = this.players.filter(function (player) {
      return player.id !== playerId;
    });
    player.tag.roomInfo = null;
    player.spawnAtLocation("Lobby");
  };
  GameRoom.prototype.reset = function () {
    this.players = [];
    this.flowManager.resetGame(); // GameFlowManager 상태도 초기화
  };
  GameRoom.prototype.actionToRoomPlayers = function (action) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    this.players.forEach(function (player) {
      try {
        action.apply(void 0, __spreadArray([player], args, false));
      } catch (error) {}
    });
  };
  return GameRoom;
}();
exports.GameRoom = GameRoom;

/***/ }),

/***/ 193:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.GameRoomManager = void 0;
var GameRoom_1 = __webpack_require__(352);
var GameRoomManager = /** @class */function () {
  function GameRoomManager(roomCount) {
    this.gameRooms = {};
    for (var i = 1; i <= roomCount; i++) {
      this.gameRooms[i] = new GameRoom_1.GameRoom(i);
    }
  }
  GameRoomManager.prototype.getAllRooms = function () {
    return this.gameRooms;
  };
  // Get a specific game room by ID
  GameRoomManager.prototype.getRoom = function (roomId) {
    return this.gameRooms[roomId];
  };
  // Reset a specific game room
  GameRoomManager.prototype.resetRoom = function (roomId) {
    var room = this.gameRooms[roomId];
    if (room) {
      room.reset();
    }
  };
  return GameRoomManager;
}();
exports.GameRoomManager = GameRoomManager;

/***/ }),

/***/ 224:
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
var Localizer_1 = __webpack_require__(778);
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

/***/ 953:
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
exports.clearCustomLabel = clearCustomLabel;
exports.showLabel = showLabel;
var Common_1 = __webpack_require__(224);
function clearCustomLabel(player) {
  if (player === void 0) {
    player = null;
  }
  if (player) {
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "main"
    });
    player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
      key: "sub"
    });
  } else {
    (0, Common_1.actionToAllPlayers)(function (player) {
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "main"
      });
      player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
        key: "sub"
      });
    });
  }
}
function showLabel(player, key, options) {
  if (options === void 0) {
    options = {};
  }
  var mobileLabelPercentWidth = {
    XL: 90,
    L: 80,
    M: 70,
    S: 60
  };
  var tabletLabelPercentWidth = {
    XL: 84,
    L: 68,
    M: 54,
    S: 48
  };
  var pcLabelPercentWidth = {
    XL: 50,
    L: 40,
    M: 28,
    S: 20
  };
  var _a = options.labelWidth,
    labelWidth = _a === void 0 ? "M" : _a,
    _b = options.topGapMobile,
    topGapMobile = _b === void 0 ? 10 : _b,
    _c = options.topGapPC,
    topGapPC = _c === void 0 ? -2 : _c,
    _d = options.backgroundColor,
    backgroundColor = _d === void 0 ? 0x27262e : _d,
    _e = options.borderRadius,
    borderRadius = _e === void 0 ? "12px" : _e,
    _f = options.padding,
    padding = _f === void 0 ? "8px" : _f,
    _g = options.fontOpacity,
    fontOpacity = _g === void 0 ? false : _g,
    _h = options.labelDisplayTime,
    labelDisplayTime = _h === void 0 ? 3000 : _h,
    _j = options.texts,
    texts = _j === void 0 ? [] : _j;
  var isMobile = player.isMobile && !player.isTablet;
  var isTablet = player.isMobile && player.isTablet;
  var topGap = isMobile ? topGapMobile : topGapPC;
  // Label Percent Width 설정
  var labelPercentWidth;
  if (isMobile) {
    labelPercentWidth = mobileLabelPercentWidth[labelWidth];
  } else if (isTablet) {
    labelPercentWidth = tabletLabelPercentWidth[labelWidth];
  } else {
    labelPercentWidth = pcLabelPercentWidth[labelWidth];
  }
  // Styles 설정
  var parentStyle = "\n    display: flex; \n    flex-direction: column; \n    align-items: center; \n    text-align: center;";
  // 텍스트 요소의 기본 스타일
  var defaultTextStyle = {
    fontSize: "18px",
    mobileFontSize: "14px",
    fontWeight: 400,
    color: "white"
  };
  var htmlStr = "<span style=\"".concat(parentStyle, "\">");
  // 각 텍스트에 대해 HTML 생성
  texts.forEach(function (_a) {
    var text = _a.text,
      _b = _a.style,
      style = _b === void 0 ? {} : _b;
    if (!text) return;
    var _c = __assign(__assign({}, defaultTextStyle), style),
      fontSize = _c.fontSize,
      mobileFontSize = _c.mobileFontSize,
      fontWeight = _c.fontWeight,
      color = _c.color;
    var appliedFontSize = player.isMobile && !player.isTablet ? mobileFontSize || fontSize : fontSize;
    var textStyle = "\n        font-size: ".concat(appliedFontSize, ";\n        font-weight: ").concat(fontWeight, ";\n        color: ").concat(color, ";");
    htmlStr += "<span style=\"".concat(textStyle, "\">").concat(text, "</span>");
  });
  htmlStr += "</span>";
  var customLabelOption = {
    key: key,
    borderRadius: borderRadius,
    fontOpacity: fontOpacity,
    padding: padding
  };
  // Custom label 출력
  player.showCustomLabel(htmlStr, 0xffffff, backgroundColor, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
}

/***/ }),

/***/ 778:
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
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
var Game_1 = __webpack_require__(230);
App.onInit.Add(function () {
  App.cameraEffect = 1; // 1 = 비네팅 효과
  App.cameraEffectParam1 = 2000;
  App.sendUpdated();
  Game_1.Game.create();
});
})();

/******/ })()
;