import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import * as constants from './constants';

type EnvType = 'prod' | 'staging';

export default class Firebase {
  private instance: firebase.app.App;

  constructor(env: EnvType) {
    const firebaseConfig = (env === 'prod') ? constants.PROD_FIREBASE_CONFIG : constants.STAGING_FIREBASE_CONFIG;
    this.instance = firebase.initializeApp(firebaseConfig);
  }

  public getInstance() {
    return this.instance;
  }
}