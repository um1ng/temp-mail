// 端到端加密工具库
import CryptoJS from 'crypto-js';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// 加密算法枚举
export enum EncryptionAlgorithm {
  AES_256_GCM = 'AES_256_GCM',
  CHACHA20_POLY1305 = 'CHACHA20_POLY1305',
  RSA_OAEP = 'RSA_OAEP'
}

// 密钥类型
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptionResult {
  encryptedData: string;
  algorithm: EncryptionAlgorithm;
  nonce?: string;
  salt?: string;
  keyId?: string;
}

export interface DecryptionOptions {
  privateKey?: string;
  password?: string;
  keyId?: string;
}

/**
 * 生成强密钥对（用于非对称加密）
 */
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();
  
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey)
  };
}

/**
 * 生成随机盐值
 */
export function generateSalt(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * 生成随机密钥
 */
export function generateSecretKey(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * 从密码派生密钥（PBKDF2）
 */
export function deriveKeyFromPassword(password: string, salt: string, iterations: number = 100000): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: iterations
  }).toString();
}

/**
 * AES-256-GCM 加密
 */
export function encryptAES(data: string, key: string, nonce?: string): EncryptionResult {
  const actualNonce = nonce || CryptoJS.lib.WordArray.random(96/8).toString();
  const salt = generateSalt();
  
  // 使用密钥和盐值进行加密
  const derivedKey = CryptoJS.PBKDF2(key, salt, { keySize: 256/32, iterations: 1000 });
  
  const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.Pkcs7,
    iv: CryptoJS.enc.Hex.parse(actualNonce)
  });

  return {
    encryptedData: encrypted.toString(),
    algorithm: EncryptionAlgorithm.AES_256_GCM,
    nonce: actualNonce,
    salt: salt
  };
}

/**
 * AES-256-GCM 解密
 */
