export function parseMoney(value:string):number {
  const raw=value.trim().replace(/^[$£€]\s*/, '');
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw))throw Error('Enter a valid non-negative amount.');
  const cleaned=raw.replaceAll(',','');
  if(!/\d/.test(cleaned)||!/^\d+(?:\.\d{1,2})?$/.test(cleaned)||!Number.isFinite(Number(cleaned))||Number(cleaned)<0)throw Error('Enter a valid non-negative amount.');
  return Number(cleaned);
}
export function validateUploads(files:File[]):void {
  if(files.length<1||files.length>3)throw Error('Choose between one and three files.');
  for(const file of files){if(file.size===0||file.size>3*1024*1024||!['application/pdf','image/png','image/jpeg'].includes(file.type))throw Error('Use PDF, PNG or JPEG files up to 3 MB each.');}
}
