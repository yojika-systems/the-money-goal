import{createPublicKey,publicEncrypt,constants}from'node:crypto';
export function encryptStateKey(key,pem){
 if(!/^[a-f0-9]{64}$/i.test(key??''))throw new Error('State key is missing or malformed');
 if(!pem?.includes('BEGIN PUBLIC KEY')||pem.includes('PRIVATE KEY'))throw new Error('Provide only an RSA public key');
 const publicKey=createPublicKey(pem);if(publicKey.asymmetricKeyType!=='rsa'||publicKey.asymmetricKeyDetails?.modulusLength<3072)throw new Error('An RSA public key of at least 3072 bits is required');
 return publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(key));
}
const credentialKeys=new Set(['codexAuth','tokens','access_token','refresh_token','id_token','OPENAI_API_KEY','STATE_ENCRYPTION_KEY','private_key']);
export function redactCredentials(value){
 if(Array.isArray(value))return value.map(redactCredentials);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,credentialKeys.has(key)?'[credential redacted]':redactCredentials(item)]));
 return value;
}
