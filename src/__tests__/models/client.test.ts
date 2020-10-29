import Client from '../../models/client';

let client: Client;
const testMnemonic = 'dog drink veteran health old expose salute month elegant horror orbit thank';

describe('client', () => {
  beforeAll(async () => {
    client = new Client(testMnemonic, 'staging');
  });

  it('get cluster list', async () => {
    const res = await client.getClusterList({
      nodeInfo: {
        cpu: 100,
        memory: 1000,
        gpu: { v100: 1 },
      },
    });
    expect(res.length).toEqual(1);
  });
});
