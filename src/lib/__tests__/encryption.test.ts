import {
  generateKeyPair,
  generateSalt,
  generateSecretKey,
  deriveKeyFromPassword,
  encryptAES,
  decryptAES,
  encryptChaCha20,
  decryptChaCha20,
  encryptAsymmetric,
  decryptAsymmetric,
  encrypt,
  EncryptionAlgorithm,
  signData,
  verifySignature,
  hashData,
  generateSecureRandomString,
  validateKeyStrength,
  secureCompare,
  deriveKeys,
} from '@/lib/encryption';

describe('Encryption Library', () => {
  describe('Key Generation', () => {
    test('should generate valid key pairs', () => {
      const keyPair = generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).not.toBe(keyPair.privateKey);
    });

    test('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    test('should generate salt of correct length', () => {
      const salt = generateSalt(16);
      
      expect(salt).toBeTruthy();
      expect(salt.length).toBeGreaterThan(0);
    });

    test('should generate secret key', () => {
      const key = generateSecretKey();
      
      expect(key).toBeTruthy();
      expect(key.length).toBeGreaterThan(0);
    });

    test('should derive key from password', () => {
      const password = 'testPassword123';
      const salt = 'testSalt';
      const derivedKey = deriveKeyFromPassword(password, salt);
      
      expect(derivedKey).toBeTruthy();
      expect(derivedKey.length).toBeGreaterThan(0);
      
      // Same inputs should produce same output
      const derivedKey2 = deriveKeyFromPassword(password, salt);
      expect(derivedKey).toBe(derivedKey2);
    });
  });

  describe('AES Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const data = 'Hello, World!';
      const key = 'testKey123';
      
      const encrypted = encryptAES(data, key);
      const decrypted = decryptAES(encrypted, key);
      
      expect(encrypted.encryptedData).not.toBe(data);
      expect(encrypted.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
      expect(encrypted.nonce).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
      expect(decrypted).toBe(data);
    });

    test('should handle empty data', () => {
      const data = '';
      const key = 'testKey123';
      
      const encrypted = encryptAES(data, key);
      const decrypted = decryptAES(encrypted, key);
      
      expect(decrypted).toBe(data);
    });

    test('should handle unicode characters', () => {
      const data = '测试中文内容 🚀';
      const key = 'testKey123';
      
      const encrypted = encryptAES(data, key);
      const decrypted = decryptAES(encrypted, key);
      
      expect(decrypted).toBe(data);
    });

    test('should fail with wrong key', () => {
      const data = 'Hello, World!';
      const key1 = 'testKey123';
      const key2 = 'wrongKey456';
      
      const encrypted = encryptAES(data, key1);
      
      expect(() => {
        decryptAES(encrypted, key2);
      }).toThrow();
    });
  });

  describe('ChaCha20 Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const data = 'Hello, ChaCha20!';
      const key = 'testKey123';
      
      const encrypted = encryptChaCha20(data, key);
      const decrypted = decryptChaCha20(encrypted, key);
      
      expect(encrypted.encryptedData).not.toBe(data);
      expect(encrypted.algorithm).toBe(EncryptionAlgorithm.CHACHA20_POLY1305);
      expect(encrypted.nonce).toBeTruthy();
      expect(decrypted).toBe(data);
    });

    test('should handle large data', () => {
      const data = 'x'.repeat(10000);
      const key = 'testKey123';
      
      const encrypted = encryptChaCha20(data, key);
      const decrypted = decryptChaCha20(encrypted, key);
      
      expect(decrypted).toBe(data);
    });

    test('should fail with wrong key', () => {
      const data = 'Hello, World!';
      const key1 = 'testKey123';
      const key2 = 'wrongKey456';
      
      const encrypted = encryptChaCha20(data, key1);
      
      expect(() => {
        decryptChaCha20(encrypted, key2);
      }).toThrow();
    });
  });

  describe('Asymmetric Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const data = 'Hello, Asymmetric!';
      const keyPair = generateKeyPair();
      
      const encrypted = encryptAsymmetric(data, keyPair.publicKey, keyPair.privateKey);
      const decrypted = decryptAsymmetric(encrypted, keyPair.publicKey, keyPair.privateKey);
      
      expect(encrypted.encryptedData).not.toBe(data);
      expect(encrypted.algorithm).toBe(EncryptionAlgorithm.RSA_OAEP);
      expect(encrypted.nonce).toBeTruthy();
      expect(decrypted).toBe(data);
    });

    test('should fail with wrong keys', () => {
      const data = 'Hello, World!';
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      const encrypted = encryptAsymmetric(data, keyPair1.publicKey, keyPair1.privateKey);
      
      expect(() => {
        decryptAsymmetric(encrypted, keyPair2.publicKey, keyPair2.privateKey);
      }).toThrow();
    });
  });

  describe('Unified Encryption Interface', () => {
    test('should encrypt with AES algorithm', () => {
      const data = 'Test data';
      const key = 'testKey123';
      
      const encrypted = encrypt(data, EncryptionAlgorithm.AES_256_GCM, key);
      
      expect(encrypted.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
      expect(encrypted.encryptedData).toBeTruthy();
    });

    test('should encrypt with ChaCha20 algorithm', () => {
      const data = 'Test data';
      const key = 'testKey123';
      
      const encrypted = encrypt(data, EncryptionAlgorithm.CHACHA20_POLY1305, key);
      
      expect(encrypted.algorithm).toBe(EncryptionAlgorithm.CHACHA20_POLY1305);
      expect(encrypted.encryptedData).toBeTruthy();
    });

    test('should throw error for unsupported algorithm', () => {
      const data = 'Test data';
      const key = 'testKey123';
      
      expect(() => {
        encrypt(data, 'UNSUPPORTED' as EncryptionAlgorithm, key);
      }).toThrow();
    });
  });

  describe('Digital Signatures', () => {
    test('should sign and verify data correctly', () => {
      const data = 'Important document';
      const keyPair = generateKeyPair();
      
      const signature = signData(data, keyPair.privateKey);
      const isValid = verifySignature(data, signature, keyPair.publicKey);
      
      expect(signature).toBeTruthy();
      expect(isValid).toBe(true);
    });

    test('should fail verification with wrong data', () => {
      const data1 = 'Original document';
      const data2 = 'Modified document';
      const keyPair = generateKeyPair();
      
      const signature = signData(data1, keyPair.privateKey);
      const isValid = verifySignature(data2, signature, keyPair.publicKey);
      
      expect(isValid).toBe(false);
    });

    test('should fail verification with wrong public key', () => {
      const data = 'Important document';
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      const signature = signData(data, keyPair1.privateKey);
      const isValid = verifySignature(data, signature, keyPair2.publicKey);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Hashing', () => {
    test('should generate SHA256 hash', () => {
      const data = 'Hello, World!';
      const hash = hashData(data, 'SHA256');
      
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    test('should generate SHA512 hash', () => {
      const data = 'Hello, World!';
      const hash = hashData(data, 'SHA512');
      
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(128); // SHA512 produces 128 character hex string
    });

    test('should produce consistent hashes', () => {
      const data = 'Hello, World!';
      const hash1 = hashData(data, 'SHA256');
      const hash2 = hashData(data, 'SHA256');
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Utility Functions', () => {
    test('should generate secure random string', () => {
      const length = 16;
      const randomString = generateSecureRandomString(length);
      
      expect(randomString).toBeTruthy();
      expect(randomString.length).toBe(length);
      
      // Should be different each time
      const randomString2 = generateSecureRandomString(length);
      expect(randomString).not.toBe(randomString2);
    });

    test('should validate key strength correctly', () => {
      const weakKey = '123';
      const strongKey = 'MyStr0ng!P@ssw0rd123';
      
      const weakValidation = validateKeyStrength(weakKey);
      const strongValidation = validateKeyStrength(strongKey);
      
      expect(weakValidation.isStrong).toBe(false);
      expect(weakValidation.score).toBeLessThan(80);
      expect(weakValidation.recommendations).toHaveLength(6);
      
      expect(strongValidation.isStrong).toBe(true);
      expect(strongValidation.score).toBeGreaterThanOrEqual(80);
    });

    test('should perform secure string comparison', () => {
      const string1 = 'secretValue';
      const string2 = 'secretValue';
      const string3 = 'differentValue';
      
      expect(secureCompare(string1, string2)).toBe(true);
      expect(secureCompare(string1, string3)).toBe(false);
      expect(secureCompare(string1, string1.substring(0, 5))).toBe(false);
    });

    test('should derive multiple keys from master key', () => {
      const masterKey = 'masterSecret123';
      const salt = 'testSalt';
      const count = 3;
      
      const derivedKeys = deriveKeys(masterKey, salt, count);
      
      expect(derivedKeys).toHaveLength(count);
      expect(derivedKeys[0]).not.toBe(derivedKeys[1]);
      expect(derivedKeys[1]).not.toBe(derivedKeys[2]);
      expect(derivedKeys[0]).not.toBe(derivedKeys[2]);
    });
  });
});