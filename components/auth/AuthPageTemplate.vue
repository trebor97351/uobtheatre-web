<template functional>
  <div class="auth-background h-screen bg-sta-gray">
    <div class="flex items-center justify-center h-full">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-background {
  background-image: url('~@/assets/images/pros-arch-lit.jpg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
}
</style>
