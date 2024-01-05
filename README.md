# mapprint-shelter

pnpm i

docker compose up -d

pnpx prisma generate

pnpm dev

# Open http://localhost:3000/maps/1

# Database

Preparation:

```
export POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/postgres?schema=public

```

Usage:

Run docker-compose up to start the PostgreSQL container.
Execute pnpx prisma generate to generate Prisma Client code aligned with the Prisma schema.
Run pnpx prisma migrate dev to apply necessary migrations.
Use pnpx prisma db seed to incorporate initial data.

```
docker-compose up 　
pnpx prisma generate
pnpx prisma migrate dev 　
pnpx prisma db seed
```

Verification:

```
psql -h localhost -p 5433 -U postgres -d postgres
\dt
```

If tables are displayed, it's OK.

Tips:

You can use the command npx prisma studio to view the data added through the seed process.
