import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import Connect from './connect';
import * as Types from '../common/types';
import * as Path from '../common/path';

export default class Worker {
  private name: string;
  private connect: Connect;

  constructor(type: Types.NetworkType, mnemonic: string, name: string) {
    this.connect = new Connect(type, mnemonic);
    this.name = name;
  }

  public register = async (
    params: Types.WorkerRegisterParams,
  ) => {
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerRegisterWithPrefixPath(this.name, this.connect.getAddress()),
        value: params,
      },
      address: this.connect.getAddress(),
    };
    await this.connect.sendTransaction(txInput);
  }

  public updateStatus = async (
    status: Types.WorkerStatusParams,
  ) => {
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusWithPrefixPath(this.name, address),
        value: status,
      },
      address,
    };
    await this.connect.sendTransaction(txInput);
  }

  public listenRequestQueue = (
    callback: Types.RequestEventCallback,
  ) => {
    const path = Path.getWorkerRequestQueuePath(this.name, this.connect.getAddress());
    this.connect.addEventListener(path, callback);
  }

  public sendResponse = async (
    requestId: string,
    requestAddress: string,
    value: Types.SendResponseValue,
  ) => {
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getUserResponseQueueWithPrefixPath(requestAddress)}/${requestId}`,
        value: {
          ...value,
          workerId: `${this.name}@${this.connect.getAddress()}`,
        },
      },
      address: this.connect.getAddress(),
    };
    await this.connect.sendTransaction(txInput);
  }

  public getConnect = () => this.connect;
}
