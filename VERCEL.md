# Deploying Wahamath on Vercel

1. Create a PostgreSQL database (Prisma Postgres, Neon, Supabase, or another hosted provider).
2. Copy its **pooled** PostgreSQL connection string.
3. In `.env`, replace the old `file:` value with `DATABASE_URL="<connection string>"`.
4. Apply the schema and initial curriculum data locally:

   ```bash
   bun run db:deploy
   bun run db:seed
   ```

   `db:seed` resets chapters and exercises; do not run it after students have started using the app.
5. In Vercel, import this repository. Keep **Next.js** and root directory `./` selected.
6. Under **Environment Variables**, add `DATABASE_URL` for **Production**, **Preview**, and **Development**. Do not add it with a `NEXT_PUBLIC_` prefix.
7. Deploy. The build applies pending Prisma migrations before `next build`.

The original SQLite file at `db/custom.db` is left untouched. The seed command creates the teacher, chapters, and exercises in the new PostgreSQL database. Existing student accounts, comments, and progress require a separate data migration if they need to be retained.
