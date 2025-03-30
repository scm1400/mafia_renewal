import { actionToAllPlayers } from "./Common";
import { Localizer } from "./Localizer";

// 라벨 위치 관리를 위한 변수들
const LABEL_SPACING = 60; // 라벨 간 간격 (픽셀)
const labelCounts: { [key: string]: number } = {}; // 각 플레이어별 활성 라벨 수 관리
const playerLabels: { [playerIdAndKey: string]: number } = {}; // 플레이어별, 키별 라벨 순서 저장

export function clearCustomLabel(player = null) {
	if (player) {
		player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
			key: "main",
		});
		player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
			key: "sub",
		});
		
		// 라벨 카운트 초기화
		if (player.id) {
			Object.keys(playerLabels).forEach(idAndKey => {
				if (idAndKey.startsWith(`${player.id}_`)) {
					delete playerLabels[idAndKey];
				}
			});
			labelCounts[player.id] = 0;
		}
	} else {
		actionToAllPlayers((player) => {
			player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
				key: "main",
			});
			player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
				key: "sub",
			});
			
			// 라벨 카운트 초기화
			if (player.id) {
				Object.keys(playerLabels).forEach(idAndKey => {
					if (idAndKey.startsWith(`${player.id}_`)) {
						delete playerLabels[idAndKey];
					}
				});
				labelCounts[player.id] = 0;
			}
		});
		
		// 모든 라벨 카운트 초기화
		Object.keys(labelCounts).forEach(key => {
			labelCounts[key] = 0;
		});
		Object.keys(playerLabels).forEach(key => {
			delete playerLabels[key];
		});
	}
}

// 라벨이 사라질 때 호출되는 함수
function cleanupLabel(playerId: string, key: string, timeout: number) {
	setTimeout(() => {
		const labelKey = `${playerId}_${key}`;
		
		// 라벨 제거 및 카운트 감소
		if (playerLabels[labelKey] !== undefined) {
			delete playerLabels[labelKey];
			
			// 라벨 위치 재계산
			if (labelCounts[playerId] && labelCounts[playerId] > 0) {
				labelCounts[playerId]--;
			}
			
			// 활성 라벨 목록 재정렬
			const playerActiveLabels = Object.keys(playerLabels)
				.filter(k => k.startsWith(`${playerId}_`))
				.sort((a, b) => playerLabels[a] - playerLabels[b]);
			
			// 인덱스 재할당
			playerActiveLabels.forEach((labelId, index) => {
				playerLabels[labelId] = index;
			});
		}
	}, timeout);
}

interface TextStyle {
	fontSize?: string;
	mobileFontSize?: string;
	fontWeight?: number;
	color?: string;
}

interface TextElement {
	text: string;
	style?: TextStyle;
}

interface LabelOptions {
	labelWidth?: "XL" | "L" | "M" | "S";
	topGapMobile?: number;
	topGapPC?: number;
	backgroundColor?: number;
	borderRadius?: string;
	padding?: string;
	fontOpacity?: boolean;
	labelDisplayTime?: number;
	texts?: TextElement[]; // 텍스트와 스타일 정보를 포함하는 배열
	fixedPosition?: boolean; // 고정 위치 사용 여부
}

export function showLabel(player: any, key: string, options: LabelOptions = {}) {
	const mobileLabelPercentWidth = { XL: 90, L: 80, M: 70, S: 60 };
	const tabletLabelPercentWidth = { XL: 84, L: 68, M: 54, S: 48 };
	const pcLabelPercentWidth = { XL: 50, L: 40, M: 28, S: 20 };

	const {
		labelWidth = "M",
		topGapMobile = 10,
		topGapPC = 90,
		backgroundColor = 0x27262e,
		borderRadius = "12px",
		padding = "8px",
		fontOpacity = false,
		labelDisplayTime = 3000,
		texts = [], // 기본적으로 빈 배열을 허용
		fixedPosition = false, // 기본값은 false (위치 조정)
	} = options;

	const isMobile = player.isMobile && !player.isTablet;
	const isTablet = player.isMobile && player.isTablet;

	const baseTopGap = isMobile ? topGapMobile : topGapPC;
	let topGap = baseTopGap;
	
	// 라벨 위치 계산 (fixedPosition이 false인 경우만)
	if (!fixedPosition && player.id) {
		// 플레이어 ID와 라벨 키를 조합한 고유 키
		const labelKey = `${player.id}_${key}`;
		
		// 라벨 카운트 초기화 (필요시)
		if (!labelCounts[player.id]) {
			labelCounts[player.id] = 0;
		}
		
		// 기존에 같은 키의 라벨이 있으면 위치 재사용
		if (playerLabels[labelKey] !== undefined) {
			topGap = baseTopGap + (playerLabels[labelKey] * LABEL_SPACING);
		} else {
			// 새 라벨이면 위치 할당
			playerLabels[labelKey] = labelCounts[player.id];
			topGap = baseTopGap + (labelCounts[player.id] * LABEL_SPACING);
			labelCounts[player.id]++;
		}
		
		// 라벨이 사라질 때 정리 작업
		cleanupLabel(player.id, key, labelDisplayTime);
	}

	// Label Percent Width 설정
	let labelPercentWidth: number;
	if (isMobile) {
		labelPercentWidth = mobileLabelPercentWidth[labelWidth];
	} else if (isTablet) {
		labelPercentWidth = tabletLabelPercentWidth[labelWidth];
	} else {
		labelPercentWidth = pcLabelPercentWidth[labelWidth];
	}

	// Styles 설정
	const parentStyle = `
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center;`;

	// 텍스트 요소의 기본 스타일
	const defaultTextStyle: TextStyle = { fontSize: "18px", mobileFontSize: "14px", fontWeight: 400, color: "white" };

	let htmlStr = `<span style="${parentStyle}">`;

	// 각 텍스트에 대해 HTML 생성
	texts.forEach(({ text, style = {} }) => {
		if (!text) return;
		const { fontSize, mobileFontSize, fontWeight, color } = { ...defaultTextStyle, ...style };

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
		padding: padding,
	};

	// Custom label 출력
	player.showCustomLabel(htmlStr, 0xffffff, backgroundColor, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
}
