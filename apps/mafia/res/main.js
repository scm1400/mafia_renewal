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
var Localizer_1 = __webpack_require__(778);
var GameBase_1 = __webpack_require__(96);
var Game = /** @class */function (_super) {
  __extends(Game, _super);
  function Game() {
    var _this = _super.call(this) || this;
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
    // 로컬라이징
    Localizer_1.Localizer.prepareLocalizationContainer(player);
    //@ts-ignore
    var customData = parseJsonString(player.customData);
  };
  Game.prototype.onLeavePlayer = function (player) {};
  Game.prototype.update = function (dt) {};
  Game.prototype.onDestroy = function () {};
  return Game;
}(GameBase_1.GameBase);
exports.Game = Game;

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
  Game_1.Game.create();
});
})();

/******/ })()
;