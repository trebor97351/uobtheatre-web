<template>
  <a
    :class="{ 'cursor-pointer': !disabled }"
    @click="$emit('click')"
    @keypress="
      (e) => {
        e.target.click()
      }
    "
  >
    <slot></slot>
  </a>
</template>

<script>
export default {
  name: 'ClickableLink',
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
  },
}
</script>
