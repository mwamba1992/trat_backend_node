

const fs = require('fs');
import * as crypto from 'crypto';

const forge = require('node-forge');


export class GePGGlobalSignature {


  privateKeyFilePath: '/Users/amtz/gepg/testing_keys/gepgclientprivatekey.pfx';
  publicKeyFilePath = 'path/to/public.key';
  password = 'paspass';


  createSignature(content: string) {





    // Read the PFX file (binary data)
    const pfxBuffer = fs.readFileSync('/Users/amtz/Downloads/gepgclientprivatekey.pfx');

    try {
      // Parse the PFX file (PKCS#12 format)
      const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(pfxBuffer.toString('binary')), 'passpass');

      // Extract the private key from the PFX
      const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const privateKey = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

      if (!privateKey) {
        throw new Error('Private key not found in the PFX file');
      }

      // Create a SHA256 hash of the content
      const md = forge.md.sha1.create();
      md.update(content);

      // Sign the hash using SHA256WithRSAEncryption
      const signature = privateKey.sign(md);

      // Base64 encode the signature
      return forge.util.encode64(signature);
    } catch (error) {
      console.error('Error parsing PFX file:', error);
      throw new Error('Failed to extract private key from PFX file or invalid password');
    }
  }

  // Verify the signature using the public key from PFX file (password required)
  verifySignature(signature, content, pfxFilePath, password) {
    // Read the PFX file (binary data)
    const pfxBuffer = fs.readFileSync(pfxFilePath);

    // Parse the PFX file using node-forge with password
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.fromAsn1(p12Asn1, password);

    // Extract the public key from the certificate in the PFX
    const { cert: certificate } = p12.getBags({ bagType: forge.pki.oids.certBag });

    if (!certificate || certificate.length === 0) {
      throw new Error('Certificate not found in the PFX file');
    }

    const publicKey = certificate[0].publicKey;

    // Create a Verify object with RSA-SHA256
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(content);  // The content to be verified
    const isVerified = verify.verify(publicKey, signature, 'base64');  // Verify the signature with the public key
    return isVerified;
  }
}

