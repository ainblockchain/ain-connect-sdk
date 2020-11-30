import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import * as constants from './constants';
import * as Types from './types';

export default class Firebase {
  private instance: firebase.app.App;

  constructor(env: Types.EnvType, config?: Types.FirebaseConfig) {
    let firebaseConfig;
    if (config) {
      firebaseConfig = config;
    } else {
      firebaseConfig = (env === 'prod')
        ? constants.PROD_FIREBASE_CONFIG : constants.STAGING_FIREBASE_CONFIG;
    }
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
