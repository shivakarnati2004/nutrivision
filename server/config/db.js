const { Pool, Client } = require('pg');
require('dotenv').config();

let pool = null;
let dbAvailable = false;

// Build connection config from DATABASE_URL or individual vars
const getConnectionConfig = (database) => {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL.replace(/\/[^/]*$/, '/' + database),
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        };
    }
    return {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: database,
    };
};

const getPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
            max: 10,
        };
    }
    return {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'nutrivision',
        max: 10,
    };
};

const initDB = async () => {
    try {
        // If DATABASE_URL is set (e.g., Render), skip database creation — it already exists
        if (!process.env.DATABASE_URL) {
            const adminClient = new Client(getConnectionConfig('postgres'));
            await adminClient.connect();

            const res = await adminClient.query(
                "SELECT 1 FROM pg_database WHERE datname = $1",
                [process.env.DB_NAME || 'nutrivision']
            );
            if (res.rowCount === 0) {
                await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME || 'nutrivision'}`);
                console.log('✅ Created database:', process.env.DB_NAME || 'nutrivision');
            }
            await adminClient.end();
        }

        pool = new Pool(getPoolConfig());

        pool.on('error', (err) => {
            console.error('⚠️  Database pool error:', err.message);
        });

        const client = await pool.connect();

        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                gender VARCHAR(20),
                height_cm DECIMAL(5,1),
                weight_kg DECIMAL(5,1),
                age INTEGER,
                bmi DECIMAL(4,1),
                exercise_level VARCHAR(30),
                health_conditions TEXT,
                health_goals TEXT,
                is_verified BOOLEAN DEFAULT false,
                onboarding_complete BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // OTPs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp_code VARCHAR(10) NOT NULL,
                purpose VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Nutrition analyses table (updated with user_id and food_weight)
        await client.query(`
            CREATE TABLE IF NOT EXISTS nutrition_analyses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                input_type VARCHAR(20) NOT NULL,
                input_text TEXT,
                food_name VARCHAR(500),
                nutrition_data JSONB,
                food_weight_grams DECIMAL(8,1) DEFAULT 100,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add user_id column if it doesn't exist yet (for existing tables)
        await client.query(`
            DO $$ BEGIN
                ALTER TABLE nutrition_analyses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
                ALTER TABLE nutrition_analyses ADD COLUMN IF NOT EXISTS food_weight_grams DECIMAL(8,1) DEFAULT 100;
            EXCEPTION WHEN others THEN NULL;
            END $$;
        `);

        client.release();

        dbAvailable = true;
        console.log('✅ Database connected and tables initialized');
    } catch (error) {
        console.log('⚠️  Database error:', error.message);
        console.log('⚠️  App will continue WITHOUT database - history won\'t be saved');
        dbAvailable = false;
        pool = null;
    }
};

const getPool = () => pool;
const isDBAvailable = () => dbAvailable;

module.exports = { getPool, initDB, isDBAvailable };
