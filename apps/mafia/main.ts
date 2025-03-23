import { Game } from "../../libs/core/mafia/Game";

ScriptApp.onInit.Add(() => {
	Game.create();
});
