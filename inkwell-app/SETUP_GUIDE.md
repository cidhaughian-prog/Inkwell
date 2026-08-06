# Setting Inkwell up — no coding required

Two free accounts, about 15 minutes total. Do this once; after that you just visit your live URL.

## 1. Create the database (Supabase)

1. Go to supabase.com and sign up free.
2. Click **New project**. Name it "inkwell," set a database password (save it somewhere), pick any region, create it. Wait ~2 minutes while it spins up.
3. In the left sidebar, click **SQL Editor** → **New query**.
4. Open `supabase_schema.sql` (in this project folder), copy the whole thing, paste it into the SQL Editor, click **Run**. This creates all the tables — books, characters, chapters, plot points, etc.
5. In the left sidebar, click **Project Settings** → **Data API** (or **API**). Copy two values:
   - **Project URL**
   - **anon public** key (a long string)

## 2. Put your project on GitHub

1. Go to github.com and sign up free if you don't have an account.
2. Click **New repository**. Name it "inkwell," keep it **Private**, create it.
3. On the new repo page, click **uploading an existing file**. Drag the entire `inkwell` project folder in — everything except the `node_modules` and `dist` folders (skip those, they're not needed and are huge).
4. Commit the upload.

## 3. Deploy it (Netlify)

1. Go to netlify.com and sign up free (you can use your GitHub account to sign in — makes this step easier).
2. Click **Add new site** → **Import an existing project** → **Deploy with GitHub**. Authorize it, then select your "inkwell" repo.
3. Build settings should auto-detect as:
   - Build command: `npm run build`
   - Publish directory: `dist`
   If not, enter those manually.
4. Before deploying, click **Add environment variables** and add:
   - `VITE_SUPABASE_URL` → paste your Project URL from step 1
   - `VITE_SUPABASE_ANON_KEY` → paste your anon public key from step 1
5. Click **Deploy**. Wait a minute or two.
6. You'll get a URL like `https://something-random.netlify.app`. That's your app. Bookmark it — you can also rename it to something like `inkwell-cidney.netlify.app` in Site settings.

## Using it

Open your URL, click **Start a new book**, and you're in. Everything saves automatically as you type (fields save when you click away; chapter prose has an explicit **Save chapter** button so you don't lose long stretches to a stray click).

## Notes

- Your anon key is not a secret in the traditional sense, but treat your live URL as private anyway — don't post it publicly. Anyone with the link can read and edit your books, since this is built for one user (you), not a login system.
- Netlify auto-redeploys the site every time you push a change to GitHub, if you or I ever want to update the app later.
- If you want a login screen added later so the URL is safe to share, that's a real option — just ask, it's a bigger addition (auth + per-user data).
- Free tiers: Supabase free tier and Netlify free tier are both generous enough for personal use like this, no cost expected.
