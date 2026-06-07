<script setup lang="ts">
import { useWeb3Auth } from "@web3auth/modal/vue";
import { watch, ref } from "vue";
import type { OverlayConfig, WebConfig } from "../types.ts";
import { randomTips } from "../helpers.ts";
import { showModal } from "../composables/useModal.ts";
import { API_URL, SOCKET_URL } from "../consts.ts";

const defaultOverlay: OverlayConfig = {
  imageUrl: "https://pawmi.otternoon.com/assets/donate.gif",
  soundUrl: "https://pawmi.otternoon.com/assets/donate.wav",
  donatorColor: "#ffffff",
  amountColor: "#ffd54f",
  textColor: "#ffffff",
  imageScale: 100,
  headingSize: 42,
  messageSize: 32,
  animIn: "fade",
  animOut: "fade",
  animDuration: 400,
  displayDuration: 8000,
};

const webConfig = ref<WebConfig>({
  colors: {
    header: "#ffffff",
    text: "oklch(0.83768 0.001 17.911)",
    background: "#1b1717",
  },
  overlay: { ...defaultOverlay },
});

const { provider } = useWeb3Auth();
const hasAccount = ref(false);
const isLoading = ref(true);
const address = ref("");
const username = ref("");
const displayName = ref("");
const streamer = ref<any>({});
const pendingAvatar = ref<File | null>(null);
const pendingBanner = ref<File | null>(null);
const pendingDonationImage = ref<File | null>(null);
const pendingDonationSound = ref<File | null>(null);

watch(
  provider,
  async (p) => {
    if (!p) return;
    const accounts = (await p.request({ method: "eth_accounts" })) as string[];
    if (accounts?.length) address.value = accounts[0];
  },
  { immediate: true },
);

watch(address, async (a) => {
  if (!a) return;
  const res = await fetch(`${API_URL}v1/streamers/wallet/${a}`);
  const data = await res.json();
  if (data.streamer) {
    streamer.value = data.streamer;
    username.value = data.streamer.username;
    displayName.value = data.streamer.display_name ?? "";
    try {
      const parsed = JSON.parse(data.streamer.web_config);
      if (parsed) {
        webConfig.value = {
          ...webConfig.value,
          ...parsed,
          colors: { ...webConfig.value.colors, ...parsed.colors },
          overlay: { ...defaultOverlay, ...parsed.overlay },
        };
      }
    } catch {}
    hasAccount.value = true;
  } else {
    hasAccount.value = false;
  }
  isLoading.value = false;
});

async function uploadFile(
  endpoint: string,
  file: File,
  message: string,
  signature: string,
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("wallet_addr", address.value);
  formData.append("message", message);
  formData.append("signature", signature);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

async function register() {
  if (username.value.length < 3 || username.value.length > 32) {
    await showModal("ชื่อผู้ใช้ต้องยาวระหว่าง 3-32 ตัวอักษร");
    return;
  }

  if (/[^a-zA-Z0-9_]/.test(username.value)) {
    await showModal("ชื่อผู้ใช้สามารถมีได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีดล่างเท่านั้น");
    return;
  }

  if (displayName.value.length > 128) {
    await showModal("ชื่อที่แสดงต้องมีความยาวน้อยกว่า 128 ตัวอักษร");
    return;
  }
  const message = `register_${Date.now()}`;
  const signature = await provider.value?.request({
    method: "personal_sign",
    params: [message, address.value],
  });

  const res = await fetch(`${API_URL}v1/streamers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_addr: address.value,
      username: username.value,
      message,
      signature,
    }),
  });
  const data = await res.json();
  if (data.success) {
    hasAccount.value = true;
  }
  if (data.error) await showModal(data.error);
}

async function updateProfile() {
  const message = `register_${Date.now()}`;
  const signature = (await provider.value?.request({
    method: "personal_sign",
    params: [message, address.value],
  })) as string;

  if (pendingAvatar.value) {
    const data = await uploadFile(
      `${API_URL}v1/streamers/upload/avatar`,
      pendingAvatar.value,
      message,
      signature,
    );

    if (data.url) {
      webConfig.value.avatarUrl = `${data.url}?v=${Date.now()}`;
    }

    pendingAvatar.value = null;
  }

  if (pendingBanner.value) {
    const data = await uploadFile(
      `${API_URL}v1/streamers/upload/banner`,
      pendingBanner.value,
      message,
      signature,
    );

    if (data.url) {
      webConfig.value.bannerUrl = `${data.url}?v=${Date.now()}`;
    }

    pendingBanner.value = null;
  }

  if (pendingDonationImage.value) {
    const data = await uploadFile(
      `${API_URL}v1/streamers/upload/donationImage`,
      pendingDonationImage.value,
      message,
      signature,
    );

    if (data.url) {
      webConfig.value.overlay!.imageUrl = `${data.url}?v=${Date.now()}`;
    }

    pendingDonationImage.value = null;
  }

  if (pendingDonationSound.value) {
    const data = await uploadFile(
      `${API_URL}v1/streamers/upload/donationSound`,
      pendingDonationSound.value,
      message,
      signature,
    );

    if (data.url) {
      webConfig.value.overlay!.soundUrl = `${data.url}?v=${Date.now()}`;
    }

    pendingDonationSound.value = null;
  }

  const res = await fetch(`${API_URL}v1/streamers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wallet_addr: address.value,
      username: username.value,
      display_name: displayName.value,
      web_config: JSON.stringify(webConfig.value),
      message,
      signature,
    }),
  });

  const data = await res.json();

  if (data.success) {
    await showModal("บันทึกสำเร็จ!");
  }

  if (data.error) {
    await showModal(data.error);
  }
}

