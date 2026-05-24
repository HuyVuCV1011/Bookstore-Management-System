# Bookstore ngrok Demo Runbook

This file explains exactly how to put the local Bookstore website on the internet with ngrok.

Follow it from top to bottom. Copy the commands exactly. Do not skip the checks.

## What You Are Making

You will create one public link like this:

```text
https://something.ngrok-free.dev
```

That one link will show the frontend website and also send `/api/...` requests to the backend.

The demo is temporary:

- If Docker stops, the website stops.
- If ngrok stops, the public link stops.
- If the local proxy stops, the public link stops.

## Very Important Rules

Do not do these things:

- Do not commit `.env.demo`.
- Do not commit the ngrok authtoken.
- Do not commit a real ngrok URL.
- Do not expose database ports through ngrok.
- Do not use wildcard CORS.
- Do not disable login/security code to make the demo work.
- Do not change cookie settings unless a human or strong model approves it.

Only expose one local port through ngrok:

```text
8090
```

Port `8090` is a small local proxy:

- `/api/...` goes to backend `http://localhost:8081`
- everything else goes to frontend `http://localhost:5175`

## What Must Already Be Installed

You need:

- Docker Desktop
- ngrok

Check Docker:

```bash
docker version
```

Check ngrok:

```bash
ngrok version
```

If ngrok is missing, install it first. If ngrok asks for an authtoken, run this with the user's private token:

```bash
ngrok config add-authtoken YOUR_PRIVATE_TOKEN
```

Never write the real token into any project file.

## Go To The Project Folder

Run this from the project root:

```bash
cd /path/to/bookstore-project
```

Check you are in the right place:

```bash
pwd
```

You should see the project directory:

```text
.../Source Code
```

## Step 1: Check Local Backend And Frontend

The normal app usually runs on:

- frontend: `http://localhost:5174`
- backend: `http://localhost:8081`

Check backend:

```bash
curl http://localhost:8081/actuator/health
```

Good result:

```json
{"status":"UP"}
```

Check frontend:

```bash
curl -I http://localhost:5174
```

Good result:

```text
HTTP/1.1 200 OK
```

Check a real API call:

```bash
curl -sS 'http://localhost:8081/api/books?page=0&size=1'
```

Good result:

- It prints JSON.
- It contains book data.

If these checks fail, start the local stack:

```bash
docker compose up -d --build
```

Then wait 1-2 minutes and run the checks again.

## Step 2: Create `.env.demo` If Missing

Check if `.env.demo` exists:

```bash
ls -l .env.demo
```

If it says the file does not exist, create it:

```bash
cp .env.demo.example .env.demo
```

Make sure Git ignores it:

```bash
git check-ignore -v .env.demo
```

Good result:

```text
.gitignore:...:.env.*    .env.demo
```

## Step 3: Build A Frontend For One-Link ngrok

For one public ngrok link, the frontend must call the backend with a relative URL:

```env
VITE_API_URL=/api
```

Add it to `.env.demo`:

```bash
printf '\nVITE_API_URL=/api\n' >> .env.demo
```

Build the frontend demo image:

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml build frontend
```

Good result:

- The build finishes successfully.
- You see `npm run build`.
- You see `✓ built`.

## Step 4: Start The Demo Frontend On Port 5175

Remove any old temporary frontend container:

```bash
docker rm -f bookstore-ngrok-frontend
```

It is okay if this says:

```text
No such container
```

Start the frontend on local port `5175`:

```bash
docker run -d --name bookstore-ngrok-frontend -p 5175:5173 bookstore-demo-frontend
```

Check it:

```bash
curl -I http://localhost:5175
```

Good result:

```text
HTTP/1.1 200 OK
```

## Step 5: Start The Local Proxy On Port 8090

The proxy makes frontend and backend look like one website.

Run this command and keep it running:

```bash
node -e 'const http=require("http"); const targets={api:{host:"127.0.0.1",port:8081},web:{host:"127.0.0.1",port:5175}}; http.createServer((req,res)=>{const isApi=req.url.startsWith("/api"); const t=isApi?targets.api:targets.web; const opts={hostname:t.host,port:t.port,path:req.url,method:req.method,headers:{...req.headers,host:`${t.host}:${t.port}`}}; const p=http.request(opts,r=>{res.writeHead(r.statusCode||502,r.headers); r.pipe(res)}); p.on("error",e=>{res.writeHead(502,{"content-type":"text/plain"}); res.end("Proxy error: "+e.message)}); req.pipe(p)}).listen(8090,"127.0.0.1",()=>console.log("proxy http://127.0.0.1:8090 -> /api:8081, web:5175"));'
```

Good result:

```text
proxy http://127.0.0.1:8090 -> /api:8081, web:5175
```

Do not close this terminal.

Open a new terminal for the next checks.

## Step 6: Check The Proxy

Check frontend through the proxy:

```bash
curl -I http://127.0.0.1:8090
```

Good result:

```text
HTTP/1.1 200 OK
```

Check backend through the proxy:

```bash
curl -sS 'http://127.0.0.1:8090/api/books?page=0&size=1'
```

Good result:

- It prints JSON.
- It contains book data.

Do not continue until both checks work.

## Step 7: Start ngrok

Run this in a new terminal and keep it running:

```bash
ngrok http 8090
```

ngrok will print a public URL. It looks like:

```text
https://something.ngrok-free.dev
```

This is the link to share.

Do not share backend-only links.
Do not share database links.
Only share the ngrok URL for port `8090`.

## Step 8: Check The Public Link

Replace `YOUR_NGROK_URL` with the real ngrok URL.

Check frontend:

```bash
curl -I YOUR_NGROK_URL
```

Example:

```bash
curl -I https://something.ngrok-free.dev
```

Good result:

```text
HTTP/2 200
```

Check backend API through the same public link:

```bash
curl -sS 'YOUR_NGROK_URL/api/books?page=0&size=1'
```

Example:

```bash
curl -sS 'https://something.ngrok-free.dev/api/books?page=0&size=1'
```

Good result:

- It prints JSON.
- It contains book data.

Now open the ngrok URL in a browser.

## Step 9: Browser Test

Open the public ngrok URL in:

- Chrome incognito, or
- another browser, or
- a phone on mobile data.

Check:

- Homepage loads.
- Catalog loads.
- Book cards load.
- Book detail page loads.
- No obvious browser console CORS errors.
- Login page opens.

If login fails, do not weaken security. Report it. The public catalog demo is still valid.

## Demo Accounts

Optional demo accounts can be loaded with:

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml exec -T postgres \
  psql -U bookstore_user -d bookstore < db/demo-users.sql
```

Accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin.demo@example.test` | `Demo@12345` |
| Customer | `customer.demo@example.test` | `Demo@12345` |

Use fake demo data only.

## How To Stop The Demo

Stop ngrok:

- Go to the terminal running `ngrok http 8090`.
- Press `Ctrl+C`.

Stop the proxy:

- Go to the terminal running the long `node -e ...` command.
- Press `Ctrl+C`.

Stop the temporary frontend:

```bash
docker rm -f bookstore-ngrok-frontend
```

If you started the full Docker stack only for the demo, stop it:

```bash
docker compose down
```

Do not run `docker compose down -v` unless the user wants to delete database data.

## Common Problems

### `ngrok: command not found`

ngrok is not installed or not in PATH.

Check:

```bash
which ngrok
```

If the user has the binary at `~/.local/bin/ngrok`, make sure PATH includes it:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Then try:

```bash
ngrok version
```

### ngrok asks for an authtoken

The user must add their private token:

```bash
ngrok config add-authtoken YOUR_PRIVATE_TOKEN
```

Do not save the token in the repo.

### Port `8090` Is Already Used

Use another local proxy port, for example `8091`.

Change only these commands:

```bash
node -e '...' # change listen(8090,...) to listen(8091,...)
ngrok http 8091
```

### Port `5175` Is Already Used

Use another frontend port, for example `5176`.

Change:

```bash
docker run -d --name bookstore-ngrok-frontend -p 5176:5173 bookstore-demo-frontend
```

Then change the proxy target from `port:5175` to `port:5176`.

### Backend Health Fails

Check if backend is running:

```bash
curl http://localhost:8081/actuator/health
```

If it fails, start the stack:

```bash
docker compose up -d --build
```

Wait 1-2 minutes. Cassandra is slow.

### Public Link Loads But API Fails

Check local proxy API first:

```bash
curl -sS 'http://127.0.0.1:8090/api/books?page=0&size=1'
```

If local proxy API fails, fix local backend/proxy before checking ngrok.

If local proxy API works but ngrok API fails, restart ngrok:

```bash
ngrok http 8090
```

### Frontend Still Calls `localhost`

Rebuild the frontend with:

```bash
printf '\nVITE_API_URL=/api\n' >> .env.demo
docker compose --env-file .env.demo -f docker-compose.demo.yml build frontend
docker rm -f bookstore-ngrok-frontend
docker run -d --name bookstore-ngrok-frontend -p 5175:5173 bookstore-demo-frontend
```

Hard-refresh the browser.

## What Worked On 2026-05-24

This exact setup worked:

- Backend was running at `http://localhost:8081`.
- Frontend base stack was running at `http://localhost:5174`.
- A new frontend image was built with `VITE_API_URL=/api`.
- Temporary frontend container ran at `http://localhost:5175`.
- Temporary proxy ran at `http://127.0.0.1:8090`.
- ngrok exposed port `8090`.
- Public frontend returned `HTTP/2 200`.
- Public API returned book JSON at `/api/books?page=0&size=1`.

The public URL from that run was intentionally not recorded here. ngrok URLs can change and should not be committed.
