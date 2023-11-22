const { expect } = require('chai');
const proxyquire = require('proxyquire');
// const sinon = require('sinon');

describe('helpers', () => {
  const factory = proxyquire('./helpers', {});
  it('shouldExit', async () => {
    expect(factory.shouldExit('Q')).to.be.true;
    expect(factory.shouldExit('q')).to.be.true;
    expect(factory.shouldExit('Exit')).to.be.true;
  });
  // beforeEach(() => {
  // });
  // afterEach(() => {
  // });
});
