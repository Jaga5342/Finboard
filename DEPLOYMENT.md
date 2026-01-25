
# Deployment Guide

Since this is a Next.js application, the easiest and best way to deploy it is **Vercel** (the creators of Next.js).

## Option 1: Deploy using GitHub (Recommended)

1.  **Push your code to GitHub**:
    - Create a new repository on GitHub.
    - Run these commands in your terminal:
      ```bash
      git init
      git add .
      git commit -m "Initial commit"
      git branch -M main
      git remote add origin <YOUR_GITHUB_REPO_URL>
      git push -u origin main
      ```

2.  **Connect to Vercel**:
    - Go to [Vercel.com](https://vercel.com) and sign up/login.
    - Click **"Add New"** > **"Project"**.
    - Select your GitHub repository.

3.  **Environment Variables**:
    - In the Vercel project setup, look for "Environment Variables".
    - Add the API keys you put in your `.env` file:
      - `NEXT_PUBLIC_ALPHAVANTAGE_KEY`
      - `NEXT_PUBLIC_FINNHUB_KEY`
      - `NEXT_PUBLIC_POLYGON_KEY`

4.  **Deploy**:
    - Click **"Deploy"**.
    - Wait about a minute. You will get a live URL (e.g., `finboard-app.vercel.app`).

## Option 2: Deploy Manually (Drag & Drop)

If you don't want to use GitHub:

1.  Install the Vercel CLI: `npm i -g vercel`
2.  Run `vercel login` in your terminal.
3.  Run `vercel` inside the project folder.
4.  Follow the prompts (say "Yes" to everything).

## Submission Checklist

Before sending this to the recruiter:

1.  **Clean Code**: Run `npm run lint` to check for any issues.
2.  **Readme**: Ensure `README.md` is present (I have already created this for you).
3.  **Screenshots**: Take a few nice screenshots of a populated dashboard:
    - One with Light Mode.
    - One with Dark Mode.
    - One showing the "Add Widget" modal (like the one you uploaded!).
4.  **Live Link**: Include the Vercel link in your email/submission.
