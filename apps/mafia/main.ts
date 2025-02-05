import { Game } from "../../libs/core/mafia/Game";

ScriptApp.onInit.Add(() => {
	ScriptApp.cameraEffect = 1; // 1 = 비네팅 효과
	ScriptApp.cameraEffectParam1 = 2000;
	ScriptApp.sendUpdated();
	Game.create();
});
