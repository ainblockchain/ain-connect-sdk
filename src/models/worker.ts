import { TransactionInput } from '@ainblockchain/ain-js/lib/types';

import Wallet from './wallet';
import Firebase from './firebase';
import * as Types from '../common/types';
import * as error from '../common/error';
import * as Path from '../common/path';

export default class Worker {
  private name: string;
  private wallet: Wallet;
  private firebase: Firebase;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }

  public register = async (
    name: string,
    params: Types.WorkerRegisterParams,
  ) => {
    this.name = name;
    const {
      ainAddress, ethAddress, containerSpec, labels,
    } = params;
    if (ainAddress !== this.wallet.getAddress()) {
      throw new Error('Address not matched');
    }

    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerRegisterPath(name, ainAddress),
        value: params,
      },
      address: this.wallet.getAddress(),
    };
    await this.firebase.sendTransaction(txInput);
  }

  public updateStatus = async (
    status: Types.WorkerStatusParams,
  ) => {
    const workerId = `${this.name}@${this.wallet.getAddress()}`;
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusPath(workerId),
        value: status,
      },
      address: this.wallet.getAddress(),
    };
    await this.firebase.sendTransaction(txInput);
  }

  public listenRequestQueue = async (
    callback: Types.EventCallback,
  ) => {
    const workerId = `${this.name}@${this.wallet.getAddress()}`;
    const path = Path.getWorkerRequestQueuePath(workerId);
    this.firebase.addEventListener(path, callback);
  }

  public sendResponse = async (
    requestId: string,
    requestAddress: string,
    response: Types.WorkerResponseType,
  ) => {
    const workerId = `${this.name}@${this.wallet.getAddress()}`;
    // XXX: workerId in payload?
    response['workerId'] = workerId;
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getUserResponseQueuePath(requestAddress)}/${requestId}`,
        value: response,
      },
      address: this.wallet.getAddress(),
    };
    await this.firebase.sendTransaction(txInput);
  }
}
