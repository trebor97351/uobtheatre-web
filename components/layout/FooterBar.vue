<template>
  <div class="bg-sta-gray-light">
    <div class="container flex flex-wrap p-4 md:my-2">
      <div class="flex items-center w-full md:w-1/3 lg:w-2/5">
        <nav class="w-full">
          <ul class="flex justify-evenly space-x-2 md:block md:space-x-0">
            <li
              v-for="(item, index) in navItems"
              :key="index"
              class="flex mt-2 text-center text-white md:block md:text-left"
            >
              <component
                :is="item[0].startsWith('/') ? 'NuxtLink' : 'a'"
                :to="item[0]"
                :href="item[0]"
              >
                <span class="hover:text-sta-orange">{{ item[1] }}</span>
              </component>
            </li>
          </ul>
        </nav>
      </div>
      <div class="flex flex-1 flex-wrap items-center mt-4 w-full md:mt-0">
        <div class="w-1/2 h-16 md:w-32 md:h-auto">
          <a href="https://bristolsta.com" target="_blank">
            <img
              src="@/assets/images/sta-logo-white.png"
              class="mx-auto max-h-full"
              style="max-width: 100px"
              alt="Stage Technicians' Association Logo"
            />
          </a>
        </div>
        <div class="w-1/2 h-16 md:w-32 md:h-auto">
          <a href="https://bristolsu.org.uk" target="_blank">
            <img
              src="@/assets/images/bristol-su-logo.png"
              class="mx-auto max-h-full"
              style="max-width: 100px"
              alt="Bristol SU Balloon Logo"
            />
          </a>
        </div>

        <div
          class="
            flex-1
            mt-2
            text-center text-white
            md:ml-12 md:mt-0 md:text-left
          "
        >
          <p class="mb-2 md:mb-4">
            &copy; Bristol Stage Technicians' Association
            {{ new Date().getFullYear() }}
          </p>
          <p>This website is built and run by Bristol SU student volunteers.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      navItems: [
        ['/privacy', 'Privacy Policy'],
        ['/terms', 'Terms & Conditions'],
        [
          'mailto:support@uobtheatre.com?subject=Request For Support',
          'Contact Us',
        ],
      ],
    }
  },
}
</script>
