# Variant C: keep the root host; the opener names the contexts its content needs via carriers.
import re
F='apps/frontend/src/'
def sub(path, old, new):
    s=open(path).read(); assert old in s, (path, old[:70]); open(path,'w').write(s.replace(old,new,1))
# filter: carrier
sub(F+'lib/contexts/filter/filterContext.svelte.ts',
"export function initFilterContext(",
"""/**
 * Capture the active `FilterContext` so a component rendered outside this subtree can re-provide it. Call during component init; call the returned function during the init of the component that should see it.
 */
export function carryFilterContext(): () => void {
  const ctx = getFilterContext();
  return () => setContext<FilterContext>(CONTEXT_KEY, ctx);
}

export function initFilterContext(""")
# voter: carrier (voter owns filter, so carrying voter carries filter)
sub(F+'lib/contexts/voter/voterContext.svelte.ts',
"/**\n * Initialize and return the context. This must be called before `getGlobalContext()`",
"""/**
 * Capture the voter context — and the filter context it initialises — so a component rendered outside the voter subtree (the app-wide drawer) can re-provide both. Call during component init; call the returned function during the init of the component that should see them.
 */
export function carryVoterContext(): () => void {
  const ctx = getVoterContext();
  const carryFilter = carryFilterContext();
  return () => {
    setContext<VoterContext>(CONTEXT_KEY, ctx);
    carryFilter();
  };
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()`""")
s=open(F+'lib/contexts/voter/voterContext.svelte.ts').read()
m=re.search(r"import \{([^}]*)\} from '\$lib/contexts/filter';", s) or re.search(r"import \{([^}]*initFilterContext[^}]*)\} from '([^']+)';", s)
assert m, 'filter import not found'
s=s.replace(m.group(0), m.group(0).replace('initFilterContext','carryFilterContext, initFilterContext',1),1); open(F+'lib/contexts/voter/voterContext.svelte.ts','w').write(s)
sub(F+'lib/contexts/voter/index.ts',"export { getVoterContext, initVoterContext }","export { carryVoterContext, getVoterContext, initVoterContext }")
# host state: carriers instead of a context map
p=F+'lib/components/modal/drawerHost/drawerHostState.svelte.ts'
sub(p,"  /** The opener's contexts (`getAllContexts()`), re-provided around `content`. */\n  contexts: Map<unknown, unknown>;\n",
"  /** The contexts `content` needs that the root layout does not provide, each captured by its module's `carry*Context()`. Omit when the root contexts suffice. */\n  carry?: Array<() => void>;\n")
# bridge: run carriers
p=F+'lib/components/modal/drawerHost/ContextBridge.svelte'
s=open(p).read()
s=s.replace("  for (const [key, value] of contexts) setContext(key, value);","  for (const provide of carry) provide();").replace("import { setContext } from 'svelte';\n","").replace("let { contexts, children }","let { carry = [], children }")
open(p,'w').write(s)
p=F+'lib/components/modal/drawerHost/ContextBridge.type.ts'
s=open(p).read()
s=re.sub(r"  /\*\*\n   \* The context map.*?contexts: Map<unknown, unknown>;","  /**\n   * Context carriers from the opener, each from a `carry*Context()` helper.\n   */\n  carry?: Array<() => void>;",s,flags=re.S); open(p,'w').write(s)
sub(F+'lib/components/modal/drawerHost/DrawerHost.svelte',"<ContextBridge contexts={shown.contexts}>","<ContextBridge carry={shown.carry}>")
# openers
p=F+'lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte'
s=open(p).read()
s=s.replace("getAllContexts, untrack }","untrack }").replace("  const contexts = getAllContexts();\n","  const carry = [carryVoterContext()];\n")
s=s.replace("  import { drawerHost } from '$lib/components/modal/drawerHost';\n","  import { drawerHost } from '$lib/components/modal/drawerHost';\n  import { carryVoterContext } from '$lib/contexts/voter';\n")
s=re.sub(r"\n(\s*)contexts,(?=\n)",r"\n\1carry,",s); open(p,'w').write(s)
p=F+'lib/components/questions/QuestionExtendedInfoButton.svelte'
s=open(p).read()
s=s.replace("  import { getAllContexts } from 'svelte';\n","").replace("  const contexts = getAllContexts();\n","")
s=s.replace("      content,\n      contexts\n","      content\n"); open(p,'w').write(s)
assert 'contexts' not in re.sub(r'<!--.*?-->','',s,flags=re.S).split('<script')[1].split('</script>')[0] , 'question button still references contexts'
print('035c applied')
