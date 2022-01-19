import { GetOptions, TransactionInput } from '@ainblockchain/ain-js/lib/types';
import { customAlphabet } from 'nanoid';
import Connect from './connect';
import * as Types from '../common/types';
import * as Path from '../common/path';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return `r${nanoid()}`;
}

export default class Client {
  private appName: string;
  private connect: Connect;

  constructor(
    type: Types.NetworkType,
    mnemonic: string,
    appName: string,
  ) {
    this.connect = new Connect(type, mnemonic);
    this.appName = appName;
  }

  public sendRequest = async (
    name: string,
    address: string,
    value: Types.SendRequestValue,
  ): Promise<string> => {
    const timestamp = Date.now();
    const requestId = getRandomRequestId();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getWorkerRequestQueuePath(
          this.appName, name, address,
        )}/${requestId}`,
        value: {
          ...value,
          userAinAddress: this.connect.getAddress(),
          createdAt: timestamp,
        },
      },
      address: this.connect.getAddress(),
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
    return requestId;
  }

  public listenResponseQueue = (
    callback: Types.ResponseEventCallback,
  ) => {
    const address = this.connect.getAddress();
    const path = Path.getUserResponsesPath(this.appName, address);
    this.connect.addEventListener(path, callback);
  }

  public getWorkerList = async (
    getOptions?: GetOptions,
  ): Promise<Types.WorkerInfo> => {
    // TODO: worker filter option?
    const path = Path.getWorkerListPath(this.appName);
    const res = await this.connect.get(path, getOptions);
    return res;
  }

  public getWorkerStatus = async (
    name: string,
    address: string,
    getOptions?: GetOptions,
  ): Promise<Types.WorkerStatusParams> => {
    const path = Path.getWorkerStatusPath(this.appName, name, address);
    const res = await this.connect.get(path, getOptions);
    return res;
  }

  public getContainerStatus = async (
    name: string,
    address: string,
    containerId: string,
    getOptions?: GetOptions,
  ): Promise<Types.WorkerStatusParams> => {
    const path = Path.getContainerStatusPath(this.appName, name, address, containerId);
    const res = await this.connect.get(path, getOptions);
    return res;
  }

  public getConnect = () => this.connect;
}
