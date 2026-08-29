import { defineConfig, loadEnv, type Plugin } from 'vite';
import { spawn } from 'node:child_process';
import react from '@vitejs/plugin-react';

const TS_ROUTES: Record<string, () => Promise<{ default: (req: Request) => Promise<Response> | Response }>> = {
  '/api/analyze-course': () => import('./api/analyze-course'),
  '/api/diagnose': () => import('./api/diagnose'),
  '/api/evaluate': () => import('./api/evaluate'),
  '/api/lesson': () => import('./api/lesson'),
  '/api/retest': () => import('./api/retest'),
  '/api/resources': () => import('./api/resources'),
};

function localApi(): Plugin {
  return {
    name: 'conceptatlas-local-api',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '');
      if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY;
      if (env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        const isConverter = pathname === '/api/convert-file' || pathname === '/api/convert-pdf';
        if (!TS_ROUTES[pathname] && !isConverter) return next();

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const body = Buffer.concat(chunks);

          if (isConverter) {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'Method not allowed.' }));
              return;
            }

            const contentType = String(req.headers['content-type'] || 'application/octet-stream');
            const fileName = decodeURIComponent(String(req.headers['x-file-name'] || 'upload.bin'));
            const args = ['scripts/convert_file.py', fileName, contentType];
            const localVenvPython = process.platform === 'win32'
              ? '.venv\\Scripts\\python.exe'
              : './.venv/bin/python';
            const preferred = process.env.PYTHON_EXECUTABLE || localVenvPython;
            const fallbackCommands = process.platform === 'win32'
              ? [preferred, 'python', 'py']
              : [preferred, 'python3', 'python'];
            const commands = [...new Set(fallbackCommands)];

            const runPython = (command: string) => new Promise<{ ok: boolean; status: number; payload: unknown }>((resolve) => {
              const child = spawn(command, args, { cwd: process.cwd(), windowsHide: true });
              const out: Buffer[] = [];
              const err: Buffer[] = [];
              let settled = false;
              const finish = (result: { ok: boolean; status: number; payload: unknown }) => {
                if (!settled) { settled = true; resolve(result); }
              };
              child.stdout.on('data', (chunk) => out.push(Buffer.from(chunk)));
              child.stderr.on('data', (chunk) => err.push(Buffer.from(chunk)));
              child.on('error', (spawnError) => finish({ ok: false, status: 0, payload: { error: spawnError.message } }));
              child.on('close', (code) => {
                const raw = Buffer.concat(out).toString('utf8').trim();
                try {
                  const payload = JSON.parse(raw);
                  finish({ ok: code === 0, status: code === 0 ? 200 : 400, payload });
                } catch {
                  const stderr = Buffer.concat(err).toString('utf8').trim();
                  finish({ ok: false, status: 0, payload: { error: stderr || 'MarkItDown returned an unreadable response.' } });
                }
              });
              child.stdin.end(body);
            });

            let result = await runPython(commands[0]);
            for (let i = 1; !result.ok && i < commands.length; i += 1) {
              const detail = String((result.payload as { error?: string }).error || '');
              if (!detail.includes('ENOENT') && result.status !== 0) break;
              result = await runPython(commands[i]);
            }
            if (!result.ok && result.status === 0) {
              const detail = String((result.payload as { error?: string }).error || 'Python could not be started.');
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: `Python/MarkItDown is unavailable. Install Python 3.10+ and run: python -m pip install -r requirements.txt. ${detail}` }));
              return;
            }
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(result.payload));
            return;
          }

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
            else if (value) headers.set(key, value);
          }

          const request = new Request(`http://localhost${req.url ?? pathname}`, {
            method: req.method ?? 'GET',
            headers,
            body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : body,
          });
          const { default: handler } = await TS_ROUTES[pathname]!();
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Local API request failed.';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { port: 5173 },
});
