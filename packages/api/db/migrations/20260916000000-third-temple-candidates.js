'use strict';

/**
 * Seed the 3rd Temple candidate events found by the cycles analysis (docs/cycles-master-plan.md,
 * session write-up THIRD_TEMPLE.md), so a fresh `yarn pairs:generate` on prod includes them:
 *
 *   3rd Temple: Completion (Candidate A)  2034-10-23  Bul 10 6038 — the 1st Temple's completion date
 *                                                    + 62×49 years; 6125 y360 from Creation day 1;
 *                                                    628×2548 from Noah entering the Ark (also Bul 10)
 *   3rd Temple: Dedication (Candidate A)  2031-08-28  Tabernacle Completed + 157 rungs of 8190
 *   3rd Temple: Dedication (Candidate B)  2029-08-27  Creation day 8 + 269 rungs (Enoch Taken + 225)
 *
 * Idempotent: an event with the same name is left alone. created_by is rpostrom@gmail.com when
 * that user exists, else null.
 */
const CANDIDATES = [
  { name: '3rd Temple: Completion (Candidate A)', gregorian: '2034-10-23', description: 'Bul 10 — 1st Temple completion date + 62 × 49 years; 6125 y360 from Creation; 628 × 2548 from Noah entering the Ark' },
  { name: '3rd Temple: Dedication (Candidate A)', gregorian: '2031-08-28', description: 'Tabernacle Completed + 157 rungs of 8190' },
  { name: '3rd Temple: Dedication (Candidate B)', gregorian: '2029-08-27', description: 'Creation day 8 + 269 rungs of 8190 (Enoch Taken + 225)' }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const select = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements, type: Sequelize.QueryTypes.SELECT })
    const [user] = await select(`SELECT uuid FROM users WHERE email = 'rpostrom@gmail.com' LIMIT 1;`)
    for (const c of CANDIDATES) {
      const [exists] = await select('SELECT uuid FROM events WHERE name = :name LIMIT 1;', { name: c.name })
      if (exists) {
        console.log(`[third-temple] "${c.name}" already exists; skipped`)
        continue
      }
      const [row] = await select('SELECT uuid FROM hebrew_dates WHERE gregorian = :g::date LIMIT 1;', { g: c.gregorian })
      if (!row) throw new Error(`[third-temple] no hebrew_dates row for ${c.gregorian}`)
      await queryInterface.sequelize.query(
        `INSERT INTO events (name, description, hebrew_date, created_by) VALUES (:name, :description, :hebrew_date, :created_by);`,
        { replacements: { name: c.name, description: c.description, hebrew_date: row.uuid, created_by: user ? user.uuid : null } }
      )
      console.log(`[third-temple] inserted "${c.name}" (${c.gregorian})`)
    }
  },

  down: async (queryInterface, Sequelize) => {
    // pairs on these events go with them (events_pairs.a/b cascade on delete)
    await queryInterface.sequelize.query('DELETE FROM events WHERE name IN (:names);', {
      replacements: { names: CANDIDATES.map((c) => c.name) },
      type: Sequelize.QueryTypes.DELETE
    })
  }
}
