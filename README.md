# Wacky Wacky West - Deployment Instructions

## Quick Deploy to Vercel (5 minutes)

### Step 1: Get the Code Ready
1. Download all the files I've created
2. You should have:
   - `package.json`
   - `vite.config.js`
   - `index.html`
   - `src/main.jsx`
   - `src/App.jsx`

### Step 2: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Sign up (it's free)

### Step 3: Upload Code to GitHub
1. Go to https://github.com/new
2. Name your repository: `wacky-wacky-west`
3. Keep it Public
4. Click "Create repository"
5. Click "uploading an existing file"
6. Drag and drop ALL the files
7. Click "Commit changes"

### Step 4: Deploy to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" and choose "Continue with GitHub"
3. Click "Add New..." → "Project"
4. Find your `wacky-wacky-west` repository
5. Click "Import"
6. **IMPORTANT**: Framework Preset should auto-detect "Vite"
7. Click "Deploy"
8. Wait 1-2 minutes

### Step 5: Get Your Link!
Once deployed, Vercel will give you a link like:
`https://wacky-wacky-west.vercel.app`

**That's your shareable link!** Anyone can visit it and play!

---

## Alternative: Deploy to Netlify

### Steps:
1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose your GitHub repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy"

You'll get a link like: `https://wacky-wacky-west.netlify.app`

---

## How Players Use It

### Creating a Game:
1. Visit your deployed link
2. Enter their name
3. Click "Create New Game"
4. Copy the game code (like "ABC123")
5. Share the link AND game code with friends

### Joining a Game:
1. Visit the same link
2. Enter their name
3. Click "Join Existing Game"
4. Enter the game code
5. Play!

---

## Troubleshooting

**"Module not found" error:**
- Make sure all files are in the correct folders
- `src/main.jsx` and `src/App.jsx` must be in a `src` folder
- Other files at root level

**Game state not syncing:**
- The current version uses JSONBin.io free tier
- It has rate limits, so if many people play simultaneously, you may need to upgrade

**Players can't join:**
- Make sure they're using the EXACT same URL as you
- Game codes expire after 24 hours on the free tier

---

## Need Help?

If you get stuck:
1. Check that all files are uploaded to GitHub correctly
2. Make sure the folder structure matches:
   ```
   /
   ├── package.json
   ├── vite.config.js
   ├── index.html
   └── src/
       ├── main.jsx
       └── App.jsx
   ```
3. Ask Claude for help with specific error messages!