function resetConfig() {
  username.value = streamer.value.username;
  displayName.value = streamer.value.display_name ?? "";

  webConfig.value = {
    colors: {
      header: "#ffffff",
      text: "oklch(0.83768 0.001 17.911)",
      background: "#1b1717",
    },
    overlay: {
      ...defaultOverlay,
    },
  };
}

function selectFile(
  type: "avatar" | "banner" | "donationImage" | "donationSound",
  file: File,
) {
  switch (type) {
    case "avatar":
      pendingAvatar.value = file;
      break;

    case "banner":
      pendingBanner.value = file;
      break;

    case "donationImage":
      pendingDonationImage.value = file;
      break;

    case "donationSound":
      pendingDonationSound.value = file;
      break;
  }
}

async function sendTestAlert() {
  if (!address.value) {
    await showModal("ไม่พบเลขที่บัญชี");
    return;
  }

  const donators = [
    "เต วรากร",
    "เต้ มงคงกิตต์",
    "ลีออน มักส์",
    "สต๊อป จีฟส์",
    "ซาร์ค มักเกอร์เบิร์ก",
    "บารัค โอมาม่า",
    "พี่บ้า เดอะสกี",
    "กรมสรรพากร",
  ];

  const message = [
    "พี่เต พี่เต นั่นคือเสียงเรียกจากเด็ก ๆ ที่เห็นไอดอลของ พวกเขาเดินผ่านมา ต่างคนต่างดีใจที่ได้เห็นพี่เต วรากร คนที่น้อง ๆ เขาชื่นชอบตัวเป็น ๆ สักครั้ง",
    "เลิศ, เริ่ด, เริ๊ด, เฬิฏ, เฬิฎ, เฬิศ, เฬิษ, เฬิส, เฬิฐ, เฬิษฐ์, เฬิฏฐ์, เฬิธ, เฬิธธิ์, เฬิท, เฬิฑ, เฬิฒ, เฬิจ, เฬิช, เฬิซ, เฬิถ, เฬิศศิ์, เฬิสร์, เฬิ๊ฏ",
  ];

  const testEvent = {
    event: "donation_received",
    donator: donators[Math.floor(Math.random() * donators.length)],
    message: message[Math.floor(Math.random() * message.length)],
    amount: "67",
    currency: "USDC",
    timestamp: new Date().toISOString(),
  };

  const ws = new WebSocket(SOCKET_URL);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "test_alert",
        wallet: address.value,
        event: testEvent,
      }),
    );
  };

  ws.onmessage = async (e) => {
    const res = JSON.parse(e.data);

    if (res.status === "success") {
      await showModal("ส่ง test alert สำเร็จ ตรวจสอบหน้า overlay ของคุณ");
    } else {
      await showModal(`เกิดข้อผิดพลาด: ${res.error || "ไม่ทราบสาเหตุ"}`);
    }

    ws.close();
  };

  ws.onerror = async () => {
    await showModal("ไม่สามารถเชื่อมต่อ WebSocket ได้");
    ws.close();
  };
}
</script>

