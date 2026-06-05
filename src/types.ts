interface Streamer {
    wallet_addr: string
    username: string
    display_name: string
    web_config: string
}

interface OverlayConfig {
    imageUrl?: string
    soundUrl?: string
    donatorColor?: string
    amountColor?: string
    textColor?: string
    imageScale?: number
    headingSize?: number
    messageSize?: number
    animIn?: 'fade' | 'pop' | 'none'
    animOut?: 'fade' | 'pop' | 'none'
    animDuration?: number
    displayDuration?: number
}

interface WebConfig {
    subText?: string
    amountLabel?: string
    messageLabel?: string
    confirmLabel?: string
    avatarUrl?: string
    bannerUrl?: string
    colors?: {
        header?: string
        text?: string
        background?: string
    }
    overlay?: OverlayConfig
}

export type {
    Streamer,
    OverlayConfig,
    WebConfig
}