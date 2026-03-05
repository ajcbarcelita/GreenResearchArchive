import fs from 'fs'
import path from 'path'
import { initDB, closeDB } from '../../db/db.js'
import logger from '../../utils/logger.js'

async function runSeed() {
  let db
  try {
    db = await initDB()
    const sqlPath = path.resolve(new URL(import.meta.url).pathname, '..', 'Dataset.sql')
    // Dataset.sql is in the same directory as this script
    const scriptPath = path.resolve(process.cwd(), 'src', 'scripts', 'Dataset.sql')
    const sql = fs.readFileSync(scriptPath, { encoding: 'utf-8' })

    await db.query('BEGIN')
    await db.query(sql)
    await db.query('COMMIT')
    logger.info('[SUCCESS] Database seeded successfully.')
  } catch (err) {
    if (db) await db.query('ROLLBACK').catch(() => {})
    logger.error('[ERROR] Seeding failed:')
    logger.error(err)
    process.exit(1)
  } finally {
    await closeDB()
    process.exit(0)
  }
}

runSeed()
