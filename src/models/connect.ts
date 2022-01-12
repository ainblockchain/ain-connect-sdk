import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
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

  constructor(
    network: NetworkType | string,
    mnemonic: string,
  ) {
    this.ainJs = new AinJS(Connect.getProviderUrl(network));
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
    this.ainJs.setProvider(Connect.getProviderUrl(network));
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    const result = await this.ainJs.sendTransaction(txInput);
    if (result.result && result.result.code) {
      /* result: { result: { code: 'ERROR_CODE', message: 'ERROR_MESSAGE' } } */
      throw Error(`[code:${result.code}]: ${result.message}`);
    } else {
      /* result: { result: any, tx_hash: 'TX_HASH' } */
      // TODO: transfer TX 같은 경우, balance 부족으로 실패해도 tx hash가 생성된다.
      return result;
    }
  }

  public addEventListener = (
    path: string,
    callback: EventCallback,
  ) => {
    // TODO
  }

  public get = async (path: string) => {
    const res = await this.ainJs.db.ref(path).getValue();
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
