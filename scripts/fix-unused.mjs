import ts from 'typescript';
import fs from 'node:fs';
const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.app.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const versions = new Map();
const host = {
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: f => String(versions.get(f) || 0),
  getScriptSnapshot: f => fs.existsSync(f) ? ts.ScriptSnapshot.fromString(fs.readFileSync(f, 'utf8')) : undefined,
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists, readFile: ts.sys.readFile, readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
let changed = 0;
for (const file of parsed.fileNames) {
  const diagnostics = service.getSemanticDiagnostics(file).filter(d => [6133].includes(d.code));
  if (!diagnostics.length) continue;
  const actions = service.getCodeFixesAtPosition(file, diagnostics[0].start, diagnostics[0].start+diagnostics[0].length, [diagnostics[0].code], {}, {});
  const action = actions.find(a => a.fixId) || actions.find(a => a.fixName === 'unusedIdentifier');
  if (!action) continue;
  const combined = action.fixId ? service.getCombinedCodeFix({type:'file', fileName:file}, action.fixId, {}, {}) : action;
  for (const change of combined.changes) {
    let content = fs.readFileSync(change.fileName, 'utf8');
    for (const edit of [...change.textChanges].sort((a,b)=>b.span.start-a.span.start)) content=content.slice(0,edit.span.start)+edit.newText+content.slice(edit.span.start+edit.span.length);
    fs.writeFileSync(change.fileName,content);
    versions.set(change.fileName,(versions.get(change.fileName)||0)+1);
    changed++;
  }
}
console.log('Removed unused declarations in',changed,'files');
