import Connect from '../../models/connect';
import { NetworkType } from '../../common/types';

const TEST_MNEMONIC = 'online congress divert fee canal snake make almost tube rent color jewel';

describe('connect', () => {
  it('init', () => expect(true).toEqual(true));

  describe('FIREBASE TEST', () => {
    let connect: Connect;
    beforeAll(() => {
      connect = new Connect(NetworkType.DEVNET, TEST_MNEMONIC, true);
    });

    it('change network for firebase connect', () => {
      connect.changeNetwork(NetworkType.TESTNET);
      expect(connect.getApp().name).toEqual(NetworkType.TESTNET);
    });
  });

  describe('BLOCKCHAIN TEST', () => {
    let connect: Connect;
    beforeAll(() => {
      connect = new Connect(NetworkType.TESTNET, TEST_MNEMONIC);
    });

    it('get value from non-exist path', async () => {
      try {
        const res = await connect.get('/this/is/not/exist/path');
        expect(res).toBeNull();
      } catch (e) {
        fail(e);
      }
    });

    it('get value from exist path', async () => {
      try {
        const res = await connect.get('/token');
        expect(res).not.toBeNull();
      } catch (e) {
        fail(e);
      }
    });
  });
});
