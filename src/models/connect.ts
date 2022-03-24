import { GetOptions, TransactionInput } from '@ainblockchain/ain-js/lib/types';
import { mnemonicToSeedSync } from 'bip39';
import {
  toChecksumAddress,
  pubToAddress,
} from '@ainblockchain/ain-util';
import AinJS from '@ainblockchain/ain-js';
import HDKey from 'hdkey';
import validUrl from 'valid-url';
import * as Const from '../common/constants';
import { NetworkType, EventCallback } from '../common/types';

export default class Connect {
  private wallet: HDKey;
  private mnemonic: string;
  private privateKey: string;
  private address: string;
  private ainJs: AinJS;

  static getWalletInfo(mnemonic: string, index: number) {
    const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
    const wallet = key.derive(`m/44'/412'/0'/0/${index}`);
    return {
      wallet,
      privateKey: `0x${wallet.privateKey.toString('hex')}`,
      address: toChecksumAddress(
        `0x${pubToAddress(wallet.publicKey, true).toString('hex')}`,
      ),
    };
  }

  static getProviderUrl(
    network: NetworkType | string,
  ): string {
    switch (network) {
      case NetworkType.MAINNET:
      case NetworkType.TESTNET:
      case NetworkType.DEVNET:
        return Const.PROVIDER_URL[network];
      default:
        if (validUrl.isUri(network)) {
          // TODO: Can we check this is valid blockchain URL?
          return network;
        }
        throw new Error(`Wrong network: ${network}`);
    }
  }

  static getChainId(network: NetworkType | string): number {
    switch (network) {
      case NetworkType.MAINNET:
        return 1;
      case NetworkType.DEVNET:
        return 2;
      case NetworkType.TESTNET:
      default:
        return 0;
    }
  }

  constructor(
    network: NetworkType | string,
    mnemonic: string,
  ) {
    this.ainJs = new AinJS(
      Connect.getProviderUrl(network),
      Connect.getChainId(network),
    );
    this.mnemonic = mnemonic;
    this.ainJs.wallet.addFromHDWallet(mnemonic);

    this.changeNetwork(network);
    this.changeAccount(0);
  }

  public changeAccount = (index: number) => {
    const walletInfo = Connect.getWalletInfo(this.mnemonic, index);
    this.wallet = walletInfo.wallet;
    this.privateKey = walletInfo.privateKey;
    this.address = walletInfo.address;

    this.ainJs.wallet.setDefaultAccount(this.address);
  }

  public changeNetwork = (network: NetworkType | string) => {
    this.ainJs.setProvider(
      Connect.getProviderUrl(network),
      Connect.getChainId(network),
    );
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    const res = await this.ainJs.sendTransaction(txInput);
    if (res.result) {
      if (res.result.code) {
        /* res: { result: { code: 'ERROR_CODE', message: 'ERROR_MESSAGE' } } */
        throw Error(`[code:${res.result.code}]: ${res.result.message}`);
      } else if (res.result.result_list) {
        Object.values(res.result.result_list).forEach((val: any) => {
          if (val.code) {
            /* res: { result: { result_list: { 0: { ... } } } } */
            throw Error(`[code:${val.code}]: ${val.message}`);
          }
        });
      }
    }
    /* res: { result: any, tx_hash: 'TX_HASH' } */
    // TODO: transfer TX 같은 경우, balance 부족으로 실패해도 tx hash가 생성된다.
    return res;
  }

  public addEventListener = (
    path: string,
    callback: EventCallback,
  ) => {
    // TODO
  }

  public get = async (path: string, getOptions?: GetOptions) => {
    const res = await this.ainJs.db.ref().getValue(path, getOptions);
    if (res) {
      return res;
    }
    return null;
  }

  public set = async (path: string, value: any) => {
    await this.ainJs.db.ref(path).setValue({ value });
  }

  public getWallet = () => this.wallet;
  public getMnemonic = () => this.mnemonic;
  public getPrivateKey = () => this.privateKey;
  public getAddress = () => this.address;
  public getAinJs = () => this.ainJs;
}
