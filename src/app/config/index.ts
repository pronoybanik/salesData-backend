
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    port: process.env.PORT,
    dataBase_url: process.env.DATABASE_URL,
    jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,

}