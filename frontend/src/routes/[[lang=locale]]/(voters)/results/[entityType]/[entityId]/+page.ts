export async function load({params}) {
  return {
    entityType: params.entityType,
    entityId: params.entityId
  };
}
