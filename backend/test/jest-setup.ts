// Loads .env for integration tests that need a real DATABASE_URL - the app
// itself gets this via @nestjs/config at runtime, but a plain ts-jest
// process needs it loaded explicitly.
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
