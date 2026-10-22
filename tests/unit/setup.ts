import 'fake-indexeddb/auto';
import { vi } from 'vitest';
const windowTarget = new EventTarget();
vi.stubGlobal('window', windowTarget);
vi.stubGlobal('navigator', { onLine: true });
vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} removeEventListener() {} });

const memory = new Map<string,string>();
vi.stubGlobal('localStorage', { getItem:(key:string)=>memory.get(key)??null, setItem:(key:string,value:string)=>memory.set(key,value), removeItem:(key:string)=>memory.delete(key), clear:()=>memory.clear() });
