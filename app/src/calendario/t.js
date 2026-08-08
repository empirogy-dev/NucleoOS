function fmtISO(d){return d.toISOString().slice(0,10);}
function proximaOcurrencia(ancla, recurrencia, hoy){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ancla??""))return null;
  if(recurrencia==="oneTime")return ancla>=hoy?ancla:null;
  const now=new Date(hoy+"T00:00:00Z");const d=new Date(ancla+"T00:00:00Z");
  if(d>=now)return ancla;
  if(recurrencia==="monthly"){
    const diaPago=d.getUTCDate();let g=0;
    while(d<now&&g++<240){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);
      const ult=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
      d.setUTCDate(Math.min(diaPago,ult));}
    return fmtISO(d);
  }
  let g=0;while(d<now&&g++<500)d.setUTCDate(d.getUTCDate()+14);
  return fmtISO(d);
}
const hoy="2026-07-28";
const casos=[
  ["Tarjeta Mastercard","2026-03-15","monthly"],
  ["Seguro auto (dia 28)","2025-11-28","monthly"],
  ["Arriendo dia 31","2026-01-31","monthly"],
  ["Sueldo quincenal","2026-07-17","biweekly"],
  ["Pago unico pasado","2026-07-01","oneTime"],
  ["Pago unico futuro","2026-07-30","oneTime"],
  ["Ancla futura mensual","2026-08-05","monthly"],
];
for(const [n,a,r] of casos) console.log(String(n).padEnd(24), "ancla",a, r.padEnd(9), "->", proximaOcurrencia(a,r,hoy));
