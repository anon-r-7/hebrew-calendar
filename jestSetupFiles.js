// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// jestSetupFiles.js or any name you choose
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

global.dataLayer = {
  push: jest.fn()
}
