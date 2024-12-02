import { Localizer } from "./Localizer";

export let log: (message: string) => void;

export function isDevServer() {
    //@ts-ignore
    return ScriptApp.getServerEnv() !== "live";
}

export function parseJsonString(str: string): any | false {
    if (!str) return false;
    try {
        // JSON으로 파싱을 시도하고 결과를 반환합니다.
        return JSON.parse(str);
    } catch (e) {
        // 파싱 중 오류가 발생하면 false를 반환합니다.
        return false;
    }
}

export function isEmpty(obj: object): boolean {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

export function sendConsoleMessage(player, message) {
    const playerId = getPlayerId(player);
    setTimeout(() => {
        if (!getPlayerById(playerId)) return;

    }, 500);
}

export function getPlayerId(player) {
    return player.isGuest ? (player.tag.guestId ?? player.id) : player.id
    // return player.id;
}

export function getPlayerById(playerId) {
    return ScriptApp.players.find((player) => getPlayerId(player) === playerId);
    // return ScriptApp.getPlayerByID(playerId);
}

export function actionToAllPlayers(action, ...args) {
    for (const player of ScriptApp.players) {
        if (!player) continue;
        try {
            action(player, ...args)
        } catch (error) {

        }
    }
}

export function getCurrentTimeString() {
    const date = new Date();
    const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    const kstGap = 9 * 60 * 60 * 1000;
    const today = new Date(utc + kstGap);
    return today.toISOString();
}

export function msToTime(player, duration) {
    const milliseconds = parseInt(((duration % 1000) / 100).toString(), 10),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60);
    const minutesStr = (minutes < 10) ? "0" + minutes : minutes.toString();
    const secondsStr = (seconds < 10) ? "0" + seconds : seconds.toString();

    return Localizer.getLocalizeString(player, "game_quiz_builder_dashboard_info_solve_time").replace("((MM))", minutesStr).replace("((SS))", secondsStr);
}

export function shuffleAndSplit<T>(arr: T[]): [T[], T[]] {
    // Fisher-Yates 알고리즘으로 배열 섞기
    const shuffledArr = [...arr];
    for (let i = shuffledArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
    }

    const midIndex = Math.floor(shuffledArr.length / 2);

    // 배열을 반으로 나누기
    const firstHalf = shuffledArr.slice(0, midIndex);
    const secondHalf = shuffledArr.slice(midIndex);

    return [firstHalf, secondHalf];
}

export function hexTo0xColor(hex) {
    return parseInt(hex.replace('#', ''), 16);
}

export function getLocationAreaCoordinates(locationName: string): [number, number][] {
    if (!ScriptMap.hasLocation(locationName)) return null;
    const locationInfo = ScriptMap.getLocationList(locationName)[0];
    const coordinates: [number, number][] = [];

    if (locationInfo) {
        for (let x = locationInfo.x; x < locationInfo.x + locationInfo.width; x++) {
            for (let y = locationInfo.y; y < locationInfo.y + locationInfo.height; y++) {
                coordinates.push([x, y]);
            }
        }
    }
    return coordinates;
}