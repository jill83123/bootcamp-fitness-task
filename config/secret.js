const { JWT_SECRET, JWT_EXPIRES, FIREBASE_CREDENTIAL, FIREBASE_STORAGE_BUCKET } = process.env;

module.exports = {
  jwt: {
    secret: JWT_SECRET,
    expires: JWT_EXPIRES,
  },
  firebase: {
    credential: JSON.parse(FIREBASE_CREDENTIAL),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  },
};
