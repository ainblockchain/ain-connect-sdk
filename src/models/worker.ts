import { TransactionInput } from '@ainblockchain/ain-js/lib/types';

import Wallet from './wallet';
import Firebase from './firebase';
import * as Types from '../common/types';
import * as error from '../common/error';
import * as Path from '../common/path';

export default class Worker {
  private wallet: Wallet;
  private firebase: Firebase;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }

  public register = async (
    name: string,
    params: Types.WorkerRegisterParams
  ) => {
    const { ainAddress, ethAddress, containerSpec, labels } = params;
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerRegisterPath(name, ainAddress),
        value: params,
      },
      address: this.wallet.getAddress(),
    }
    await this.firebase.sendTransaction(txInput);
  }

  public updateStatus = async (
    name: string,
    status: Types.WorkerStatusParams,
  ) => {
    const workerId = `${name}@${this.wallet.getAddress}`;
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusPath(workerId),
        value: status,
      },
      address: this.wallet.getAddress(),
    }
    await this.firebase.sendTransaction(txInput);
  }

  public listenRequestQueue = async (
    name: string,
    callback: Types.EventCallback,
  ) => {
    const workerId = `${name}@${this.wallet.getAddress}`;
    this.firebase.addEventListener(workerId, callback);
  }
}
