const sections = ['features', 'bugFixes', 'changedBehaviour', 'knownLimitations']
const items = version => Object.fromEntries(sections.map(section => [section, new Map((version.package?.[section] || []).map(item => [item.itemId, item]))]))

export function versionDiff(oldVersion, newVersion) {
  const oldItems = items(oldVersion), newItems = items(newVersion), result = {}
  for (const section of sections) {
    const added = [], removed = [], modified = []
    for (const [id, item] of newItems[section]) !oldItems[section].has(id) ? added.push(id) : JSON.stringify(oldItems[section].get(id)) !== JSON.stringify(item) && modified.push(id)
    for (const id of oldItems[section].keys()) if (!newItems[section].has(id)) removed.push(id)
    result[section] = { added, removed, modified }
  }
  return result
}