export function decryptAES(encryptedResult: EncryptionResult, key: string): string {
  if (!encryptedResult.nonce || !encryptedResult.salt) {
    throw new Error('Missing nonce or salt for decryption');
  }

  const derivedKey = CryptoJS.PBKDF2(key, encryptedResult.salt, { keySize: 256/32, iterations: 1000 });
  
  const decrypted = CryptoJS.AES.decrypt(encryptedResult.encryptedData, derivedKey, {
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.Pkcs7,
    iv: CryptoJS.enc.Hex.parse(encryptedResult.nonce)
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * ChaCha20-Poly1305 加密（使用 TweetNaCl）
 */
export function encryptChaCha20(data: string, key: string): EncryptionResult {
  const nonce = nacl.randomBytes(24);
  const keyBytes = naclUtil.decodeUTF8(key.padEnd(32, '0').substring(0, 32));
  const dataBytes = naclUtil.decodeUTF8(data);
  
  const encrypted = nacl.secretbox(dataBytes, nonce, keyBytes);
  
  return {
    encryptedData: naclUtil.encodeBase64(encrypted),
    algorithm: EncryptionAlgorithm.CHACHA20_POLY1305,
    nonce: naclUtil.encodeBase64(nonce)
  };
}

/**
 * ChaCha20-Poly1305 解密
 */
export function decryptChaCha20(encryptedResult: EncryptionResult, key: string): string {
  if (!encryptedResult.nonce) {
    throw new Error('Missing nonce for ChaCha20 decryption');
  }

  const nonce = naclUtil.decodeBase64(encryptedResult.nonce);
  const keyBytes = naclUtil.decodeUTF8(key.padEnd(32, '0').substring(0, 32));
  const encryptedBytes = naclUtil.decodeBase64(encryptedResult.encryptedData);
  
  const decrypted = nacl.secretbox.open(encryptedBytes, nonce, keyBytes);
  
  if (!decrypted) {
    throw new Error('Decryption failed');
  }
  
  return naclUtil.encodeUTF8(decrypted);
}

/**
 * 非对称加密（Box - Curve25519）
 */
export function encryptAsymmetric(data: string, publicKey: string, privateKey: string): EncryptionResult {
  const nonce = nacl.randomBytes(24);
  const pubKeyBytes = naclUtil.decodeBase64(publicKey);
  const privKeyBytes = naclUtil.decodeBase64(privateKey);
  const dataBytes = naclUtil.decodeUTF8(data);
  
  const encrypted = nacl.box(dataBytes, nonce, pubKeyBytes, privKeyBytes);
  
  return {
    encryptedData: naclUtil.encodeBase64(encrypted),
    algorithm: EncryptionAlgorithm.RSA_OAEP,
    nonce: naclUtil.encodeBase64(nonce)
  };
}

/**
 * 非对称解密
 */
export function decryptAsymmetric(encryptedResult: EncryptionResult, publicKey: string, privateKey: string): string {
  if (!encryptedResult.nonce) {
    throw new Error('Missing nonce for asymmetric decryption');
  }

  const nonce = naclUtil.decodeBase64(encryptedResult.nonce);
  const pubKeyBytes = naclUtil.decodeBase64(publicKey);
  const privKeyBytes = naclUtil.decodeBase64(privateKey);
  const encryptedBytes = naclUtil.decodeBase64(encryptedResult.encryptedData);
  
  const decrypted = nacl.box.open(encryptedBytes, nonce, pubKeyBytes, privKeyBytes);
  
  if (!decrypted) {
    throw new Error('Asymmetric decryption failed');
  }
  
  return naclUtil.encodeUTF8(decrypted);
}

/**
 * 统一加密接口
 */
export function encrypt(
  data: string, 
  algorithm: EncryptionAlgorithm, 
  key: string, 
  options?: { publicKey?: string; privateKey?: string }
): EncryptionResult {
  switch (algorithm) {
    case EncryptionAlgorithm.AES_256_GCM:
      return encryptAES(data, key);
    
    case EncryptionAlgorithm.CHACHA20_POLY1305:
      return encryptChaCha20(data, key);
    
    case EncryptionAlgorithm.RSA_OAEP:
      if (!options?.publicKey || !options?.privateKey) {
        throw new Error('Public and private keys required for asymmetric encryption');
      }
      return encryptAsymmetric(data, options.publicKey, options.privateKey);
    
    default:
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
  }
}

/**
 * 统一解密接口
 */
export function decrypt(
  encryptedResult: EncryptionResult, 
  options: DecryptionOptions
): string {
  switch (encryptedResult.algorithm) {
    case EncryptionAlgorithm.AES_256_GCM:
      if (!options.password) {
        throw new Error('Password required for AES decryption');
      }
      return decryptAES(encryptedResult, options.password);
    
    case EncryptionAlgorithm.CHACHA20_POLY1305:
      if (!options.password) {
        throw new Error('Password required for ChaCha20 decryption');
      }
      return decryptChaCha20(encryptedResult, options.password);
    
    case EncryptionAlgorithm.RSA_OAEP:
      if (!options.privateKey) {
        throw new Error('Private key required for asymmetric decryption');
      }
      // 这里需要对应的公钥，实际使用中需要从某处获取
      throw new Error('Asymmetric decryption requires both keys');
    
    default:
      throw new Error(`Unsupported encryption algorithm: ${encryptedResult.algorithm}`);
  }
}

/**
 * 数字签名
 */
export function signData(data: string, privateKey: string): string {
  const dataBytes = naclUtil.decodeUTF8(data);
  const privKeyBytes = naclUtil.decodeBase64(privateKey);
  const signature = nacl.sign.detached(dataBytes, privKeyBytes);
  
  return naclUtil.encodeBase64(signature);
}

/**
 * 验证数字签名
 */
export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  try {
    const dataBytes = naclUtil.decodeUTF8(data);
    const sigBytes = naclUtil.decodeBase64(signature);
    const pubKeyBytes = naclUtil.decodeBase64(publicKey);
    
    return nacl.sign.detached.verify(dataBytes, sigBytes, pubKeyBytes);
  } catch {
    return false;
  }
}

/**
 * 生成哈希
 */
export function hashData(data: string, algorithm: 'SHA256' | 'SHA512' = 'SHA256'): string {
  switch (algorithm) {
    case 'SHA256':
      return CryptoJS.SHA256(data).toString();
    case 'SHA512':
      return CryptoJS.SHA512(data).toString();
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
}

/**
 * 安全随机字符串生成
 */
export function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = nacl.randomBytes(length);
  
  return Array.from(randomBytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}

/**
 * 密钥强度验证
 */
export function validateKeyStrength(key: string): {
  isStrong: boolean;
  score: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let score = 0;

  // 长度检查
  if (key.length >= 12) score += 25;
  else recommendations.push('密钥长度至少12位');

  // 复杂度检查
  if (/[a-z]/.test(key)) score += 10;
  else recommendations.push('包含小写字母');

  if (/[A-Z]/.test(key)) score += 10;
  else recommendations.push('包含大写字母');

  if (/\d/.test(key)) score += 10;
  else recommendations.push('包含数字');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(key)) score += 15;
  else recommendations.push('包含特殊字符');

  // 熵检查
  const entropy = calculateEntropy(key);
  if (entropy > 3.5) score += 30;
  else recommendations.push('增加字符多样性');

  return {
    isStrong: score >= 80,
    score,
    recommendations
  };
}

/**
 * 计算字符串熵
 */
function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * 安全比较（防止时序攻击）
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * 密钥派生函数（用于生成多个相关密钥）
 */
export function deriveKeys(masterKey: string, salt: string, count: number): string[] {
  const keys: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const derivedKey = CryptoJS.PBKDF2(masterKey, salt + i.toString(), {
      keySize: 256/32,
      iterations: 10000
    });
    keys.push(derivedKey.toString());
  }
  
  return keys;
}