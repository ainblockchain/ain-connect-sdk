import * as https from 'https';
import * as fs from 'fs';
import * as GcloudStorage from '@google-cloud/storage';
import Connect from './connect';
import * as Types from '../common/types';
import * as Const from '../common/constants';

// Polyfills required for Firebase
// eslint-disable-next-line import/no-unresolved
(global as any).XMLHttpRequest = require('xhr2');

export default class Storage {
  private connect: Connect;

  private storageBucket: string;

  private name: string;

  constructor(type: Types.NetworkType, mnemonic: string, name: string, port?: number) {
    this.connect = new Connect(type, mnemonic, port);
    this.name = name;
    this.storageBucket = Const.FIREBASE_CONFIG[type].storageBucket;
  }

  /**
   * signIn using Custom Token.
   * GOOGLE_APPLICATION_CREDENTIALS is the path about the Google service account related file
   */
  async signIn() {
    const storage = new GcloudStorage.Storage();
    const results = await storage.getBuckets();
    const [buckets] = results;
    let isValid = false;
    buckets.forEach((bucket) => {
      if (bucket.name === this.storageBucket) {
        isValid = true;
      }
    });
    if (!isValid) {
      throw new Error('Could not load the default credentials');
    }

    const txInput: any = {
      operation: {
        type: 'GET_AUTH_TOKEN',
        ref: '',
        value: {
          params: {
            id: `${this.name}@${this.connect.getAddress()}`,
          },
        },
      },
      address: this.connect.getAddress(),
      nonce: -1,
      parent_tx_hash: null,
    };

    const txBody = await this.connect.getAinJs().buildTransactionBody(txInput);
    const signature = this.connect.getAinJs().wallet.signTransaction(txBody);

    const result = await this.connect.getApp().functions()
      .httpsCallable('getWorkerAuthToken')({
        signature,
        tx_body: txBody,
      });

    await this.connect.getApp().auth().signInWithCustomToken(result.data.customToken);
  }

  /**
   * download file on Firebase storage.
   */
  async downloadFile(downloadLink: string, savePath: string) {
    const url = await this.connect.getApp().storage().ref(downloadLink).getDownloadURL();
    const file = fs.createWriteStream(savePath);

    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error('Failed to request'));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve('');
        });

        file.on('error', (err) => {
          fs.unlink(savePath, () => {});
          reject(err);
        });
      });
      request.on('error', (err) => {
        fs.unlink(savePath, () => {});
        reject(err);
      });
    });
  }

  /**
   * Upload File to Firebase Storage.
   */
  async uploadFile(
    uploadPath: string,
    filePath: string,
    onUploadProgress?: (snapshot: any) => Promise<void>,
  ) {
    const storage = new GcloudStorage.Storage();
    const myBucket = storage.bucket(this.storageBucket);
    await myBucket.upload(filePath, {
      destination: uploadPath,
      onUploadProgress,
    });
  }
}
