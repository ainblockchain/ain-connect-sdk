import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import { mnemonicToSeedSync } from 'bip39';
import * as ainUtil from '@ainblockchain/ain-util';
import AinJS from '@ainblockchain/ain-js';
import HDKey from 'hdkey';

import * as Const from '../common/constants';
import * as Types from '../common/types';

export default class Connect {
  private app: firebase.app.App;
  private wallet: HDKey;
  private mnemonic: string;
  private privateKey: string;
  private address: string;
  private ainJs: AinJS;

  static getWalletInfo(mnemonic: string) {
    const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
    const wallet = key.derive("m/44'/412'/0'/0/0"); /* default wallet address for AIN */
    return {
      wallet,
      privateKey: `0x${wallet.privateKey.toString('hex')}`,
      address: ainUtil.toChecksumAddress(`0x${ainUtil.pubToAddress(wallet.publicKey, true).toString('hex')}`),
    };
  }

  constructor(type: Types.NetworkType, mnemonic: string) {
    const firebaseConfig = (type === 'MAINNET')
      ? Const.MAINNET_FIREBASE_CONFIG
      : Const.TESTNET_FIREBASE_CONFIG;
    if (!firebase.apps.length) {
      this.app = firebase.initializeApp(firebaseConfig);
    } else {
      this.app = firebase.app();
    }
    this.ainJs = new AinJS(type === 'MAINNET'
      ? Const.MAINNET_PROVIDER_URL : Const.TESTNET_PROVIDER_URL);
    const walletInfo = Connect.getWalletInfo(mnemonic);
    this.wallet = walletInfo.wallet;
    this.mnemonic = mnemonic;
    this.privateKey = walletInfo.privateKey;
    this.address = walletInfo.address;

    this.ainJs.wallet.addFromHDWallet(mnemonic);
    this.ainJs.wallet.setDefaultAccount(this.address);
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    const txBody = await this.ainJs.buildTransactionBody(txInput);
    const signature = this.ainJs.wallet.signTransaction(txBody);

    const result = await this.app.functions()
      .httpsCallable('sendSignedTransaction')({
        signature,
        tx_body: txBody,
      });

    if (!result.data) {
      throw Error(`[code:${result.data.code}]: ${result.data.error_message}`);
    }
  }

  public addEventListener = (
    path: string,
    callback: Types.EventCallback,
  ) => {
    // TODO: 처리된 event들에 대해선 callback 발생하지 않도록
    this.app.database().ref(path).on('child_added',
      async (snap) => {
        await callback(`${path}/${snap.key}`, snap.val());
      });
  }

  public get = async (path: string) => {
    const snap = await this.app.database().ref(path).once('value');
    return snap.val();
  }

  public getWallet = () => this.wallet;
  public getMnemonic = () => this.mnemonic;
  public getPrivateKey = () => this.privateKey;
  public getAddress = () => this.address;
  public getAinJs = () => this.ainJs;
}
