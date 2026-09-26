# Variant D: keep the root dialog shell; content renders in the opener's tree and is portalled into the host's slot.
import re, shutil, sys
SP=sys.argv[1]
F='apps/frontend/src/'
D=F+'lib/components/modal/drawerHost/'
def sub(path, old, new):
    s=open(path).read(); assert old in s, (path, old[:70]); open(path,'w').write(s.replace(old,new,1))
shutil.copy(SP+'/DrawerPortal.svelte', D+'DrawerPortal.svelte')
# state: no content/contexts; a slot the portal targets
p=D+'drawerHostState.svelte.ts'
sub(p,"  content: Snippet;\n","")
sub(p,"  /** The opener's contexts (`getAllContexts()`), re-provided around `content`. */\n  contexts: Map<unknown, unknown>;\n","")
sub(p,"import type { Snippet } from 'svelte';\n","")
sub(p,"  current = $state<DrawerPayload | null>(null);\n","  current = $state<DrawerPayload | null>(null);\n  /** The host's content element; `DrawerPortal` moves the opener's rendered content into it. */\n  slot = $state<HTMLElement | null>(null);\n")
p=D+'index.ts'
sub(p,"export { default as ContextBridge } from './ContextBridge.svelte';\nexport * from './ContextBridge.type';\n","")
s=open(p).read(); s=s.replace("export { default as DrawerHost } from './DrawerHost.svelte';\n","export { default as DrawerHost } from './DrawerHost.svelte';\nexport { default as DrawerPortal } from './DrawerPortal.svelte';\n"); open(p,'w').write(s)
import os; os.remove(D+'ContextBridge.svelte'); os.remove(D+'ContextBridge.type.ts')
# host
p=D+'DrawerHost.svelte'
sub(p,"  import ContextBridge from './ContextBridge.svelte';\n","")
s=open(p).read()
s=re.sub(r"      \{#if shown\}\n        \{#key shown.key\}.*?\{/key\}\n      \{/if\}\n",
"      <div bind:this={drawerHost.slot} class=\"min-h-full\"></div>\n", s, flags=re.S)
s=s.replace("          dialog?.close();\n          shown = null;\n","          dialog?.close();\n          shown = null;\n          drawerHost.slot?.replaceChildren();\n")
s=s.replace("          dialog.close();\n          shown = null;\n","          dialog.close();\n          shown = null;\n          drawerHost.slot?.replaceChildren();\n")
open(p,'w').write(s)
assert 'ContextBridge' not in s.split('</script>')[1]
# entity opener
p=F+'lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte'
s=open(p).read()
s=s.replace("getAllContexts, untrack }","untrack }").replace("  const contexts = getAllContexts();\n","")
s=s.replace("import { drawerHost } from '$lib/components/modal/drawerHost';","import { DrawerPortal, drawerHost } from '$lib/components/modal/drawerHost';")
s=re.sub(r"\n\s*content,\n\s*contexts,","",s)
s=s.replace("{#snippet content()}\n  <EntityDetails entity={shownEntity} class=\"min-h-full\" />\n{/snippet}",
"<DrawerPortal>\n  <EntityDetails entity={shownEntity} class=\"min-h-full\" />\n</DrawerPortal>")
open(p,'w').write(s)
# question info button: render the portal only while the host shows this button's payload
p=F+'lib/components/questions/QuestionExtendedInfoButton.svelte'
s=open(p).read()
s=s.replace("  import { getAllContexts } from 'svelte';\n","").replace("  const contexts = getAllContexts();\n","")
s=s.replace("import { drawerHost } from '$lib/components/modal/drawerHost';","import { DrawerPortal, drawerHost } from '$lib/components/modal/drawerHost';")
s=s.replace("      title: () => shownQuestion.text,\n      content,\n      contexts\n","      title: () => shownQuestion.text\n")
s=s.replace("{#snippet content()}","{#if drawerHost.current?.key === key}\n<DrawerPortal>",1)
s=re.sub(r"(data-testid=\"voter-questions-popup-info-modal\" />)\n\{/snippet\}", r"\1\n</DrawerPortal>\n{/if}", s)
open(p,'w').write(s)
print('035d applied')
