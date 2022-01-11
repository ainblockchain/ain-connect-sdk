import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import Connect from './connect';
import * as Types from '../common/types';
import * as Path from '../common/path';

export default class Worker {
  private name: string;
  private appName: string;
  private connect: Connect;

  constructor(
    network: Types.NetworkType | string,
    mnemonic: string,
    name: string,
    appName: string,
  ) {
    this.connect = new Connect(network, mnemonic);
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
        ref: Path.getWorkerRegisterPath(
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
        ref: Path.getWorkerStatusPath(
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
        ref: Path.getWorkerStatusPath(
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
    const path = Path.getWorkerRequestQueuePath(
      this.appName, this.name, this.connect.getAddress(),
    );
    this.connect.addEventListener(path, async (ref, value) => {
      const requestId = ref.split('/').reverse()[0];
      const responsePath = Path.getUserResponsesPath(this.appName, value.userAinAddress);
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
    const timestamp = Date.now();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET',
        op_list: [{
          type: 'SET_VALUE',
          ref: `${Path.getUserResponsesPath(
            this.appName, requestAddress,
          )}/${requestId}`,
          value: {
            ...value,
            workerId: `${this.name}@${this.connect.getAddress()}`,
            createdAt: timestamp,
          },
        }, {
          type: 'SET_VALUE',
          ref: `${Path.getWorkerRequestQueuePath(
            this.appName, this.name, requestAddress,
          )}/${requestId}`,
          value: null,
        }],
      },
      address: this.connect.getAddress(),
    };
    await this.connect.sendTransaction(txInput);
  }

  public getRequestQueue = async (
  ) => {
    const address = this.connect.getAddress();
    const path = Path.getWorkerRequestQueuePath(
      this.appName, this.name, address,
    );
    const queue = await this.connect.get(path);

    return queue;
  }

  public getConnect = () => this.connect;

  public getWorkerId = () => Path.getWorkerId(this.name, this.connect.getAddress());
}
