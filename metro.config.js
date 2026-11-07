// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Thư mục của các bản app khác nằm chung chỗ với project Expo này.
 * Không loại ra thì Metro phải quét và theo dõi vài chục nghìn tệp không liên quan.
 */
const THU_MUC_BO_QUA = ['app-chuong', 'app-windows'];

const thoatKyTu = (chuoi) => chuoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const danhSachChan = THU_MUC_BO_QUA.map(
  (ten) => new RegExp(`^${thoatKyTu(path.resolve(__dirname, ten))}\\${path.sep}.*$`)
);

const chanSanCo = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(chanSanCo) ? chanSanCo : chanSanCo ? [chanSanCo] : []),
  ...danhSachChan,
];

module.exports = config;
