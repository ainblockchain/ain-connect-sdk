import { customAlphabet } from 'nanoid';
import Firebase from './firebase';
import Wallet from './wallet';
import * as Types from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;
  private firebase: Firebase;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }
}
