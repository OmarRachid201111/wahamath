# Deploying Wahamath on Vercel

1. Create a PostgreSQL database (Prisma Postgres, Neon, Supabase, or another hosted provider).
2. Copy both PostgreSQL connection strings: **pooled** and **direct/non-pooled**.
3. In `.env`, replace the old `file:` value with `DATABASE_URL="<pooled connection string>"` and `DIRECT_URL="<direct connection string>"`.
4. Apply the schema and initial curriculum data locally:

   ```bash
   bun run db:deploy
   bun run db:seed
   ```

   `db:seed` resets chapters and exercises; do not run it after students have started using the app.
5. In Vercel, import this repository. Keep **Next.js** and root directory `./` selected.
6. Under **Environment Variables**, add both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct/non-pooled) for **Production**, **Preview**, and **Development**. Do not add either with a `NEXT_PUBLIC_` prefix.
7. Deploy. The build generates Prisma Client and builds Next.js. Apply pending migrations separately with `bun run db:deploy` using the direct connection URL before deploying.

The original SQLite file at `db/custom.db` is left untouched. The seed command creates the teacher, chapters, and exercises in the new PostgreSQL database. Existing student accounts, comments, and progress require a separate data migration if they need to be retained.
