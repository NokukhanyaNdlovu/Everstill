const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDb } = require('./db');
const { createApp } = require('./app');

async function main() {
  await connectDb(process.env.MONGODB_URI);
  const app = createApp();
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