<template>
  <div class="min-h-screen grid place-items-center">
    <div
        v-if="isLoading"
        class="flex flex-col gap-8 items-center justify-center max-w-xl"
    >
      <p class="text-center text-2xl">
        <span class="loading loading-infinity loading-xl"></span>
        กำลังโหลดข้อมูล
      </p>
      <p class="text-center text-sm italic">
        {{ randomTips() }}
      </p>
    </div>
    <div
        v-else-if="hasAccount"
        class="flex flex-col w-full items-center sm:p-8"
    >
      <div class="flex flex-col w-full max-w-5xl gap-8 lg:p-24 p-8">
        <div class="flex flex-col items-center gap-6 mb-2">
          <h1 class="font-bold text-3xl text-center">แดชบอร์ด</h1>
        </div>

        <div class="flex flex-col gap-6 w-full">
          <div class="collapse collapse-arrow border border-base-300 bg-white/5">
            <input type="checkbox" name="settings-accordion" checked/>
            <div class="collapse-title text-xl font-semibold">หน้าโดเนท</div>
            <div class="collapse-content">
              <div class="flex flex-col gap-6">
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ชื่อผู้ใช้ (donate/{{ username }})</span>
                  <input
                      v-model="username"
                      type="text"
                      class="input w-full"
                      placeholder="skibi.di_67"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ชื่อที่แสดง</span>
                  <input
                      v-model="displayName"
                      type="text"
                      class="input w-full"
                      placeholder="เช่น กรุงLnW_Za007"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ข้อความ ใต้ชื่อ</span>
                  <input
                      v-model="webConfig.subText"
                      type="text"
                      class="input w-full"
                      placeholder="เช่น ขอบคุณที่โดเนทน้า"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ข้อความ ช่องจำนวนเงิน</span>
                  <input
                      v-model="webConfig.amountLabel"
                      type="text"
                      class="input w-full"
                      placeholder="จำนวน (บาท)"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ข้อความ ช่องข้อความ</span>
                  <input
                      v-model="webConfig.messageLabel"
                      type="text"
                      class="input w-full"
                      placeholder="ข้อความถึงสตรีมเมอร์"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ข้อความ ปุ่มโดเนท</span>
                  <input
                      v-model="webConfig.confirmLabel"
                      type="text"
                      class="input w-full"
                      placeholder="โดเนทเลย!"
                  />
                </div>
                <div class="flex flex-col gap-3">
                  <span class="text-sm font-medium text-center"
                  >สีของหน้าและข้อความ</span
                  >
                  <div class="flex flex-wrap justify-center gap-6">
                    <label class="flex flex-col items-center gap-1">
                      <span class="text-xs">หัวเรื่อง</span>
                      <input
                          v-model="webConfig.colors!.header"
                          type="color"
                          class="w-12 h-12 rounded-lg cursor-pointer"
                      />
                    </label>
                    <label class="flex flex-col items-center gap-1">
                      <span class="text-xs">ข้อความ</span>
                      <input
                          v-model="webConfig.colors!.text"
                          type="color"
                          class="w-12 h-12 rounded-lg cursor-pointer"
                      />
                    </label>
                    <label class="flex flex-col items-center gap-1">
                      <span class="text-xs">พื้นหลัง</span>
                      <input
                          v-model="webConfig.colors!.background"
                          type="color"
                          class="w-12 h-12 rounded-lg cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">Avatar (1:1)</span>
                  <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="file-input w-full"
                      @change="e => selectFile('avatar', (e.target as HTMLInputElement).files![0])"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">Banner (16:9)</span>
                  <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="file-input w-full"
                      @change="e => selectFile('banner', (e.target as HTMLInputElement).files![0])"
                  />
                </div>

                <RouterLink
                    :to="`/donate/${streamer.username ?? username}`"
                    target="_blank"
                    class="w-full"
                >
                  <button class="btn btn-secondary w-full">
                    ดูหน้าเว็บโดเนท
                  </button>
                </RouterLink>
              </div>
            </div>
          </div>

          <div class="collapse collapse-arrow border border-base-300 bg-white/5">
            <input type="checkbox" name="settings-accordion"/>
            <div class="collapse-title text-xl font-semibold">หน้าแจ้งเตือน (Overlay)</div>
            <div class="collapse-content">
              <div class="flex flex-col gap-6">
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">URL โอเวอร์เลย์ (ก๊อปปี้และวางในโปรแกรมสตรีม เช่น OBS, StreamLabs, และอื่น ๆ)</span>
                  <input
                      :value="`https://paymoi.otternoon.com/overlay/${address}`"
                      type="url"
                      class="input w-full"
                      readonly
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">รูปแจ้งเตือนโดเนท (ไม่เกิน 12 MB)</span>

                  <input
                      type="file"
                      accept="image/gif"
                      class="file-input w-full"
                      @change="e => selectFile('donationImage',(e.target as HTMLInputElement).files![0])"
                  />

                  <input
                      :value="webConfig.overlay!.imageUrl"
                      type="url"
                      class="input w-full"
                      readonly
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">เสียงแจ้งเตือนโดเนท (ไม่เกิน 12 MB)</span>
                  <input
                      type="file"
                      accept="audio/ogg,audio/webm,audio/mpeg,audio/wav"
                      class="file-input w-full"
                      @change="e => selectFile('donationSound',(e.target as HTMLInputElement).files![0])"
                  />
                  <input
                      :value="webConfig.overlay!.soundUrl"
                      type="url"
                      class="input w-full"
                      readonly
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">สีชื่อผู้บริจาค</span>
                  <input
                      v-model="webConfig.overlay!.donatorColor"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">สียอดโดเนท</span>
                  <input
                      v-model="webConfig.overlay!.amountColor"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">สีข้อความ</span>
                  <input
                      v-model="webConfig.overlay!.textColor"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ขนาด GIF (%)</span>
                  <input
                      v-model.number="webConfig.overlay!.imageScale"
                      type="number"
                      min="25"
                      max="300"
                      class="input input-sm w-full"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ขนาดหัวเรื่อง</span>
                  <input
                      v-model.number="webConfig.overlay!.headingSize"
                      type="number"
                      min="16"
                      max="96"
                      class="input input-sm w-full"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ขนาดข้อความ</span>
                  <input
                      v-model.number="webConfig.overlay!.messageSize"
                      type="number"
                      min="12"
                      max="72"
                      class="input input-sm w-full"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ระยะเวลาแสดงผล (ms)</span>
                  <input
                      v-model.number="webConfig.overlay!.displayDuration"
                      type="number"
                      min="1000"
                      max="30000"
                      step="500"
                      class="input input-sm w-full"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">ระยะเวลาอนิเมชัน (ms)</span>
                  <input
                      v-model.number="webConfig.overlay!.animDuration"
                      type="number"
                      min="100"
                      max="2000"
                      step="50"
                      class="input input-sm w-full"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">อนิเมชันตอนเข้า</span>
                  <select
                      v-model="webConfig.overlay!.animIn"
                      class="select select-sm w-full"
                  >
                    <option value="fade">Fade</option>
                    <option value="pop">Pop</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium">อนิเมชันตอนออก</span>
                  <select
                      v-model="webConfig.overlay!.animOut"
                      class="select select-sm w-full"
                  >
                    <option value="fade">Fade</option>
                    <option value="pop">Pop</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RouterLink
                      :to="`/overlay/${address}`"
                      target="_blank"
                      class="w-full"
                  >
                    <button class="btn btn-accent w-full">
                      เปิดหน้า Alert
                    </button>
                  </RouterLink>

                  <button
                      class="btn btn-warning w-full"
                      @click="sendTestAlert"
                  >
                    ทดสอบ Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-4 mt-8">
          <div class="flex gap-3">
            <button
                class="btn btn-primary flex-1"
                @click="updateProfile"
            >
              บันทึกการตั้งค่า
            </button>

            <button
                class="btn btn-outline btn-error"
                @click="resetConfig"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
        v-else
        class="flex flex-col gap-8 items-center justify-center max-w-xl"
    >
      <h1 class="font-bold text-2xl">สร้างบัญชีผู้ใช้สำหรับสตรีมเมอร์</h1>
      <div class="flex flex-col gap-2">
        <input
            v-model="username"
            type="text"
            placeholder="ชื่อผู้ใช้ (Username)"
            class="input"
        />
        <input
            v-model="displayName"
            type="text"
            placeholder="ชื่อที่แสดง (Display name)"
            class="input"
        />
      </div>
      <button class="btn btn-primary" @click="register()">สร้างบัญชี</button>
    </div>
  </div>
</template>
