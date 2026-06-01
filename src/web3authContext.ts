import {type Web3AuthContextConfig} from '@web3auth/modal/vue'
import {
    WALLET_CONNECTORS,
    WEB3AUTH_NETWORK,
    type Web3AuthOptions,
} from '@web3auth/modal'

const web3AuthOptions: Web3AuthOptions = {
    clientId: import.meta.env.DEV ? import.meta.env.VITE_DEV_CLIENT_ID : import.meta.env.VITE_CLIENT_ID,
    web3AuthNetwork: import.meta.env.DEV ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    modalConfig: {
        connectors: {
            [WALLET_CONNECTORS.AUTH]: {
                label: 'auth',
                loginMethods: {
                    google: {name: 'google login'},
                },
                showOnModal: true,
            },
        },
        hideWalletDiscovery: true,
    },
}

export const web3AuthContextConfig: Web3AuthContextConfig = {
    web3AuthOptions,
}