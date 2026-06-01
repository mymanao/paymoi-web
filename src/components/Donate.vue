<script setup lang="ts">
import {useRoute} from "vue-router"
import {useWeb3Auth} from '@web3auth/modal/vue'
import {useWeb3AuthConnect} from '@web3auth/modal/vue'
import {onMounted, ref, computed} from "vue"
import {encodeFunctionData, parseUnits} from "viem";

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

const usdcAmount = computed(() => (thbAmount.value / rate.value).toFixed(6))

const avatarUrl = computed(() => webConfig.value.avatarUrl ?? null)
const bannerUrl = computed(() => webConfig.value.bannerUrl ?? null)
const bannerStyle = computed(() => ({
  backgroundImage: bannerUrl.value ? `url(${bannerUrl.value})` : 'none',
  backgroundColor: webConfig.value.colors?.background ?? '#1b1717',
  backgroundSize: 'fit',
  backgroundPosition: 'center center',
  backgroundRepeat: 'repeat',
}))

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
})

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
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
      chainId: '0x2105'
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

      <div class="flex justify-center mb-0 z-10 relative">
        <div class="avatar">
          <div class="w-24 rounded-full ring-4 ring-base-100 shadow-xl bg-base-300">
            <img v-if="avatarUrl" :src="avatarUrl"
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