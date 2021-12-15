import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
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
    useFirebase?: boolean,
  ) {
    this.connect = new Connect(type, mnemonic, useFirebase);
    this.appName = appName;
  }

  public sendRequest = async (
    name: string,
    address: string,
    value: Types.SendRequestValue,
  ): Promise<string> => {
    const requestId = getRandomRequestId();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getWorkerRequestQueuePathWithPrefixPath(
          this.appName, name, address,
        )}/${requestId}`,
        value: {
          ...value,
          userAinAddress: this.connect.getAddress(),
        },
      },
      address: this.connect.getAddress(),
    };
    await this.connect.sendTransaction(txInput);
    return requestId;
  }

  public listenResponseQueue = (
    callback: Types.ResponseEventCallback,
  ) => {
    const address = this.connect.getAddress();
    const path = Path.getUserResponsesPath(address);
    this.connect.addEventListener(path, callback);
  }

  public getWorkerList = async (
  ): Promise<Types.WorkerInfo> => {
    // TODO: worker filter option?
    const res = await this.connect.get(Path.WORKER_LIST_PATH);
    return res;
  }

  public getWorkerStatus = async (
    name: string,
    address: string,
  ): Promise<Types.WorkerStatusParams> => {
    const path = Path.getWorkerStatusPath(name, address);
    const res = await this.connect.get(path);
    return res;
  }

  public getContainerStatus = async (
    name: string,
    address: string,
    containerId: string,
  ): Promise<Types.WorkerStatusParams> => {
    const path = Path.getContainerStatusPath(name, address, containerId);
    const res = await this.connect.get(path);
    return res;
  }

  public getConnect = () => this.connect;
}
