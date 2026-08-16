import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Plus, Trash2, FileSpreadsheet, Gauge } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { AyudaTip } from "../components/AyudaTip";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { CampoFecha } from "../components/CampoFecha";
import { hoyLocal } from "../lib/fechas";
import { fmtMoney, type Category } from "./types";
import { LINEA_AUTO, lineaPorNumero } from "./impuestos";
import { usePaisImpuestos } from "./paisImpuestos";
import { updateCategoryBusinessPct } from "./data";
import {
  bitacoraCSV, borrarLectura, borrarViaje, guardarLectura, guardarVehiculo, guardarViaje,
  listarLecturas, listarVehiculos, listarViajes, usoDelAuto,
  type Lectura, type UsoDelAuto, type Vehiculo, type Viaje,
} from "./auto";

// El auto y sus kilómetros.
//
// Lo que se deduce de un auto no es lo que costó: es la parte de sus gastos
// que corresponde al trabajo, y esa parte se mide en kilómetros. Sin bitácora
// no hay porcentaje, y sin porcentaje la deducción no se sostiene por mucho
// que los gastos estén bien anotados. Esta pantalla existe para que llevar la
// bitácora cueste diez segundos y no sea lo primero que se abandona.

export function AutoTab({ categories, onCambio }: {
  categories: Category[];
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [pais] = usePaisImpuestos();

  const [autos, setAutos] = useState<Vehiculo[]>([]);
  const [autoId, setAutoId] = useState("");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nuevoAuto, setNuevoAuto] = useState(false);
  const [guia, setGuia] = useState(false);

  const anioHoy = String(new Date().getFullYear());
  const [anio, setAnio] = useState(anioHoy);

  const auto = autos.find((a) => a.id === autoId) ?? null;

  const cargarAutos = useCallback(async () => {
    try {
      const lista = await listarVehiculos();
      setAutos(lista);
      setAutoId((id) => (lista.some((a) => a.id === id) ? id : lista[0]?.id ?? ""));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    if (!id) { setLecturas([]); setViajes([]); return; }
    try {
      const [l, v] = await Promise.all([listarLecturas(id), listarViajes(id)]);
      setLecturas(l);
      setViajes(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { void cargarAutos(); }, [cargarAutos]);
  useEffect(() => { void cargarDetalle(autoId); }, [autoId, cargarDetalle]);

  const anios = useMemo(() => {
    const set = new Set<string>([anioHoy]);
    for (const l of lecturas) set.add(l.date.slice(0, 4));
    for (const v of viajes) set.add(v.date.slice(0, 4));
    return [...set].sort().reverse();
  }, [lecturas, viajes, anioHoy]);

  const uso = useMemo(() => usoDelAuto(anio, lecturas, viajes), [anio, lecturas, viajes]);

  // Las categorías que van a la línea del auto: son las que este porcentaje
  // puede corregir. Si no hay ninguna, ofrecerlo no serviría de nada.
  const lineaAuto = LINEA_AUTO[pais];
  const catsDelAuto = useMemo(
    () => (lineaAuto ? categories.filter((c) => c.type === "expense" && c.tax_line === lineaAuto) : []),
    [categories, lineaAuto],
  );

  async function aplicarPorcentaje() {
    try {
      setAviso(null);
      for (const c of catsDelAuto) {
        await updateCategoryBusinessPct(c.id, uso.porcentaje === 100 ? null : uso.porcentaje);
      }
      onCambio();
      setAviso(`${tr("Listo: ahora esas categorías se deducen al")} ${uso.porcentaje}%.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function exportar() {
    if (!auto) return;
    const url = URL.createObjectURL(new Blob([bitacoraCSV(auto, uso, viajes)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitacora-${auto.name.replace(/\s+/g, "-").toLowerCase()}-${anio}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  if (cargando) return <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>;

  if (err) {
    return (
      <div className="card pad" style={{ borderLeft: "3px solid var(--err)" }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{err}</p>
      </div>
    );
  }

  if (autos.length === 0 && !nuevoAuto) {
    return (
      <div className="card pad">
        <h3 style={{ marginBottom: 8 }}>{tr("Todavía no hay ningún auto")}</h3>
        <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 12, maxWidth: "62ch" }}>
          {tr("Si usas el auto para trabajar, puedes deducir la parte de sus gastos que corresponde al trabajo. Esa parte se mide en kilómetros, y por eso hace falta llevar la cuenta: sin ella no hay proporción que mostrar.")}
        </p>
        <button className="btn primary" {...sinRobarFoco} onClick={() => setNuevoAuto(true)}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Agregar el auto")}
        </button>
      </div>
    );
  }

  return (
    <>
      {aviso && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--ok)", marginBottom: 14, fontSize: 13.5 }}>
          {aviso}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {autos.length > 0 && (
          <div style={{ minWidth: 190, flex: 1, maxWidth: 280 }}>
            <Selector compacto value={autoId} ariaLabel={tr("Auto")}
              opciones={autos.map((a) => ({ value: a.id, label: a.plate ? `${a.name} · ${a.plate}` : a.name }))}
              onChange={setAutoId} />
          </div>
        )}
        <div style={{ width: 110 }}>
          <Selector compacto value={anio} ariaLabel={tr("Año")}
            opciones={anios.map((a) => ({ value: a, label: a }))} onChange={setAnio} />
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setNuevoAuto(true)}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Otro auto")}
        </button>
      </div>

      <ResumenUso uso={uso} tr={tr} />

      {uso.estado === "listo" && catsDelAuto.length > 0 && (
        <div className="card pad" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
            {tr("Tienes")} {catsDelAuto.length}{" "}
            {catsDelAuto.length === 1 ? tr("categoría en") : tr("categorías en")}{" "}
            <b>{lineaPorNumero(lineaAuto, pais)?.es ?? tr("gastos del auto")}</b>
            {": "}{catsDelAuto.map((c) => c.name).join(", ")}.{" "}
            {tr("Puedo dejarlas deduciendo justo este porcentaje.")}
          </p>
          <button className="btn primary" {...sinRobarFoco} onClick={() => void aplicarPorcentaje()}>
            {tr("Usar el")} {uso.porcentaje}% {tr("en esas categorías")}
          </button>
        </div>
      )}

      <div className="panelgrid">
        <PanelViajes viajes={viajes} anio={anio} autoId={autoId} tr={tr}
          onCambio={() => void cargarDetalle(autoId)} onError={setErr} />
        <PanelOdometro lecturas={lecturas} anio={anio} autoId={autoId} tr={tr}
          onCambio={() => void cargarDetalle(autoId)} onError={setErr} />
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="btn ghost" {...sinRobarFoco} disabled={!auto || viajes.length === 0} onClick={exportar}>
            <FileSpreadsheet size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {tr("Exportar la bitácora del año")}
          </button>
        </div>
        <button type="button" className="linklike" style={{ fontSize: 12.5, fontWeight: 600 }}
          onClick={() => setGuia(!guia)}>
          {guia ? "▾" : "▸"} {tr("¿Qué pide exactamente el fisco?")}
        </button>
        {guia && <Guia tr={tr} pais={pais} auto={auto} />}
      </div>

      {nuevoAuto && (
        <ModalAuto tr={tr} onClose={() => setNuevoAuto(false)}
          onGuardado={() => { setNuevoAuto(false); void cargarAutos(); }}
          onError={setErr} />
      )}
    </>
  );
}

function ResumenUso({ uso, tr }: { uso: UsoDelAuto; tr: (k: string) => string }) {
  const mensajes: Record<UsoDelAuto["estado"], string> = {
    listo: "De cada cien kilómetros del año, esos fueron de trabajo. Es la proporción con la que se deducen los gastos del auto.",
    faltanLecturas: "Faltan lecturas del odómetro. Hacen falta dos, una al empezar y otra al terminar, porque los kilómetros totales del año salen de la resta. Sin eso no hay porcentaje, y prefiero no inventarte uno.",
    sinViajes: "El odómetro está, pero no hay ningún viaje de trabajo anotado. Anota los que hiciste y el porcentaje aparece solo.",
    incoherente: "Los viajes de trabajo suman más kilómetros que los que marcó el odómetro, así que hay algo mal anotado. Revisa las lecturas o los viajes antes de usar este número.",
  };
  const tono: Record<UsoDelAuto["estado"], string> = {
    listo: "var(--ok)", faltanLecturas: "var(--muted)", sinViajes: "var(--muted)", incoherente: "var(--err)",
  };

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="card stat">
          <div className="k">
            {tr("Uso de trabajo")}
            <AyudaTip etiqueta={tr("Qué significa")} texto={tr("Los kilómetros de trabajo divididos por los kilómetros totales del año. Es la única forma de repartir los gastos del auto entre lo tuyo y lo del negocio, y es la que pide el formulario.")} />
          </div>
          <div className="v tnum" style={{ color: uso.estado === "listo" ? "var(--ok)" : "var(--muted)" }}>
            {uso.estado === "listo" ? `${uso.porcentaje}%` : "—"}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Kilómetros de trabajo")}</div>
          <div className="v tnum">{uso.kmNegocio.toLocaleString("es-CL")}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Kilómetros del año")}</div>
          <div className="v tnum">{uso.kmTotales ? uso.kmTotales.toLocaleString("es-CL") : "—"}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Viajes anotados")}</div>
          <div className="v tnum">{uso.viajes}</div>
        </div>
      </div>
      <p style={{
        fontSize: 12.5, color: tono[uso.estado], lineHeight: 1.55,
        marginBottom: 14, maxWidth: "70ch",
      }}>
        {tr(mensajes[uso.estado])}
      </p>
    </>
  );
}

function PanelViajes({ viajes, anio, autoId, tr, onCambio, onError }: {
  viajes: Viaje[];
  anio: string;
  autoId: string;
  tr: (k: string) => string;
  onCambio: () => void;
  onError: (m: string) => void;
}) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [km, setKm] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const suyos = viajes.filter((v) => v.date.startsWith(anio));

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarViaje({
        vehicle_id: autoId, date: fecha, km: Number(km),
        destination: destino.trim() || null, purpose: motivo.trim() || null,
      });
      // La fecha se deja como está: cuando uno se pone al día anota varios
      // viajes seguidos del mismo día o de días cercanos.
      setKm(""); setDestino(""); setMotivo("");
      onCambio();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="card panel">
      <h3 style={{ marginBottom: 4 }}>{tr("Viajes de trabajo")}</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Solo los de trabajo. Los personales salen por resta, y pedirte que anotes cada ida al supermercado es la forma segura de que dejes de anotar.")}
      </p>

      <form onSubmit={(e) => void agregar(e)} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 132, flex: 1 }}>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha")} conBorrar={false} />
          </div>
          <input type="number" min={1} step="any" inputMode="numeric" required value={km}
            onChange={(e) => setKm(e.target.value)} placeholder={tr("Km")} aria-label={tr("Kilómetros")}
            style={{ width: 90 }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <input type="text" maxLength={80} value={destino} onChange={(e) => setDestino(e.target.value)}
            placeholder={tr("A dónde")} aria-label={tr("A dónde")} style={{ flex: 1, minWidth: 120 }} />
          <input type="text" maxLength={80} value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder={tr("Para qué")} aria-label={tr("Para qué")} style={{ flex: 1, minWidth: 120 }} />
        </div>
        <button className="btn primary" {...sinRobarFoco} disabled={ocupado}
          style={{ marginTop: 8, fontSize: 13, padding: "7px 15px" }}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Anotar el viaje")}
        </button>
      </form>

      {suyos.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{tr("Ningún viaje anotado en")} {anio}.</p>
      )}
      {suyos.map((v) => (
        <div key={v.id} style={{
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          borderTop: "1px solid var(--line-soft)", padding: "8px 0", fontSize: 13,
        }}>
          <span className="tnum" style={{ color: "var(--muted)", fontSize: 12, minWidth: 82 }}>{v.date}</span>
          <span style={{ flex: 1, minWidth: 110 }}>
            {v.destination || tr("Sin destino")}
            {v.purpose && <span style={{ color: "var(--muted)", fontSize: 11.5 }}> · {v.purpose}</span>}
          </span>
          <b className="tnum" style={{ whiteSpace: "nowrap" }}>{Number(v.km).toLocaleString("es-CL")} km</b>
          <button className="xdel" aria-label={tr("Borrar el viaje")}
            onClick={async () => {
              try { await borrarViaje(v.id); onCambio(); }
              catch (ex) { onError(ex instanceof Error ? ex.message : String(ex)); }
            }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function PanelOdometro({ lecturas, anio, autoId, tr, onCambio, onError }: {
  lecturas: Lectura[];
  anio: string;
  autoId: string;
  tr: (k: string) => string;
  onCambio: () => void;
  onError: (m: string) => void;
}) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [km, setKm] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarLectura(autoId, fecha, Number(km), null);
      setKm("");
      onCambio();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="card panel">
      <h3 style={{ marginBottom: 4 }}>
        <Gauge size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
        {tr("Lecturas del odómetro")}
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("El número que marca el tablero. Con una al empezar el año y otra al terminarlo basta: de la resta salen los kilómetros totales.")}
      </p>

      <form onSubmit={(e) => void agregar(e)} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 132, flex: 1 }}>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha")} conBorrar={false} />
          </div>
          <input type="number" min={0} step="any" inputMode="numeric" required value={km}
            onChange={(e) => setKm(e.target.value)} placeholder={tr("Km del tablero")}
            aria-label={tr("Km del tablero")} style={{ width: 118 }} />
          <button className="btn primary" {...sinRobarFoco} disabled={ocupado}
            style={{ fontSize: 13, padding: "7px 15px" }}>{tr("Anotar")}</button>
        </div>
      </form>

      {lecturas.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{tr("Todavía no hay lecturas.")}</p>
      )}
      {lecturas.map((l) => (
        <div key={l.id} style={{
          display: "flex", gap: 10, alignItems: "center",
          borderTop: "1px solid var(--line-soft)", padding: "8px 0", fontSize: 13,
          opacity: l.date.startsWith(anio) ? 1 : 0.6,
        }}>
          <span className="tnum" style={{ color: "var(--muted)", fontSize: 12, flex: 1 }}>{l.date}</span>
          <b className="tnum" style={{ whiteSpace: "nowrap" }}>{Number(l.km).toLocaleString("es-CL")} km</b>
          <button className="xdel" aria-label={tr("Borrar la lectura")}
            onClick={async () => {
              try { await borrarLectura(l.id); onCambio(); }
              catch (ex) { onError(ex instanceof Error ? ex.message : String(ex)); }
            }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function Guia({ tr, pais, auto }: {
  tr: (k: string) => string;
  pais: string;
  auto: Vehiculo | null;
}) {
  return (
    <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: "68ch" }}>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("La bitácora.")}</b>{" "}
        {tr("De cada viaje de trabajo se pide la fecha, a dónde fuiste, para qué y cuántos kilómetros. Por eso están esos cuatro campos y no solo el número.")}
      </p>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("El odómetro.")}</b>{" "}
        {tr("Los kilómetros totales del año se prueban con la lectura del tablero al empezar y al terminar. Anótala el primero de enero y el treinta y uno de diciembre, o el día que compraste el auto si fue a mitad de año.")}
      </p>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("Lo que se deduce.")}</b>{" "}
        {tr("La bencina, la mantención, el seguro y el permiso de circulación, multiplicados por el porcentaje de uso de trabajo. Por eso el botón de aquí arriba pone ese porcentaje en las categorías del auto.")}
      </p>
      <p style={{ marginBottom: 8, color: "var(--warn)" }}>
        <b>{tr("Lo que compraste no es un gasto.")}</b>{" "}
        {tr("El precio del auto no se deduce el año que lo compras: se reparte en varios años por depreciación, y eso tiene reglas propias. Guarda la fecha y el monto de la compra y pregúntaselo a tu contador.")}
        {auto?.purchase_price ? ` (${tr("el tuyo")}: ${fmtMoney(Number(auto.purchase_price), auto.currency)}${auto.purchase_date ? `, ${auto.purchase_date}` : ""})` : ""}
      </p>
      {pais === "CL" && (
        <p style={{ marginBottom: 8, color: "var(--warn)" }}>
          <b>{tr("Ojo en Chile.")}</b>{" "}
          {tr("Los gastos de automóviles tienen restricciones especiales y muchas veces no se aceptan como gasto, salvo que tu actividad los requiera. Antes de usar esto en tu declaración, confírmalo con tu contador.")}
        </p>
      )}
      <p style={{ color: "var(--muted)", fontSize: 11.5 }}>
        {tr("NucleoOS no es un asesor tributario. La app lleva la cuenta y hace la división; qué se deduce y cómo lo decides tú o tu contador.")}
      </p>
    </div>
  );
}

function ModalAuto({ tr, onClose, onGuardado, onError }: {
  tr: (k: string) => string;
  onClose: () => void;
  onGuardado: () => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarVehiculo({
        name: name.trim(),
        plate: plate.trim() || null,
        purchase_date: fecha || null,
        purchase_price: precio ? Number(precio) : null,
        currency: "CAD",
        notes: null,
      });
      onGuardado();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
      setOcupado(false);
    }
  }

  return (
    <div className="tp-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>
          <Car size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          {tr("El auto")}
        </h3>
        <p style={{ lineHeight: 1.55, marginBottom: 12 }}>
          {tr("La compra no se deduce como gasto del año, pero conviene tenerla anotada: la depreciación se calcula desde ahí.")}
        </p>
        <form onSubmit={(e) => void guardar(e)}>
          <div className="field">
            <label htmlFor="auto-nombre">{tr("Nombre")}</label>
            <input id="auto-nombre" type="text" required maxLength={60} value={name}
              placeholder={tr("Honda Civic")} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="auto-patente">{tr("Patente (opcional)")}</label>
            <input id="auto-patente" type="text" maxLength={20} value={plate}
              onChange={(e) => setPlate(e.target.value)} />
          </div>
          <div className="field">
            <label>{tr("Fecha de compra (opcional)")}</label>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha de compra")} />
          </div>
          <div className="field">
            <label htmlFor="auto-precio">{tr("Cuánto costó (opcional)")}</label>
            <input id="auto-precio" type="number" min={0} step="any" inputMode="decimal" value={precio}
              onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button type="button" className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
            <button className="btn primary" {...sinRobarFoco} disabled={ocupado}>{tr("com.guardar")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
