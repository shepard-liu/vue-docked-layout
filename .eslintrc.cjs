/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  "root": true,
  "extends": [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/eslint-config-prettier"
  ],
  "rules": {
    "vue/html-self-closing": "off",
    "vue/valid-v-for": "off",
    "vue/no-unused-vars": "off"
  }
}
