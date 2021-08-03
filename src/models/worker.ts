import Wallet from './wallet';
import Firebase from './firebase';
import * as Types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;
  private firebase: Firebase;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }
}
