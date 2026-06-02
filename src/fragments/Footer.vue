<template>
  <footer
      class="flex flex-between lg:flex-row flex-col lg:gap-0 gap-6 w-full p-4 text-base-content/70"
  >
    <div class="w-full pl-3 flex gap-3">
      <p>
        &copy; {{ new Date().getFullYear() }} MyManao. PayMoi by MyManao is licensed under the GNU Affero General Public
        License v3.0
      </p>
    </div>
    <div class="w-full pr-6 flex gap-3 items-center lg:justify-end justify-center">
      <RouterLink to="/terms">Terms of Service</RouterLink>
      <p>•</p>
      <RouterLink to="/privacy">Privacy Policy</RouterLink>
      <p>•</p>
      <a href="https://github.com/orgs/mymanao/repositories" target="_blank">View Source</a>
    </div>
  </footer>
</template>