import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import { customAlphabet } from 'nanoid';
import Firebase from './firebase';
import Wallet from './wallet';
import * as Types from '../common/types';
import * as Path from '../common/path';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return `r${nanoid()}`;
}

export default class Client {
  private wallet: Wallet;
  private firebase: Firebase;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }

  public sendRequest = async (
    workerId: string,
    payload: Types.RequestPayloadType,
  ): Promise<string> => {
    const requestId = getRandomRequestId();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getWorkerRequestQueuePath(workerId)}/${requestId}`,
        value: payload,
      },
      address: this.wallet.getAddress(),
    };
    await this.firebase.sendTransaction(txInput);
    return requestId;
  }

  public listenResponseQueue = async (
    callback: Types.EventCallback,
  ) => {
    const address = this.wallet.getAddress();
    const path = Path.getUserResponseQueuePath(address);
    this.firebase.addEventListener(path, callback);
  }

  public getWorkerList = async (
  ): Promise<{[workerId: string]: Types.ContainerSpec}> => {
    // TODO: worker filter option?
    const res = await this.firebase.get(Path.getWorkerListPath());
    return res.val();
  }

  public getWorkerStatus = async (
    workerId: string,
  ): Promise<Types.WorkerStatusParams> => {
    const path = Path.getWorkerStatusPath(workerId);
    const res = await this.firebase.get(path);
    return res.val();
  }
}
