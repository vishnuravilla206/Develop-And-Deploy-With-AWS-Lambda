import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const issuer = process.env.AUTH_ISSUER;
const audience = process.env.AUTH_AUDIENCE;

const client = jwksClient({
  jwksUri: `${issuer}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export async function handler(event) {
  try {
    const token = event.authorizationToken;
    if (!token) throw new Error('Unauthorized');

    const raw = token.replace('Bearer ', '');

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        raw,
        getKey,
        {
          audience,
          issuer,
          algorithms: ['RS256']
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        }
      );
    });

    return {
      principalId: decoded.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'execute-api:Invoke',
            Resource: event.methodArn
          }
        ]
      },
      context: {
        sub: decoded.sub
      }
    };

  } catch (e) {
    console.error('Auth Error', e);
    throw new Error('Unauthorized');
  }
}
