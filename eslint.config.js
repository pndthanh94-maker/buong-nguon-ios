// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // app-chuong và app-windows là hai dự án riêng nằm chung thư mục,
    // có tooling và quy ước của chúng — không soi bằng cấu hình của app Expo này.
    ignores: ['dist/*', '.expo/*', 'app-chuong/*', 'app-windows/*'],
  },
]);
