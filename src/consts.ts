import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const url = import.meta.env.DEV
  ? "https://sepolia.base.org"
  : "https://mainnet.base.org";
const publicClient = createPublicClient({
  chain: import.meta.env.DEV ? baseSepolia : base,
  transport: http(url),
});

const USDC_ADDRESS = import.meta.env.DEV
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const API_URL = import.meta.env.DEV
  ? "https://paypoint-sepolia.otternoon.com/"
  : "https://paypoint.otternoon.com/";
const SOCKET_URL = import.meta.env.DEV
  ? "wss://paypoint-sepolia.otternoon.com/paymoi"
  : "wss://paypoint.otternoon.com/paymoi";

export { url, publicClient, USDC_ADDRESS, USDC_ABI, API_URL, SOCKET_URL };
