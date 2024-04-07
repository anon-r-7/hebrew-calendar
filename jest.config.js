const path = require('path');
const fs = require('fs');

const createJestModuleNameMapper = (packageRoot) => {
  const srcDir = path.join(__dirname, 'packages', packageRoot, 'src');
  const dirs = fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return dirs.reduce((acc, dir) => {
    acc[`^${dir}$`] = `<rootDir>/packages/${packageRoot}/src/${dir}`;
    return acc;
  }, {});
};

function createConfig({ name, path }) {
  return {
    displayName: name,
    setupFilesAfterEnv: [`<rootDir>/jestSetupFiles.js`],
    testMatch: [
      `<rootDir>/packages/${path}/src/**/__tests__/**/*.{js,ts}`,
      `<rootDir>/packages/${path}/src/**/*.{spec,test}.{js,ts}`
    ],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
      ...createJestModuleNameMapper(path),
      '\\.(css|less|scss)$': 'identity-obj-proxy'
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
    testTimeout: 20000,
    transform: {
      '^.+\\.(js|ts)$': 'babel-jest',
      '.+\\.(png|jpg|svg)$': 'jest-transform-stub'
    },
  }
}

const config = {
  projects: [
    createConfig({ name: 'api', path: 'api' }),
    createConfig({ name: 'ui', path: 'ui' })
  ]
}

module.exports = config;
