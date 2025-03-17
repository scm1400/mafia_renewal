// 텍스트 컴포넌트 정보 인터페이스
interface TextComponentInfo {
    name: string;
    x?: number;
    y?: number;
    text?: string;
    style?: PhaserTypes.TextStyle;
    depth?: number;
}

// 이미지 컴포넌트 정보 인터페이스
interface ImageComponentInfo {
    name: string;
    x: number;
    y: number;
    texture?: string;
    depth?: number;
}

// 스프라이트 컴포넌트 정보 인터페이스
interface SpriteComponentInfo {
    name: string;
    x?: number;
    y?: number;
    texture?: string;
    depth?: number;
}

// 그래픽스 컴포넌트 정보 인터페이스
interface GraphicsComponentInfo {
    name: string;
    config?: { x: number; y: number };
    depth?: number;
}

// 타일 스프라이트 컴포넌트 정보 인터페이스
interface TileSpriteComponentInfo {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    textureKey: string;
    frameKey?: string;
    depth?: number;
}

// 컴포넌트 정보 인터페이스
export interface ComponentInfo {
    text?: TextComponentInfo;
    image?: ImageComponentInfo;
    sprite?: SpriteComponentInfo;
    graphics?: GraphicsComponentInfo;
    tileSprite?: TileSpriteComponentInfo;
}

// 게임 오브젝트 속성 업데이트를 위한 인터페이스
interface GameObjectCompositionInfo {
    [key: string]: any;
}

// 함수 파라미터 인터페이스
interface FunctionParams {
    [index: number]: any;
}


namespace PhaserTypes {
    export type TextStyle = {
        /**
         * The font the Text object will render with. This is a Canvas style font string.
         */
        fontFamily?: string;
        /**
         * The font size, as a CSS size string.
         */
        fontSize?: number | string;
        /**
         * Any addition font styles, such as 'strong'.
         */
        fontStyle?: string;
        /**
         * The font family or font settings to set. Overrides the other font settings.
         */
        font?: string;
        /**
         * A solid fill color that is rendered behind the Text object. Given as a CSS string color such as `#ff0`.
         */
        backgroundColor?: string;
        /**
         * The color the Text is drawn in. Given as a CSS string color such as `#fff` or `rgb()`.
         */
        color?: string | CanvasGradient | CanvasPattern;
        /**
         * The color used to stroke the Text if the `strokeThickness` property is greater than zero.
         */
        stroke?: string | CanvasGradient | CanvasPattern;
        /**
         * The thickness of the stroke around the Text. Set to zero for no stroke.
         */
        strokeThickness?: number;
        /**
         * The Text shadow configuration object.
         */
        shadow?: TextShadow;
        /**
         * A Text Padding object.
         */
        padding?: TextPadding;
        /**
         * The alignment of the Text. This only impacts multi-line text. Either `left`, `right`, `center` or `justify`.
         */
        align?: string;
        /**
         * The maximum number of lines to display within the Text object.
         */
        maxLines?: number;
        /**
         * Force the Text object to have the exact width specified in this property. Leave as zero for it to change accordingly to content.
         */
        fixedWidth?: number;
        /**
         * Force the Text object to have the exact height specified in this property. Leave as zero for it to change accordingly to content.
         */
        fixedHeight?: number;
        /**
         * Sets the resolution (DPI setting) of the Text object. Leave at zero for it to use the game resolution.
         */
        resolution?: number;
        /**
         * Set to `true` if this Text object should render from right-to-left.
         */
        rtl?: boolean;
        /**
         * This is the string used to aid Canvas in calculating the height of the font.
         */
        testString?: string;
        /**
         * The amount of horizontal padding added to the width of the text when calculating the font metrics.
         */
        baselineX?: number;
        /**
         * The amount of vertical padding added to the height of the text when calculating the font metrics.
         */
        baselineY?: number;
        /**
         * The Text Word wrap configuration object.
         */
        wordWrap?: TextWordWrap;
        /**
         * A Text Metrics object. Use this to avoid expensive font size calculations in text heavy games.
         */
        metrics?: TextMetrics;
        /**
         * The amount to add to the font height to achieve the overall line height.
         */
        lineSpacing?: number;
    };

    type TextWordWrap = {
        /**
         * The width at which text should be considered for word-wrapping.
         */
        width?: number;
        /**
         * The context in which the word wrap callback is invoked.
         */
        callbackScope?: any;
        /**
         * Use basic or advanced word wrapping?
         */
        useAdvancedWrap?: boolean;
    };

    type TextPadding = {
        /**
         * If set this value is used for both the left and right padding.
         */
        x?: number;
        /**
         * If set this value is used for both the top and bottom padding.
         */
        y?: number;
        /**
         * The amount of padding added to the left of the Text object.
         */
        left?: number;
        /**
         * The amount of padding added to the right of the Text object.
         */
        right?: number;
        /**
         * The amount of padding added to the top of the Text object.
         */
        top?: number;
        /**
         * The amount of padding added to the bottom of the Text object.
         */
        bottom?: number;
    };

    type TextMetrics = {
        /**
         * The ascent of the font.
         */
        ascent: number;
        /**
         * The descent of the font.
         */
        descent: number;
        /**
         * The size of the font.
         */
        fontSize: number;
    };


    type TextShadow = {
        /**
         * The horizontal offset of the shadow.
         */
        offsetX?: number;
        /**
         * The vertical offset of the shadow.
         */
        offsetY?: number;
        /**
         * The color of the shadow, given as a CSS string value.
         */
        color?: string;
        /**
         * The amount of blur applied to the shadow. Leave as zero for a hard shadow.
         */
        blur?: number;
        /**
         * Apply the shadow to the stroke effect on the Text object?
         */
        stroke?: boolean;
        /**
         * Apply the shadow to the fill effect on the Text object?
         */
        fill?: boolean;
    };
}