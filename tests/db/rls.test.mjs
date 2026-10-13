// Database tests: run the real migrations on PGlite (Postgres in WASM) and check RLS,
// triggers and constraints. Run with `npm run test:db`.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

const root = join(import.meta.dirname, '..', '..');
const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

let db;

/** Runs `fn` as an authenticated user (or anon when uid is null) inside a transaction. */
async function as(uid, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${uid ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    return fn(tx);
  });
}

async function expectError(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(String(error.message), pattern);
    return true;
  });
}

before(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(readFileSync(join(root, 'tests/db/supabase-shim.sql'), 'utf8'));
  const dir = join(root, 'supabase/migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'));
  }
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'alice@example.com', '{"display_name":"Alice","language":"pt-BR"}'),
       ($2, 'bob@example.com', '{"display_name":"Bob"}')`,
    [ALICE, BOB],
  );
  // A catalogue food (no owner), as an import job running with the service role would create.
  await db.exec(`insert into public.foods (id, name, calories_per_100g, protein_per_100g, source, source_id)
                 values ('10000000-0000-4000-8000-000000000001', 'Catalog rice', 130, 2.7, 'usda', 'fdc-1')`);
});

describe('sign-up trigger', () => {
  it('creates profile and preferences from auth metadata', async () => {
    const { rows } = await as(ALICE, (tx) =>
      tx.query(`select p.display_name, p.email, p.language, u.unit_system
                from profiles p join user_preferences u on u.user_id = p.id`),
    );
    assert.deepEqual(rows, [
      {
        display_name: 'Alice',
        email: 'alice@example.com',
        language: 'pt-BR',
        unit_system: 'metric',
      },
    ]);
  });
});

describe('data isolation between users', () => {
  it('a user only sees their own profile', async () => {
    const alice = await as(ALICE, (tx) => tx.query('select id from profiles'));
    const bob = await as(BOB, (tx) => tx.query('select id from profiles'));
    assert.deepEqual(
      alice.rows.map((r) => r.id),
      [ALICE],
    );
    assert.deepEqual(
      bob.rows.map((r) => r.id),
      [BOB],
    );
  });

  it('anonymous requests see nothing', async () => {
    await expectError(
      as(null, (tx) => tx.query('select * from meal_entries')),
      /permission denied/,
    );
    const { rows } = await as(null, (tx) => tx.query('select * from profiles'));
    assert.equal(rows.length, 0);
  });

  it('meals, items, weights and goals are private', async () => {
    await as(ALICE, async (tx) => {
      const entry = await tx.query(
        `insert into meal_entries (meal_type) values ('lunch') returning id`,
      );
      await tx.query(
        `insert into meal_items (meal_entry_id, food_id, quantity_grams) values ($1, '10000000-0000-4000-8000-000000000001', 150)`,
        [entry.rows[0].id],
      );
      await tx.exec(`insert into weight_logs (weight_kg) values (70.5)`);
      await tx.query(
        `insert into nutrition_goals (user_id, daily_calorie_target) values ($1, 1900)`,
        [ALICE],
      );
    });

    const bobView = await as(BOB, async (tx) => ({
      entries: (await tx.query('select * from meal_entries')).rows.length,
      items: (await tx.query('select * from meal_items')).rows.length,
      weights: (await tx.query('select * from weight_logs')).rows.length,
      goals: (await tx.query('select * from nutrition_goals')).rows.length,
    }));
    assert.deepEqual(bobView, { entries: 0, items: 0, weights: 0, goals: 0 });

    // Bob cannot modify or delete Alice's rows either (0 rows affected).
    const updated = await as(BOB, (tx) =>
      tx.query(`update weight_logs set weight_kg = 99 returning id`),
    );
    assert.equal(updated.rows.length, 0);
    const deleted = await as(BOB, (tx) => tx.query(`delete from meal_entries returning id`));
    assert.equal(deleted.rows.length, 0);
  });

  it('cannot insert rows on behalf of another user', async () => {
    await expectError(
      as(BOB, (tx) =>
        tx.query(`insert into meal_entries (user_id, meal_type) values ($1, 'dinner')`, [ALICE]),
      ),
      /row-level security/,
    );
    await expectError(
      as(BOB, (tx) =>
        tx.query(`insert into weight_logs (user_id, weight_kg) values ($1, 80)`, [ALICE]),
      ),
      /row-level security/,
    );
  });

  it("cannot attach items to another user's meal", async () => {
    const aliceEntry = await as(ALICE, (tx) => tx.query(`select id from meal_entries limit 1`));
    await expectError(
      as(BOB, (tx) =>
        tx.query(
          `insert into meal_items (meal_entry_id, food_id, quantity_grams) values ($1, '10000000-0000-4000-8000-000000000001', 10)`,
          [aliceEntry.rows[0].id],
        ),
      ),
      /row-level security/,
    );
  });

  it('user foods are private, the catalogue is shared and read-only', async () => {
    await as(ALICE, (tx) =>
      tx.query(
        `insert into foods (id, name, calories_per_100g, created_by) values
                ('20000000-0000-4000-8000-000000000001', 'Alice granola', 450, $1)`,
        [ALICE],
      ),
    );
    const bobFoods = await as(BOB, (tx) => tx.query('select name from foods order by name'));
    assert.deepEqual(
      bobFoods.rows.map((r) => r.name),
      ['Catalog rice'],
    );

    // Bob cannot log Alice's private food (trigger cannot see it).
    await expectError(
      as(BOB, async (tx) => {
        const e = await tx.query(
          `insert into meal_entries (meal_type) values ('snack') returning id`,
        );
        await tx.query(
          `insert into meal_items (meal_entry_id, food_id, quantity_grams) values ($1, '20000000-0000-4000-8000-000000000001', 50)`,
          [e.rows[0].id],
        );
      }),
      /not found/,
    );
    // Nobody can edit the catalogue or impersonate a source.
    const edited = await as(BOB, (tx) =>
      tx.query(`update foods set calories_per_100g = 1 where source = 'usda' returning id`),
    );
    assert.equal(edited.rows.length, 0);
    await expectError(
      as(BOB, (tx) =>
        tx.query(
          `insert into foods (name, calories_per_100g, source, created_by) values ('x', 1, 'usda', $1)`,
          [BOB],
        ),
      ),
      /row-level security|check constraint/,
    );
  });

  it('protected columns cannot be changed by the client', async () => {
    await expectError(
      as(ALICE, (tx) => tx.query(`update profiles set email = 'evil@example.com'`)),
      /permission denied/,
    );
    await expectError(
      as(ALICE, (tx) => tx.query(`update meal_items set calculated_calories = 1`)),
      /permission denied/,
    );
    await expectError(
      as(ALICE, (tx) =>
        tx.query(
          `insert into user_entitlements (user_id, entitlement, source) values ($1, 'pro', 'manual_grant')`,
          [ALICE],
        ),
      ),
      /permission denied/,
    );
  });
});

describe('nutrition calculation trigger', () => {
  it('computes values from grams and keeps unknown nutrients as NULL', async () => {
    const row = await as(ALICE, async (tx) => {
      await tx.exec(`insert into foods (id, name, calories_per_100g, protein_per_100g, created_by)
                     values ('20000000-0000-4000-8000-000000000002', 'Test bar', 200, 10, auth.uid())`);
      const e = await tx.query(
        `insert into meal_entries (meal_type) values ('snack') returning id`,
      );
      const item = await tx.query(
        `insert into meal_items (meal_entry_id, food_id, quantity_grams)
         values ($1, '20000000-0000-4000-8000-000000000002', 150) returning *`,
        [e.rows[0].id],
      );
      // Editing the quantity recalculates.
      const edited = await tx.query(
        `update meal_items set quantity_grams = 50 where id = $1 returning *`,
        [item.rows[0].id],
      );
      return { created: item.rows[0], edited: edited.rows[0] };
    });
    assert.equal(Number(row.created.calculated_calories), 300);
    assert.equal(Number(row.created.calculated_protein), 15);
    assert.equal(row.created.calculated_carbs, null);
    assert.equal(row.created.calculated_fat, null);
    assert.equal(Number(row.edited.calculated_calories), 100);
  });

  it('rejects invalid data', async () => {
    await expectError(
      as(ALICE, (tx) => tx.query(`insert into weight_logs (weight_kg) values (5)`)),
      /check constraint/,
    );
    await expectError(
      as(ALICE, (tx) => tx.query(`update nutrition_goals set daily_calorie_target = 800`)),
      /check constraint/,
    );
    await expectError(
      as(ALICE, (tx) =>
        tx.query(`insert into foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_by)
                                  values ('Impossible', 100, 60, 60, 10, auth.uid())`),
      ),
      /check constraint/,
    );
  });
});

describe('history limits (Free vs Pro)', () => {
  it('free users only see the last 7 days, Pro is granted server-side', async () => {
    // Seed an old entry with elevated privileges (as a migration/import would).
    await db.query(
      `insert into meal_entries (user_id, meal_type, consumed_at) values ($1, 'dinner', now() - interval '20 days')`,
      [BOB],
    );
    const free = await as(BOB, (tx) =>
      tx.query(`select id from meal_entries where consumed_at < now() - interval '10 days'`),
    );
    assert.equal(free.rows.length, 0);
    await expectError(
      as(BOB, (tx) =>
        tx.query(
          `insert into meal_entries (meal_type, consumed_at) values ('lunch', now() - interval '30 days')`,
        ),
      ),
      /row-level security/,
    );

    await db.query(
      `insert into user_entitlements (user_id, entitlement, source) values ($1, 'pro', 'manual_grant')`,
      [BOB],
    );
    const pro = await as(BOB, (tx) =>
      tx.query(`select id from meal_entries where consumed_at < now() - interval '10 days'`),
    );
    assert.equal(pro.rows.length, 1);

    await db.query(
      `update user_entitlements set expires_at = now() - interval '1 day' where user_id = $1`,
      [BOB],
    );
    const expired = await as(BOB, (tx) =>
      tx.query(`select id from meal_entries where consumed_at < now() - interval '10 days'`),
    );
    assert.equal(expired.rows.length, 0);
  });
});

describe('account deletion', () => {
  it('requires authentication', async () => {
    await expectError(
      as(null, (tx) => tx.query('select delete_own_account()')),
      /permission denied/,
    );
  });

  it('removes the user and all personal data, and nothing of other users', async () => {
    await as(ALICE, async (tx) => {
      const fav = await tx.query(
        `insert into favorite_meals (name) values ('Breakfast bowl') returning id`,
      );
      await tx.query(
        `insert into favorite_meal_items (favorite_meal_id, food_id, quantity_grams)
                      values ($1, '20000000-0000-4000-8000-000000000001', 40)`,
        [fav.rows[0].id],
      );
      await tx.query('select delete_own_account()');
    });
    const counts = await db.query(
      `select
         (select count(*) from auth.users where id = $1)::int as users,
         (select count(*) from profiles where id = $1)::int as profiles,
         (select count(*) from meal_entries where user_id = $1)::int as meals,
         (select count(*) from foods where created_by = $1)::int as foods,
         (select count(*) from weight_logs where user_id = $1)::int as weights,
         (select count(*) from favorite_meals where user_id = $1)::int as favorites,
         (select count(*) from profiles where id = $2)::int as bob`,
      [ALICE, BOB],
    );
    assert.deepEqual(counts.rows[0], {
      users: 0,
      profiles: 0,
      meals: 0,
      foods: 0,
      weights: 0,
      favorites: 0,
      bob: 1,
    });
  });
});

describe('referential integrity', () => {
  it('a food used in the diary cannot be deleted on its own', async () => {
    await expectError(
      as(BOB, async (tx) => {
        await tx.exec(`insert into foods (id, name, calories_per_100g, created_by)
                       values ('20000000-0000-4000-8000-000000000009', 'Bob soup', 50, auth.uid())`);
        const e = await tx.query(
          `insert into meal_entries (meal_type) values ('dinner') returning id`,
        );
        await tx.query(
          `insert into meal_items (meal_entry_id, food_id, quantity_grams)
                        values ($1, '20000000-0000-4000-8000-000000000009', 300)`,
          [e.rows[0].id],
        );
        await tx.exec(`delete from foods where id = '20000000-0000-4000-8000-000000000009'`);
      }),
      /foreign key/,
    );
  });
});
