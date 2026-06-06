import { encodeFunctionData, formatUnits, parseUnits } from "viem";
import { publicClient, USDC_ABI, USDC_ADDRESS } from "./consts.ts";
import type { IProvider } from "@web3auth/modal";

async function sendUSDC(
  provider: IProvider,
  to: string,
  usdcAmount: string,
): Promise<string> {
  await changeNetwork(provider);
  const data = encodeFunctionData({
    abi: USDC_ABI,
    functionName: "transfer",
    args: [to as `0x${string}`, parseUnits(usdcAmount, 6)],
  });

  const txhash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: (
          (await provider.request({ method: "eth_accounts" })) as string[]
        )[0],
        to: USDC_ADDRESS,
        data,
        chainId: import.meta.env.DEV ? "0x14a34" : "0x2105",
      },
    ],
  });

  return txhash as string;
}

async function fetchBalance(userAddress: string) {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ type: "uint256" }],
          stateMutability: "view",
        },
      ] as const,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`],
    });
    const eth = await publicClient.getBalance({
      address: userAddress as `0x${string}`,
    });

    return {
      usdc: Number(formatUnits(balance, 6)).toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      eth: Number(formatUnits(eth, 18)).toFixed(5),
    };
  } catch (e) {
    console.error("Cannot fetch balance: ", e);
    return { usdc: null, eth: null };
  }
}

async function changeNetwork(provider: IProvider) {
  const chainId = import.meta.env.DEV ? "0x14a34" : "0x2105";
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (e) {
    alert("Error while changing network");
    console.error(e);
  }
}

function randomTips() {
  const tips = [
    'มันอ่านว่า "เปย์มัว" จ้า',
    'เลือกเครือข่าย "Base" นะ ๆๆๆๆ',
    "เหรียญ USDC มีมูลค่าเทียบเท่า 1 ดอลล่าร์สหรัฐ",
    "อย่าลืมยืนยันตัวตนก่อนซื้อขายคริปโตนะ",
    "กะเพราหมูกรอบไข่ดาวเยิ้ม ๆ",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

export { sendUSDC, fetchBalance, randomTips };
