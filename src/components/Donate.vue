<script setup lang="ts">
import {useRoute} from "vue-router"
import {useWeb3Auth} from '@web3auth/modal/vue'
import {useWeb3AuthConnect} from '@web3auth/modal/vue'
import {onMounted, ref, computed, watch} from "vue"
import {createPublicClient, encodeFunctionData, parseUnits, http, formatUnits} from "viem";
import {base, baseSepolia} from "viem/chains";

interface WebConfig {
  subText?: string
  amountLabel?: string
  messageLabel?: string
  confirmLabel?: string
  avatarUrl?: string;
  bannerUrl?: string;
  colors?: { header?: string; text?: string; background?: string }
}

interface Streamer {
  wallet_addr: string
  username: string
  display_name: string
  web_config: string
}

const route = useRoute()
const {provider} = useWeb3Auth()
const {connect, isConnected} = useWeb3AuthConnect()

const streamer = ref<Streamer | null>(null)
const webConfig = ref<WebConfig>({})
const notFound = ref(false)

const donatorName = ref("")
const thbAmount = ref(20)
const message = ref("")
const rate = ref(33)
const sending = ref(false)
const address = ref("");
const usdcBalance = ref("0.00");
const ethBalance = ref("0.0000");
const url = import.meta.env.DEV ? 'https://sepolia.base.org' : 'https://mainnet.base.org'
const publicClient = createPublicClient({
  chain: import.meta.env.DEV ? baseSepolia : base,
  transport: http(url)
})

const usdcAmount = computed(() => (thbAmount.value / rate.value).toFixed(6))

const avatarUrl = computed(() => webConfig.value.avatarUrl ?? `https://gravatar.com/avatar/${Date.now()}?d=retro&s=600`)
const bannerUrl = computed(() => webConfig.value.bannerUrl ?? `https://picsum.photos/seed/${Date.now()}/800/600`)
const bannerStyle = computed(() => ({
  backgroundImage: bannerUrl.value ? `url(${bannerUrl.value})` : 'none',
  backgroundColor: webConfig.value.colors?.background ?? '#1b1717',
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'repeat',
}))

async function fetchBalance(userAddress: string) {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        inputs: [{name: 'account', type: 'address'}],
        outputs: [{type: 'uint256'}],
        stateMutability: 'view'
      }] as const,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    })

    usdcBalance.value = Number(formatUnits(balance, 6)).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    const eth = await publicClient.getBalance({address: userAddress as `0x${string}`});
    ethBalance.value = Number(formatUnits(eth, 18)).toFixed(5);
  } catch (e) {
    console.error("ดึงยอดเงิน USDC ล้มเหลว:", e)
  }
}

onMounted(async () => {
  const name = route.params.name
  const res = await fetch(`https://paypoint.otternoon.com/v1/streamers/${name}`)
  const data = await res.json()
  if (!data.success) {
    notFound.value = true;
    return
  }
  streamer.value = data.streamer
  try {
    webConfig.value = JSON.parse(data.streamer.web_config) ?? {}
  } catch {
  }

  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=thb')
    const d = await r.json()
    rate.value = d['usd-coin'].thb
  } catch {
  }

  //@ts-ignore
  my_modal_5.showModal();
})

watch(provider, async (p) => {
  if (!p) return
  const accounts = (await p.request({method: 'eth_accounts'})) as string[];
  if (accounts?.length) {
    address.value = accounts[0]
    await fetchBalance(accounts[0])
  }
}, {immediate: true})

const USDC_ADDRESS = import.meta.env.DEV ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e' : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_ABI = [{
  name: 'transfer',
  type: 'function',
  inputs: [
    {name: 'to', type: 'address'},
    {name: 'amount', type: 'uint256'}
  ],
  outputs: [{type: 'bool'}],
  stateMutability: 'nonpayable'
}] as const

async function sendUSDC(to: string, usdcAmount: string): Promise<string> {
  const data = encodeFunctionData({
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [to as `0x${string}`, parseUnits(usdcAmount, 6)]
  })

  const txhash = await provider.value?.request({
    method: 'eth_sendTransaction',
    params: [{
      from: (await provider.value.request({method: 'eth_accounts'}) as string[])[0],
      to: USDC_ADDRESS,
      data,
      chainId: import.meta.env.DEV ? '0x14a34' : '0x2105'
    }]
  })

  return txhash as string
}

