import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Do not pass application credentials or load the project's .env files.
const allowed=new Set(['systemroot','windir','path','pathext','temp','tmp','comspec','localappdata']);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>allowed.has(key.toLowerCase())));
const child=spawn(process.execPath,['--import','tsx','server/collection-demo.mjs',...process.argv.slice(2)],{cwd:fileURLToPath(new URL('../',import.meta.url)),env,stdio:'inherit',windowsHide:true});
child.on('error',()=>{console.error('Could not start local collection demo.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
