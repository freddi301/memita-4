// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.requireCycleIgnorePatterns.push(/^components\/.*/);

config.resolver.unstable_enablePackageExports = false; // for lingui

module.exports = config;