async function donate() {
  if (!provider.value || !streamer.value) return
  if (!donatorName.value) {
    alert("กรุณากรอกชื่อ");
    return
  }
  if (thbAmount.value < 1) {
    alert("จำนวนเงินขั้นต่ำ 1 บาท");
    return
  }

  sending.value = true
  try {
    const accounts = await provider.value.request({method: 'eth_accounts'}) as string[]
    const from = accounts[0]
    const txhash = await sendUSDC(streamer.value.wallet_addr, usdcAmount.value)
    await fetch('https://paypoint.otternoon.com/v1/donate/pending', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        from, to: streamer.value.wallet_addr,
        amount: usdcAmount.value,
        donator: donatorName.value,
        message: message.value, txhash
      })
    })
    alert("โดเนทสำเร็จ!")
  } catch (e) {
    alert("เกิดข้อผิดพลาด")
    console.error(e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center p-4 relative" :style="bannerStyle">
    <div class="absolute inset-0 backdrop-blur-sm bg-black/50 pointer-events-none"/>

    <div v-if="notFound" class="relative text-center text-white">
      <p class="text-2xl">ไม่พบสตรีมเมอร์นี้</p>
    </div>

    <div v-else-if="!streamer" class="relative flex flex-col items-center gap-4">
      <span class="loading loading-infinity loading-xl text-white"></span>
    </div>

    <div v-else class="relative w-full max-w-md">
      <dialog id="my_modal_5" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 class="text-2xl mb-6 font-bold text-center">เติมเงินเพื่อแปลงเป็นสกุลเงินคริปโต</h3>
          <p class="text-center text-sm font-bold text-success mb-4">
            ยอดเงินปัจจุบัน: {{ usdcBalance }} USDC
            ({{
              (Number(usdcBalance.replace(/,/g, '')) * rate).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            }} บาท) + {{ ethBalance }} ETH
          </p>
          <div class="flex flex-col gap-4">
            <span class="text-base">
              คุณมีบัญชีไว้รับเงินคริปโตแล้วจ้า อิอิ ตอนนี้ได้เวลาเติมเงินหล่ะ <br>
              สามารถเปิดบัญชี <a class="text-blue-500 underline" target="_blank" href="https://www.binance.th/th">Binance TH</a> ยืนยันตัวตนแล้วเติมเงินไทยได้เลย!<br>
              ขั้นต่ำคือ 100 บาทนะ แล้วก็กด "Withdraw"
              <ul class="list-disc list-inside">
                <li>เลือกเหรียญ "USDC"</li>
                <li>เลือกเน็ตเวิร์ก "Base"</li>
              </ul>
              ส่วน Address ให้ใส่เป็นเลขบัญชีด้านล่างเลยจรุ้ว <br>
            </span>
            <input v-model="address" type="text" min="1" class="input w-full disabled" readonly/>
            <p class="text-base">
              จากนั้นให้ทำอีกรอบ แต่รอบนี้เปลี่ยนจาก "USDC" เป็น "ETH" <br>
              ให้โอนสัก <b>1 บาท (0.000016ETH)</b> พอ <br>
              ใช้เป็นค่าธรรมเนียมการโอนในบล็อกเชนเรียกว่าค่า "Gas" <br>
              (ธุรกรรมนึงใช้แค่หลักสตางค์ ดังนั้น 1 บาทนี้ใช้ได้ยาว ๆ เลย)
            </p>
            <div class="divider"></div>
            <p class="text-sm">
              เงินในกระเป๋าจะคงอยู่ สามารถใช้เพื่อโดเนทครั้งต่อไปได้
              สามารถขายเป็นเงินไทยด้วยการโอนกลับไปที่เดิมแล้วกดขายได้เลย (ในแอพ Binance TH ผ่านเมนู Buy/Sell)
              <br> <br>
              จัดการกระเป๋าเงินได้ที่ <a href="https://wallet.web3auth.io" target="_blank"
                                         class="text-blue-500 underline">Web3Auth Wallet</a>
              โดยล็อกอินด้วยบัญชีเดียวกันกับ PayMoi
            </p>
            <p class="text-base font-bold text-red-400">
              เลือกโอนผ่านเน็ตเวิร์ก "BASE" เท่านั้น ไม่งั้นเงินหายนะ!
            </p>
          </div>
          <div class="modal-action">
            <div class="flex gap-2">
              <a href="https://www.binance.th/th" target="_blank">
                <button class="btn btn-accent">ไปที่ Binance TH</button>
              </a>
              <form method="dialog">
                <button class="btn btn-success">รู้แล้ว</button>
              </form>
            </div>
          </div>
        </div>
      </dialog>

      <div class="flex justify-center mb-0 z-10 relative">
        <div class="avatar">
          <div class="w-24 rounded-full ring-4 ring-base-100 shadow-xl bg-base-300">
            <img :src="avatarUrl"
                 @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"/>
          </div>
        </div>
      </div>

      <div class="card shadow-xl -mt-12 pt-0 bg-base-100"
           :style="webConfig.colors?.background ? `background-color:${webConfig.colors?.background}` : ''"
      >
        <div class="card-body gap-4 pt-16">

          <div class="text-center">
            <h1 class="text-2xl font-bold"
                :style="webConfig.colors?.header ? `color:${webConfig.colors.header}` : ''">
              {{ streamer.display_name }}
            </h1>
            <p v-if="webConfig.subText" class="text-sm opacity-70 mt-1">{{ webConfig.subText }}</p>
          </div>

          <div v-if="!isConnected" class="flex flex-col gap-2 items-center">
            <p class="text-sm opacity-70">กรุณาเข้าสู่ระบบเพื่อโดเนท</p>
            <button class="btn btn-primary w-full" @click="connect">Login</button>
          </div>

          <template v-else>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อของคุณ</legend>
              <input v-model="donatorName" type="text" class="input w-full" placeholder="ชื่อ"/>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ webConfig.amountLabel ?? 'จำนวน (บาท)' }}</legend>
              <input v-model.number="thbAmount" type="number" min="1" class="input w-full"/>
              <p class="label">≈ {{ usdcAmount }} USDC</p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ webConfig.messageLabel ?? 'ข้อความ (ไม่บังคับ)' }}</legend>
              <textarea v-model="message" class="textarea w-full" rows="3"/>
            </fieldset>

            <button class="btn btn-primary w-full" :disabled="sending" @click="donate">
              <span v-if="sending" class="loading loading-spinner loading-sm"></span>
              {{ webConfig.confirmLabel ?? 'โดเนทเลย!' }}
            </button>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>