import { actionToAllPlayers } from "./Common";
import { Localizer } from "./Localizer";

export function clearCustomLabel(player = null) {
	if (player) {
		player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
			key: "main",
		});
		player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
			key: "sub",
		});
	} else {
		actionToAllPlayers((player) => {
			player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
				key: "main",
			});
			player.showCustomLabel("-", 0xffffff, 0x000000, -2000, 0, 1, 1000, {
				key: "sub",
			});
		});
	}
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
}

export function showLabel(player: any, key: string, options: LabelOptions = {}) {
	const mobileLabelPercentWidth = { XL: 90, L: 80, M: 70, S: 60 };
	const tabletLabelPercentWidth = { XL: 84, L: 68, M: 54, S: 48 };
	const pcLabelPercentWidth = { XL: 50, L: 40, M: 28, S: 20 };

	const {
		labelWidth = "M",
		topGapMobile = 10,
		topGapPC = -2,
		backgroundColor = 0x27262e,
		borderRadius = "12px",
		padding = "8px",
		fontOpacity = false,
		labelDisplayTime = 3000,
		texts = [], // 기본적으로 빈 배열을 허용
	} = options;

	const isMobile = player.isMobile && !player.isTablet;
	const isTablet = player.isMobile && player.isTablet;

	const topGap = isMobile ? topGapMobile : topGapPC;

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
