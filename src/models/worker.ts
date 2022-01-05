import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import Connect from './connect';
import * as Types from '../common/types';
import * as Path from '../common/path';

export default class Worker {
  private name: string;
  private appName: string;
  private connect: Connect;

  constructor(
    type: Types.NetworkType,
    mnemonic: string,
    name: string,
    appName: string,
    useFirebase?: boolean,
  ) {
    this.connect = new Connect(type, mnemonic, useFirebase);
    this.name = name;
    this.appName = appName;
  }

  public register = async (
    params: Types.WorkerRegisterParams,
  ) => {
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerRegisterWithPrefixPath(
          this.appName, this.name, address,
        ),
        value: params,
      },
      address,
    };
    await this.connect.sendTransaction(txInput);
  }

  public terminate = async () => {
    /**
     * @TODO It must be modified when migrating to the blockchain
     */
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusWithPrefixPath(
          this.appName, this.name, address,
        ),
        value: {
          workerStatus: 'terminated',
        },
      },
      address,
    };
    await this.connect.sendTransaction(txInput);
  }

  public updateStatus = async (
    status: Types.WorkerStatusParams,
  ) => {
    const timestamp = Date.now();
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusWithPrefixPath(
          this.appName, this.name, address,
        ),
        value: {
          ...status,
          updatedAt: timestamp,
        },
      },
      address,
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
  }

  public listenRequestQueue = (
    callback: Types.RequestEventCallback,
  ) => {
    const path = Path.getWorkerRequestQueuePath(this.name, this.connect.getAddress());
    this.connect.addEventListener(path, async (ref, value) => {
      const requestId = ref.split('/').reverse()[0];
      const responsePath = this.connect.isFirebase()
        ? Path.getUserResponsesPath(value.userAinAddress)
        : Path.getUserResponsesWithPrefixPath(this.appName, value.userAinAddress);
      const responseData = await this.connect.get(`${responsePath}/${requestId}`);
      if (!responseData) {
        callback(ref, value);
      }
    });
  }

  public sendResponse = async (
    requestId: string,
    requestAddress: string,
    value: Types.SendResponseValue,
  ) => {
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: `${Path.getUserResponsesWithPrefixPath(
          this.appName, requestAddress,
        )}/${requestId}`,
        value: {
          ...value,
          workerId: `${this.name}@${this.connect.getAddress()}`,
        },
      },
      address: this.connect.getAddress(),
    };
    await this.connect.sendTransaction(txInput);
  }

  public getRequestQueue = async (
  ) => {
    const address = this.connect.getAddress();
    const path = this.connect.isFirebase()
      ? Path.getWorkerRequestQueuePath(this.name, address)
      : Path.getWorkerRequestQueuePathWithPrefixPath(this.appName, this.name, address);
    const queue = await this.connect.get(path);

    return queue;
  }

  public getConnect = () => this.connect;

  public getWorkerId = () => Path.getWorkerId(this.name, this.connect.getAddress());
}
