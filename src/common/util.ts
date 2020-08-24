import * as ainUtil from '@ainblockchain/ain-util';

export function signatureMessage(payload: object,
  publicKey: string, secretKey: string) {
  const fields: ainUtil.Field[] = [];
  Object.keys(payload).forEach((name) => {
    fields.push({
      name,
      default: Buffer.from([]),
    });
  });
  const signature = ainUtil.ecSignMessage(
    ainUtil.serialize(payload, fields), ainUtil.toBuffer(secretKey),
  );
  return {
    payload,
    signature,
    fields,
    address: publicKey,
  };
}
