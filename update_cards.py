import re

file_path = r'c:\Users\program jr\Documents\GitHub\gulliver-frontend\src\components\ConfigurationView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def div_replacer(match):
    var_name = match.group(1)
    full_match = match.group(0)
    
    if var_name not in ['p', 'm', 'cat', 'fam', 's', 'c']:
        return full_match
        
    injected = full_match.replace(f'key={{{var_name}.id}}', 
        f"whileHover={{{{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}}}\n                key={{{var_name}.id}}\n                onClick={{() => startEdit({var_name})}}")
    
    injected = re.sub(r"(transition:\s*'all 0\.2s ease',?)", r"\1 cursor: 'pointer',", injected)
    
    return injected

content = re.sub(r'<motion\.div\s+initial=\{.*?\}\s+animate=\{.*?\}.*?key=\{([a-zA-Z0-9_]+)\.id\}\s+style=\{\{[\s\S]*?\}\}\s*>', div_replacer, content)

def button_replacer(match):
    var_name = match.group(1)
    
    new_buttons = f"""<div style={{{{ display: 'flex', gap: 4 }}}}>
                  {{confirmDeleteId === {var_name}.id ? (
                    <div style={{{{ display: 'flex', gap: 4 }}}}>
                      <motion.button whileTap={{{{ scale: 0.9 }}}} onClick={{(e) => {{ e.stopPropagation(); handleDelete({var_name}.id); }}}}
                        style={{{{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}}}
                      >✓</motion.button>
                      <motion.button whileTap={{{{ scale: 0.9 }}}} onClick={{(e) => {{ e.stopPropagation(); setConfirmDeleteId(null); }}}}
                        style={{{{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}}}
                      ><X size={{14}} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{{{ scale: 1.1 }}}} whileTap={{{{ scale: 0.9 }}}}
                      onClick={{(e) => {{ e.stopPropagation(); setConfirmDeleteId({var_name}.id); }}}}
                      style={{{{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}}}
                    ><Trash2 size={{18}} /></motion.button>
                  )}}
                </div>"""
                
    if 'flexShrink: 0' in match.group(0):
       new_buttons = new_buttons.replace("style={{ display: 'flex', gap: 4 }}", "style={{ display: 'flex', gap: 4, flexShrink: 0 }}")
       
    return new_buttons

button_regex = r'<div style=\{\{\s*display:\s*\'flex\',\s*gap:\s*4(?:,\s*flexShrink:\s*0)?\s*\}\}\>[\s\S]*?<Pencil size=\{14\}\s*/>[\s\S]*?\{confirmDeleteId === ([a-zA-Z0-9_]+)\.id \? \([\s\S]*?<Trash2 size=\{14\}\s*/>[\s\S]*?</div>'

content = re.sub(button_regex, button_replacer, content)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ConfigurationView.tsx")
