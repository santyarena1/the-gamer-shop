This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Base de datos local (PostgreSQL)

La URL y la contraseña van en **`.env.local`** (git lo ignora; no se pierden con `git pull` / `git push`).

```powershell
copy .env.local.example .env.local
```

Editá `POSTGRES_PASSWORD` con tu clave de pgAdmin. Si no conecta, ejecutá como **Administrador**:

```powershell
.\scripts\reset-postgres-password.ps1
```

Eso deja la contraseña en `devlocal` y la guarda en `.env.local`.

### Backup y restore (migrar de PC o deploy sin perder datos)

Este repo incluye backup/restauración consistente de PostgreSQL usando dump binario.

```powershell
npm run db:backup
```

Genera un archivo `.dump` en `backups/db/` (ignorado por git).

```powershell
npm run db:restore
```

Restaura el último backup encontrado en `backups/db/`.

Flujo recomendado para mover el sistema a otra PC o entorno:

1. En origen: `npm run db:backup`
2. Copiar el `.dump` al destino
3. En destino: configurar `.env.local` con la nueva `DATABASE_URL` y `POSTGRES_PASSWORD`
4. Crear esquema: `npm run db:migrate`
5. Restaurar datos: `npm run db:restore`

Nota: los dumps pueden contener datos sensibles. No subirlos al repo.

## Feed AcuStock (XML)

Con `npm run dev`, el servidor sincroniza el feed cada **1 hora** (y una vez al arrancar). En Productos verás la fecha de última actualización.

Para cron externo o producción en Vercel:

```env
CRON_SECRET=una-clave-larga-aleatoria
```

```http
GET /api/cron/sync-acustock-feed
Authorization: Bearer <CRON_SECRET>
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
