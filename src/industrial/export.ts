import { documents, pending, forms } from './offline';
export async function exportPending(userId:number) {
  const [turns,operations,drafts]=await Promise.all([documents(userId),pending(userId),forms(userId)]);
  const body={schema_version:2,exported_at:new Date().toISOString(),user_id:userId,turns,operations,drafts};
  const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='gulliver-pendientes-'+userId+'.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
