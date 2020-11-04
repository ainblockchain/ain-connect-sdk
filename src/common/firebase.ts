import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import * as constants from './constants';

export type EnvType = 'prod' | 'staging';

export default class Firebase {
  private instance: firebase.app.App;

  constructor(env: EnvType) {
    const firebaseConfig = (env === 'prod') ? constants.PROD_FIREBASE_CONFIG : constants.STAGING_FIREBASE_CONFIG;
    this.instance = firebase.initializeApp(firebaseConfig);
  }

  public getTimestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  public getInstance(): firebase.app.App {
    return this.instance;
  }

  public getFunctions(): firebase.functions.Functions {
    return this.instance.functions();
  }

  public getDatabase(): firebase.database.Database {
    return this.instance.database();
  }
}
