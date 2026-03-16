const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serviceName = process.argv[2];
if (!serviceName) {
  console.error('Please provide service name');
  process.exit(1);
}

const servicePath = path.join('services', serviceName);

// Create service directory if not exists
if (!fs.existsSync(servicePath)) {
  fs.mkdirSync(servicePath, { recursive: true });
}

// Generate package.json
const packageJson = {
  name: `@flexedu/${serviceName}`,
  version: '1.0.0',
  description: `${serviceName} for FlexEdu platform`,
  main: 'src/index.js',
  scripts: {
    dev: 'nodemon src/index.js',
    start: 'node src/index.js',
    test: 'jest',
    lint: 'eslint src/',
    format: 'prettier --write "src/**/*.js"',
    'prisma:generate': 'prisma generate',
    'prisma:migrate': 'prisma migrate dev',
    'prisma:studio': 'prisma studio'
  },
  dependencies: {
    'express': '^4.18.0',
    '@prisma/client': '^5.0.0',
    'dotenv': '^16.0.0',
    'cors': '^2.8.5',
    'helmet': '^7.0.0',
    'morgan': '^1.10.0',
    'winston': '^3.8.0',
    'axios': '^1.4.0',
    'shared': 'file:../../shared'
  },
  devDependencies: {
    'nodemon': '^2.0.22',
    'prisma': '^5.0.0',
    'jest': '^29.0.0',
    'supertest': '^6.3.0',
    'eslint': '^8.0.0',
    'prettier': '^3.0.0'
  }
};

// Write package.json
fs.writeFileSync(
  path.join(servicePath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create basic index.js
const indexContent = `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: '${serviceName}' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`${serviceName} running on port \${PORT}\`);
});

module.exports = app;
`;

fs.writeFileSync(path.join(servicePath, 'src/index.js'), indexContent.trim());

// Create .env.example
const envExample = `PORT=3000
NODE_ENV=development
DATABASE_URL="mongodb://localhost:27017/${serviceName}"
LOG_LEVEL=debug
`;

fs.writeFileSync(path.join(servicePath, '.env.example'), envExample);

// Create basic Prisma schema
const prismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model ${serviceName.replace(/-/g, '_')}_settings {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

fs.writeFileSync(path.join(servicePath, 'prisma/schema.prisma'), prismaSchema);

console.log(`✅ Service ${serviceName} created successfully!`);
