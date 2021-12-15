import Connect from '../../models/connect';
import { NetworkType } from '../../common/types';

const TEST_MNEMONIC = 'online congress divert fee canal snake make almost tube rent color jewel';

describe('connect', () => {
  it('init', () => expect(true).toEqual(true));

  it('change network for firebase connect', () => {
    const connect = new Connect(NetworkType.MAINNET, TEST_MNEMONIC, true);
    expect(connect.getApp().name).toEqual(NetworkType.MAINNET);
    connect.changeNetwork(NetworkType.TESTNET);
    expect(connect.getApp().name).toEqual(NetworkType.TESTNET);
  });
});
