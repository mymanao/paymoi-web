<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { API_URL, SOCKET_URL } from "../consts.ts";

interface OverlayConfig {
  imageUrl?: string;
  soundUrl?: string;
  donatorColor?: string;
  amountColor?: string;
  textColor?: string;
  imageScale?: number;
  headingSize?: number;
  messageSize?: number;
  animIn?: "fade" | "pop" | "none";
  animOut?: "fade" | "pop" | "none";
  animDuration?: number;
  displayDuration?: number;
}

interface DonationAlert {
  donator: string;
  message: string;
  amount: string;
  currency: string;
}

const route = useRoute();
const wallet = route.params.wallet as string | undefined;

const config = ref<OverlayConfig>({
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
});

const alert = ref<DonationAlert | null>(null);
const visible = ref(false);
let ws: WebSocket | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const soundData = computed(() => config.value.soundUrl);
const imageData = computed(() => config.value.imageUrl);

function playSound() {
  if (!soundData.value) return;
  const audio = new Audio(soundData.value);
  audio.play().catch(() => {});
}

function showAlert(data: DonationAlert) {
  if (hideTimer) clearTimeout(hideTimer);
  alert.value = data;
  visible.value = true;
  playSound();
  hideTimer = setTimeout(() => {
    visible.value = false;
    setTimeout(() => (alert.value = null), config.value.animDuration ?? 400);
  }, config.value.displayDuration ?? 8000);
}

function connect() {
  if (!wallet) return;
  ws = new WebSocket(SOCKET_URL);
  ws.onopen = () => {
    ws?.send(JSON.stringify({ type: "overlay", wallet: wallet.toLowerCase() }));
  };
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.event === "donation_received") showAlert(data);
  };
  ws.onclose = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 5000);
  };
}

onMounted(async () => {
  if (!wallet) {
    console.warn("No wallet parameter provided");
    return;
  }

  try {
    const res = await fetch(`${API_URL}v1/streamers/wallet/${wallet}`);
    const data = await res.json();
    if (data.streamer?.web_config) {
      try {
        const parsed = JSON.parse(data.streamer.web_config);
        if (parsed?.overlay) {
          config.value = { ...config.value, ...parsed.overlay };
        }
      } catch (e) {
        console.warn("Failed to parse web_config", e);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch config", e);
  }

  connect();
});

onUnmounted(() => {
  ws?.close();
  if (hideTimer) clearTimeout(hideTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
});

const transitionProps = computed(() => {
  switch (config.value.animIn) {
    case "pop":
      return {
        enterActiveClass: "transition-all duration-300 ease-out",
        enterFromClass: "opacity-0 scale-90",
        enterToClass: "opacity-100 scale-100",
        leaveActiveClass: "transition-all duration-300 ease-in",
        leaveFromClass: "opacity-100 scale-100",
        leaveToClass: "opacity-0 scale-90",
      };

    case "fade":
      return {
        enterActiveClass: "transition-opacity duration-300",
        enterFromClass: "opacity-0",
        enterToClass: "opacity-100",
        leaveActiveClass: "transition-opacity duration-300",
        leaveFromClass: "opacity-100",
        leaveToClass: "opacity-0",
      };
    default:
      return {};
  }
});

onMounted(() => {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
});
</script>

<template>
  <Transition v-bind="transitionProps">
    <div
        v-if="alert && visible"
        class="overlay"
    >
      <div class="alert-box">
        <img
            v-if="imageData"
            :src="imageData"
            class="alert-image"
            :style="{
              width: `${config.imageScale ?? 100}%`,
              maxWidth: '400px'
            }"
            alt=""
        >

        <div
            class="alert-heading"
            :style="{
              fontSize: `${config.headingSize ?? 42}px`
            }"
        >
          <span
              class="donator"
              :style="{ color: config.donatorColor }"
          >
            {{ alert.donator }}
          </span>

          donated

          <span
              class="amount"
              :style="{ color: config.amountColor }"
          >
            {{ alert.amount }} {{ alert.currency }}
          </span>
        </div>

        <div
            v-if="alert.message"
            class="alert-message"
            :style="{
              color: config.textColor,
              fontSize: `${config.messageSize ?? 32}px`
            }"
        >
          {{ alert.message }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.alert-box {
  width: min(800px, 90vw);
  text-align: center;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.alert-image {
  width: 200px;
  height: auto;
  object-fit: contain;
  margin-bottom: 16px;
}

.alert-heading,
.alert-message {
  text-shadow: 0 2px 8px rgba(0, 0, 0, .8);
}

.alert-heading {
  font-size: 42px;
  font-weight: 700;
  color: white;

  text-shadow: 0 2px 8px rgba(0, 0, 0, .8);
}

.alert-message {
  margin-top: 12px;

  font-size: 32px;
  line-height: 1.4;

  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, .8);

  white-space: pre-wrap;
  word-break: break-word;
}

.overlay {
  position: fixed;
  inset: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  pointer-events: none;
}
</style>