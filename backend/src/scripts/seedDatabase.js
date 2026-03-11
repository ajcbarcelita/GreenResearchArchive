import fs from 'fs'
import path from 'path'
import logger from '../utils/logger.js'
import { initDB, closeDB } from '../db/db.js'

const scriptPath = path.resolve(
  process.cwd(),
  'src',
  'scripts',
  'green_archive_inserts.sql'
)

async function runSeed() {
  let db
  try {
    db = await initDB()

    const scriptPath = path.resolve(
      process.cwd(),
      'src',
      'scripts',
      'green_archive_inserts.sql'
    )
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