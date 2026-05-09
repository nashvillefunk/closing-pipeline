import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG — replace with your new standalone project ───
const SURL = "https://tmkjtcockkmntvsgbhal.supabase.co";
const SKEY = "sb_publishable_QhtpE94KMnx4hjhifOwFxA_b6JpNluN";
const supabase = createClient(SURL, SKEY);

// ─── SHARED PASSWORD ───
const APP_PASSWORD = "nxtclosing2026";

// ─── NXT BRAND ───
const NXT = {
  dark:   "#1a2045",
  royal:  "#2242b2",
  mid:    "#1c6bd8",
  sky:    "#1f8ae6",
  purple: "#b971fd",
  ltblue: "#78d2ff",
  ltpurp: "#d2aaf8",
  ltgray: "#f4f6fb",
  border: "#e2e6f3",
  text:   "#2d3458",
  muted:  "#8892b0",
};

// ─── MILESTONE CONFIG ───
const MILESTONES = {
  "Clear To Close":        { tab: 1, bg: "#e8f5e9", color: "#2e7d32", border: "#81c784" },
  "Docs Out":              { tab: 2, bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  "Docs Signed":           { tab: 2, bg: "#e8eaf6", color: "#283593", border: "#9fa8da" },
  "Loan Funded":           { tab: 3, bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
  "Broker Check Received": { tab: 3, bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
  "Loan Finalized":        { tab: 4, bg: "#e0f2f1", color: "#00695c", border: "#80cbc4" },
};

const TAB_MILESTONES = {
  1: ["Clear To Close"],
  2: ["Docs Out", "Docs Signed"],
  3: ["Loan Funded", "Broker Check Received"],
  4: ["Loan Finalized"],
};

const MORTGAGE_TYPES = ["Conventional","FHA","VA","Non-QM","USDA","Jumbo","IRRRL","Other"];
const LOAN_TYPES    = ["Purchase","Refinance","Cash-Out","Other"];
const LENDERS       = ["UWM","eLend","EPM","Plaza","Windsor","The Loan Store","Newrez","Eleven Mortgage","Other"];
const CLOSERS       = ["JR Bartram","Unassigned"];

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── DB MAPPERS ───
function toDB(f) {
  return {
    id:               f.id || uid(),
    borrower:         f.borrower || "",
    arive_loan_num:   f.ariveLoanNum || "",
    lender:           f.lender || "",
    lender_loan_num:  f.lenderLoanNum || "",
    est_closing_date: f.estClosingDate || null,
    fund_date:        f.fundDate || null,
    lock_expiration:  f.lockExpiration || "",
    loan_type:        f.loanType || "",
    mortgage_type:    f.mortgageType || "",
    lo:               f.lo || "",
    processor:        f.processor || "",
    settlement_agent: f.settlementAgent || "",
    cd_status:        f.cdStatus || "",
    tolerance_cures:  f.toleranceCures || "",
    closer:           f.closer || "Unassigned",
    milestone:        f.milestone || "Clear To Close",
    notes:            f.notes || "",
    docs_signed_date: f.docsSignedDate || null,
    loan_funded_date: f.loanFundedDate || null,
    last_touch:       f.lastTouch || null,
    is_new:           f.isNew !== undefined ? f.isNew : true,
    created_at:       f.createdAt || new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  };
}

function fromDB(r) {
  return {
    id:              r.id,
    borrower:        r.borrower,
    ariveLoanNum:    r.arive_loan_num,
    lender:          r.lender,
    lenderLoanNum:   r.lender_loan_num,
    estClosingDate:  r.est_closing_date,
    fundDate:        r.fund_date,
    lockExpiration:  r.lock_expiration,
    loanType:        r.loan_type,
    mortgageType:    r.mortgage_type,
    lo:              r.lo,
    processor:       r.processor,
    settlementAgent: r.settlement_agent,
    cdStatus:        r.cd_status,
    toleranceCures:  r.tolerance_cures,
    closer:          r.closer,
    milestone:       r.milestone,
    notes:           r.notes,
    lastTouch:       r.last_touch,
    docsSignedDate:  r.docs_signed_date,
    loanFundedDate:  r.loan_funded_date,
    isNew:           r.is_new,
    createdAt:       r.created_at,
    updatedAt:       r.updated_at,
  };
}

// ─── UTILITIES ───
function daysToClose(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const close = new Date(dateStr + "T00:00:00");
  return Math.round((close - today) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DaysChip({ dateStr }) {
  const d = daysToClose(dateStr);
  if (d === null) return <span style={{ color: NXT.muted, fontSize: 12 }}>—</span>;
  const bg    = d < 0 ? "#ffebee" : d <= 1 ? "#fff8e1" : "#e8f5e9";
  const color = d < 0 ? "#c62828" : d <= 1 ? "#e65100" : "#2e7d32";
  const label = d < 0 ? `${Math.abs(d)}d past` : d === 0 ? "Today" : `${d}d`;
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: 10,
      padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function MilestoneBadge({ value, small }) {
  const cfg = MILESTONES[value] || { bg: NXT.ltgray, color: NXT.royal, border: NXT.border };
  return (
    <span style={{ display: "inline-block", padding: small ? "2px 7px" : "3px 10px",
      borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap" }}>
      {value || "—"}
    </span>
  );
}

function NewBadge() {
  return (
    <span style={{ background: "linear-gradient(135deg, #b971fd, #1f8ae6)",
      color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px",
      borderRadius: 8, letterSpacing: "0.5px", textTransform: "uppercase",
      animation: "nxtPulse 2s infinite" }}>
      NEW
    </span>
  );
}

// ─── UI PRIMITIVES ───
const iS = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: `1.5px solid ${NXT.border}`, fontSize: 13, color: NXT.text,
  background: "#fafbff", boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

function Field({ label, children, half }) {
  return (
    <div style={{ marginBottom: 14, width: half ? "calc(50% - 6px)" : "100%" }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: NXT.dark,
        marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
function Input({ label, half, ...props }) {
  return <Field label={label} half={half}><input style={iS} {...props} /></Field>;
}
function Sel({ label, half, options, ...props }) {
  return (
    <Field label={label} half={half}>
      <select style={{ ...iS, cursor: "pointer" }} {...props}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}
function FRow({ children }) {
  return <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{children}</div>;
}
function Btn({ children, onClick, variant = "primary", small, disabled }) {
  const styles = {
    primary:   { bg: NXT.royal,       color: "#fff",          border: "none" },
    success:   { bg: "#2e7d32",       color: "#fff",          border: "none" },
    danger:    { bg: "transparent",   color: "#e53935",       border: "1px solid #ffcdd2" },
    secondary: { bg: "transparent",   color: NXT.text,        border: `1.5px solid ${NXT.border}` },
    purple:    { bg: NXT.purple,      color: "#fff",          border: "none" },
    sky:       { bg: NXT.sky,         color: "#fff",          border: "none" },
  };
  const st = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: small ? "4px 10px" : "8px 18px", borderRadius: small ? 5 : 8,
        border: st.border, background: disabled ? "#e0e0e0" : st.bg,
        color: disabled ? "#9e9e9e" : st.color, fontWeight: small ? 600 : 700,
        cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 11 : 13,
        fontFamily: "inherit" }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, wide, extraWide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%",
        maxWidth: extraWide ? 1000 : wide ? 780 : 560,
        maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 14px", borderBottom: `1px solid ${NXT.border}`,
          position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: NXT.dark }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none",
            fontSize: 24, cursor: "pointer", color: "#9e9e9e", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── NOTES LOG ───
function NotesLog({ loanId, onNoteAdded }) {
  const [notes, setNotes]     = useState([]);
  const [text, setText]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    supabase.from("closing_notes").select("*")
      .eq("loan_id", loanId).order("created_at", { ascending: false })
      .then(({ data }) => { setNotes(data || []); setLoading(false); });
  }, [loanId]);

  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const row = { id: uid(), loan_id: loanId, note: text.trim(), created_at: now };
    const { error } = await supabase.from("closing_notes").insert(row);
    if (!error) { setNotes(n => [row, ...n]); setText(""); if (onNoteAdded) onNoteAdded(now.slice(0,10)); }
    setSaving(false);
  };

  const fmt = ts => new Date(ts).toLocaleDateString("en-US",
    { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Add a note... (⌘+Enter to save)"
        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) add(); }}
        style={{ ...iS, minHeight: 64, resize: "none", marginBottom: 6 }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Btn onClick={add} small>{saving ? "Saving..." : "Add Note"}</Btn>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", borderTop: `1px solid ${NXT.border}`, paddingTop: 10 }}>
        {loading && <div style={{ color: NXT.muted, fontSize: 12, textAlign: "center", padding: 12 }}>Loading...</div>}
        {!loading && notes.length === 0 && <div style={{ color: NXT.muted, fontSize: 12, textAlign: "center", padding: 12 }}>No notes yet</div>}
        {notes.map((n, i) => (
          <div key={n.id || i} style={{ marginBottom: 10, paddingBottom: 10,
            borderBottom: i < notes.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div style={{ fontSize: 10, color: "#90a4ae", marginBottom: 3, fontWeight: 600 }}>{fmt(n.created_at)}</div>
            <div style={{ fontSize: 12, color: NXT.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTLEMENT EMAIL COMPOSER ───
const INVOICE_ITEMS = [
  { id: "processing", label: "3rd Party Processing Fee", defaultAmt: 1295 },
  { id: "appraisal",  label: "Appraisal Fee",            defaultAmt: null },
  { id: "credit",     label: "Credit Report Fee",        defaultAmt: null },
  { id: "flood",      label: "Flood Cert Fee",           defaultAmt: null },
  { id: "recording",  label: "Recording Fees",           defaultAmt: null },
  { id: "survey",     label: "Survey Fee",               defaultAmt: null },
  { id: "pest",       label: "Pest Inspection",          defaultAmt: null },
  { id: "hoa",        label: "HOA Cert Fee",             defaultAmt: null },
  { id: "other",      label: "Other",                    defaultAmt: null },
];

function SettlementEmailModal({ loan, onClose }) {
  const [selected, setSelected] = useState({ processing: true });
  const [amounts, setAmounts]   = useState({ processing: 1295 });
  const [agentEmail, setAgentEmail] = useState(loan.settlementAgent || "");
  const [copied, setCopied]     = useState(false);

  const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const setAmt = (id, val) => setAmounts(a => ({ ...a, [id]: val }));

  const lines = INVOICE_ITEMS.filter(i => selected[i.id]);
  const total = lines.reduce((sum, i) => sum + (parseFloat(amounts[i.id]) || 0), 0);

  const emailBody =
`Hello,

Please see the closing fee breakdown for the following loan file:

Borrower:             ${loan.borrower || "—"}
Arive Loan #:         ${loan.ariveLoanNum || "—"}
Lender:               ${loan.lender || "—"}
Lender Loan #:        ${loan.lenderLoanNum || "—"}
Est. Closing Date:    ${fmtDate(loan.estClosingDate)}
Loan Officer:         ${loan.lo || "—"}
Processor:            ${loan.processor || "—"}

──────────────────────────────────────
CLOSING INVOICE
──────────────────────────────────────
${lines.map(i => `${i.label.padEnd(32)}$${(parseFloat(amounts[i.id]) || 0).toFixed(2)}`).join("\n")}
──────────────────────────────────────
TOTAL${" ".repeat(28)}$${total.toFixed(2)}

Please ensure these fees are reflected accurately on the Closing Disclosure.

Thank you,
NXT Processing · NMLS 1457759`;

  const copy = () => {
    navigator.clipboard.writeText(emailBody).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const openMail = () => {
    const sub = encodeURIComponent(`Closing Invoice — ${loan.borrower} / Arive #${loan.ariveLoanNum}`);
    window.location.href = `mailto:${agentEmail}?subject=${sub}&body=${encodeURIComponent(emailBody)}`;
  };

  return (
    <Modal title={`📧 Settlement Agent Email — ${loan.borrower}`} onClose={onClose} extraWide>
      <div style={{ display: "flex", gap: 24 }}>
        {/* Left: item selector */}
        <div style={{ flex: "0 0 340px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: NXT.dark, textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: 12 }}>Select Invoice Items</div>

          {INVOICE_ITEMS.map(item => (
            <div key={item.id}
              onClick={() => toggle(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                background: selected[item.id] ? "#f0f4ff" : "#fafbff",
                border: `1.5px solid ${selected[item.id] ? NXT.royal : NXT.border}`,
                transition: "all 0.12s" }}>
              <div style={{ width: 17, height: 17, borderRadius: 4, flexShrink: 0,
                background: selected[item.id] ? NXT.royal : "#fff",
                border: `2px solid ${selected[item.id] ? NXT.royal : "#ccc"}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selected[item.id] && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: NXT.text,
                fontWeight: selected[item.id] ? 600 : 400 }}>
                {item.label}
              </span>
              {selected[item.id] && (
                <input type="number" value={amounts[item.id] || ""}
                  onChange={e => { e.stopPropagation(); setAmt(item.id, e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  placeholder="0.00"
                  style={{ ...iS, width: 85, padding: "3px 8px", fontSize: 12 }} />
              )}
            </div>
          ))}

          {lines.length > 0 && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, textAlign: "right",
              background: `linear-gradient(135deg, ${NXT.royal}12, ${NXT.purple}12)`,
              border: `1px solid ${NXT.border}` }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: NXT.dark }}>
                Total: ${total.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: NXT.dark, textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: 12 }}>Email Preview</div>

          <Field label="Settlement Agent Email">
            <input style={iS} value={agentEmail}
              onChange={e => setAgentEmail(e.target.value)}
              placeholder="agent@titlecompany.com" />
          </Field>

          <pre style={{ background: "#f8f9fc", border: `1px solid ${NXT.border}`,
            borderRadius: 8, padding: "14px 16px", fontSize: 11.5, lineHeight: 1.65,
            whiteSpace: "pre-wrap", color: NXT.text, maxHeight: 380,
            overflowY: "auto", fontFamily: "'Courier New', monospace", margin: 0 }}>
            {emailBody}
          </pre>

          <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end",
            flexWrap: "wrap" }}>
            <Btn onClick={copy} variant="secondary" small>
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </Btn>
            {agentEmail && (
              <Btn onClick={openMail} variant="sky" small>Open in Mail App</Btn>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: NXT.muted, textAlign: "right" }}>
            Direct send via Zap available once email templates are finalized
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── LOAN FILE MODAL ───
function LoanModal({ loan, onClose, onSave, onDelete }) {
  const [form, setForm]       = useState({ ...loan });
  const [saving, setSaving]   = useState(false);
  const [subTab, setSubTab]   = useState("details");
  const [showEmail, setShowEmail] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const row = toDB({ ...form, isNew: false });
    await supabase.from("closing_pipeline").upsert(row);
    onSave({ ...form, isNew: false });
    setSaving(false);
    onClose();
  };

  const del = async () => {
    if (!window.confirm(`Remove ${loan.borrower} from the pipeline?`)) return;
    await supabase.from("closing_pipeline").delete().eq("id", loan.id);
    onDelete(loan.id);
    onClose();
  };

  const subTabs = [
    { id: "details", label: "📋 File Details" },
    { id: "notes",   label: "📝 Notes Log"    },
    { id: "email",   label: "📧 Settlement Email" },
  ];

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {form.isNew && <NewBadge />}
            <span>{form.borrower || "Loan File"}</span>
            <MilestoneBadge value={form.milestone} small />
          </div>
        }
        onClose={onClose} wide>

        {/* Sub-tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${NXT.border}`, marginBottom: 20 }}>
          {subTabs.map(t => (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              style={{ padding: "8px 16px", border: "none", background: "transparent",
                fontWeight: subTab === t.id ? 700 : 500, cursor: "pointer", fontSize: 13,
                color: subTab === t.id ? NXT.royal : NXT.muted, fontFamily: "inherit",
                borderBottom: subTab === t.id ? `2px solid ${NXT.royal}` : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        {subTab === "details" && (
          <>
            <FRow>
              <Input label="Borrower Name" value={form.borrower || ""}
                onChange={e => set("borrower", e.target.value)} half />
              <Input label="Arive Loan #" value={form.ariveLoanNum || ""}
                onChange={e => set("ariveLoanNum", e.target.value)} half />
            </FRow>
            <FRow>
              <Sel label="Lender" half options={LENDERS} value={form.lender || ""}
                onChange={e => set("lender", e.target.value)} />
              <Input label="Lender Loan #" value={form.lenderLoanNum || ""}
                onChange={e => set("lenderLoanNum", e.target.value)} half />
            </FRow>
            <FRow>
              <Field label="Est. Closing Date" half>
                <input type="date" style={iS} value={form.estClosingDate || ""}
                  onChange={e => set("estClosingDate", e.target.value)} />
              </Field>
              <Field label="Fund Date" half>
                <input type="date" style={iS} value={form.fundDate || ""}
                  onChange={e => set("fundDate", e.target.value)} />
              </Field>
            </FRow>
            <FRow>
              <Field label="Lock Expiration" half>
                <input type="date" style={iS} value={form.lockExpiration || ""}
                  onChange={e => set("lockExpiration", e.target.value)} />
              </Field>
              <Sel label="Milestone" half options={Object.keys(MILESTONES)}
                value={form.milestone || ""} onChange={e => set("milestone", e.target.value)} />
            </FRow>
            <FRow>
              <Sel label="Loan Type" half options={LOAN_TYPES} value={form.loanType || ""}
                onChange={e => set("loanType", e.target.value)} />
              <Sel label="Mortgage Type" half options={MORTGAGE_TYPES} value={form.mortgageType || ""}
                onChange={e => set("mortgageType", e.target.value)} />
            </FRow>
            <FRow>
              <Input label="Loan Officer" value={form.lo || ""}
                onChange={e => set("lo", e.target.value)} half />
              <Input label="Processor" value={form.processor || ""}
                onChange={e => set("processor", e.target.value)} half />
            </FRow>
            <FRow>
              <Input label="Settlement Agent / Title Co." value={form.settlementAgent || ""}
                onChange={e => set("settlementAgent", e.target.value)} half />
              <Sel label="Assigned Closer" half options={CLOSERS} value={form.closer || ""}
                onChange={e => set("closer", e.target.value)} />
            </FRow>
            <FRow>
              <FRow>
              <Field label="Docs Signed Date" half>
                <input type="date" style={iS} value={form.docsSignedDate || ""}
                  onChange={e => set("docsSignedDate", e.target.value)} />
              </Field>
              <Field label="Loan Funded Date" half>
                <input type="date" style={iS} value={form.loanFundedDate || ""}
                  onChange={e => set("loanFundedDate", e.target.value)} />
              </Field>
            </FRow>
              <Input label="CD Status" value={form.cdStatus || ""}
                onChange={e => set("cdStatus", e.target.value)} half />
              <Input label="Tolerance Cures" value={form.toleranceCures || ""}
                onChange={e => set("toleranceCures", e.target.value)} half />
            </FRow>

          </>
        )}

        {subTab === "notes" && <NotesLog loanId={loan.id} onNoteAdded={async (date) => {
          await supabase.from("closing_pipeline").update({ last_touch: date, updated_at: new Date().toISOString() }).eq("id", loan.id);
          onSave({ ...form, lastTouch: date });
        }} />}

        {subTab === "email" && (
          <div style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: NXT.dark, marginBottom: 8 }}>
              Settlement Agent Email Builder
            </div>
            <div style={{ fontSize: 13, color: NXT.muted, marginBottom: 20, maxWidth: 360, margin: "0 auto 20px" }}>
              Build a closing invoice and send it directly to the settlement agent.
            </div>
            <Btn onClick={() => setShowEmail(true)} variant="sky">
              Open Email Builder
            </Btn>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24,
          paddingTop: 16, borderTop: `1px solid ${NXT.border}` }}>
          <Btn onClick={del} variant="danger" small>Remove File</Btn>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onClose} variant="secondary">Cancel</Btn>
            <Btn onClick={save}>{saving ? "Saving..." : "Save Changes"}</Btn>
          </div>
        </div>
      </Modal>

      {showEmail && <SettlementEmailModal loan={form} onClose={() => setShowEmail(false)} />}
    </>
  );
}

// ─── ADD FILE MODAL ───
function AddFileModal({ onClose, onAdd }) {
  const [form, setForm]   = useState({ milestone: "Clear To Close", closer: "Unassigned" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.borrower?.trim()) { alert("Borrower name is required"); return; }
    setSaving(true);
    const row = toDB({ ...form, isNew: true });
    const { error } = await supabase.from("closing_pipeline").insert(row);
    if (!error) onAdd(fromDB(row));
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="➕ Add New File" onClose={onClose} wide>
      <FRow>
        <Input label="Borrower Name *" value={form.borrower || ""}
          onChange={e => set("borrower", e.target.value)} half />
        <Input label="Arive Loan #" value={form.ariveLoanNum || ""}
          onChange={e => set("ariveLoanNum", e.target.value)} half />
      </FRow>
      <FRow>
        <Sel label="Lender" half options={LENDERS} value={form.lender || ""}
          onChange={e => set("lender", e.target.value)} />
        <Input label="Lender Loan #" value={form.lenderLoanNum || ""}
          onChange={e => set("lenderLoanNum", e.target.value)} half />
      </FRow>
      <FRow>
        <Field label="Est. Closing Date" half>
          <input type="date" style={iS} value={form.estClosingDate || ""}
            onChange={e => set("estClosingDate", e.target.value)} />
        </Field>
        <Field label="Fund Date" half>
          <input type="date" style={iS} value={form.fundDate || ""}
            onChange={e => set("fundDate", e.target.value)} />
        </Field>
      </FRow>
      <FRow>
        <Sel label="Loan Type" half options={LOAN_TYPES} value={form.loanType || ""}
          onChange={e => set("loanType", e.target.value)} />
        <Sel label="Mortgage Type" half options={MORTGAGE_TYPES} value={form.mortgageType || ""}
          onChange={e => set("mortgageType", e.target.value)} />
      </FRow>
      <FRow>
        <Field label="Docs Signed Date" half>
          <input type="date" style={iS} value={form.docsSignedDate || ""}
            onChange={e => set("docsSignedDate", e.target.value)} />
        </Field>
        <Field label="Loan Funded Date" half>
          <input type="date" style={iS} value={form.loanFundedDate || ""}
            onChange={e => set("loanFundedDate", e.target.value)} />
        </Field>
      </FRow>
      <FRow>
        <Input label="Loan Officer" value={form.lo || ""}
          onChange={e => set("lo", e.target.value)} half />
        <Input label="Processor" value={form.processor || ""}
          onChange={e => set("processor", e.target.value)} half />
      </FRow>
      <FRow>
        <Input label="Settlement Agent / Title Co." value={form.settlementAgent || ""}
          onChange={e => set("settlementAgent", e.target.value)} half />
        <Sel label="Assigned Closer" half options={CLOSERS} value={form.closer || ""}
          onChange={e => set("closer", e.target.value)} />
      </FRow>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn onClick={onClose} variant="secondary">Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? "Adding..." : "Add File"}</Btn>
      </div>
    </Modal>
  );
}

// ─── LOAN ROW ───
function LoanRow({ loan, onOpen, onNotes, showDocsColumns }) {
  const isNew = loan.isNew;
  return (
    <tr onClick={() => onOpen(loan)}
      style={{ cursor: "pointer",
        background: isNew ? "linear-gradient(90deg, #f5eeff 0%, #eef2ff 100%)" : "transparent",
        borderLeft: isNew ? `3px solid ${NXT.purple}` : "3px solid transparent" }}>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {isNew && <NewBadge />}
          <span style={{ fontSize: 13, fontWeight: 700, color: NXT.dark }}>
            {loan.borrower || "—"}
          </span>
        </div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.muted }}>{loan.ariveLoanNum || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.lender || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.muted }}>{loan.lenderLoanNum || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.lo || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.processor || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.mortgageType || "—"}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.loanType || "—"}</td>
      <td style={{ padding: "10px 12px" }}><MilestoneBadge value={loan.milestone} small /></td>
      <td style={{ padding: "10px 12px" }}><DaysChip dateStr={loan.estClosingDate} /></td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{fmtDate(loan.estClosingDate)}</td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>
        {loan.lockExpiration ? loan.lockExpiration.slice(0,10) : "—"}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: loan.toleranceCures ? "#e65100" : NXT.muted }}>
        {loan.toleranceCures || "—"}
      </td>
      {showDocsColumns && (
        <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.docsSignedDate ? fmtDate(loan.docsSignedDate) : "—"}</td>
      )}
      {showDocsColumns && (
        <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.text }}>{loan.loanFundedDate ? fmtDate(loan.loanFundedDate) : "—"}</td>
      )}
      <td style={{ padding: "10px 12px", fontSize: 12, color: NXT.muted }}>
        {loan.lastTouch ? fmtDate(loan.lastTouch) : "—"}
      </td>
      <td style={{ padding: "10px 12px" }} onClick={e => { e.stopPropagation(); onNotes(loan); }}>
        <span style={{ fontSize: 16, cursor: "pointer", opacity: 0.7 }} title="View notes">📝</span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12,
        color: (!loan.closer || loan.closer === "Unassigned") ? NXT.muted : NXT.text }}>
        {loan.closer || "Unassigned"}
      </td>
    </tr>
  );
}

// ─── PIPELINE TABLE ───
function PipelineTable({ loans, onOpen, onNotes, emptyMsg, showDocsColumns }) {
  if (!loans.length) {
    return (
      <div style={{ textAlign: "center", padding: "52px 24px", color: NXT.muted, fontSize: 14 }}>
        {emptyMsg || "No files in this section"}
      </div>
    );
  }
  const baseHeaders = ["Borrower","Arive #","Lender","Lender Loan #","LO","Processor","Mortgage Type","Loan Purpose","Milestone","Days","Close Date","Lock Exp.","Cure","Last Touch","Notes","Closer"];
  const headers = showDocsColumns
    ? ["Borrower","Arive #","Lender","Lender Loan #","LO","Processor","Mortgage Type","Loan Purpose","Milestone","Days","Close Date","Lock Exp.","Cure","Docs Signed","Loan Funded","Last Touch","Notes","Closer"]
    : baseHeaders;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: NXT.ltgray, borderBottom: `2px solid ${NXT.border}` }}>
            {headers.map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11,
                fontWeight: 700, color: NXT.dark, textTransform: "uppercase",
                letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loans.map(l => <LoanRow key={l.id} loan={l} onOpen={onOpen} onNotes={onNotes} showDocsColumns={showDocsColumns} />)}
        </tbody>
      </table>
    </div>
  );
}

// ─── DASHBOARD ───
function Dashboard({ loans }) {
  const tab1 = loans.filter(l => TAB_MILESTONES[1].includes(l.milestone));
  const tab2 = loans.filter(l => TAB_MILESTONES[2].includes(l.milestone));
  const tab3 = loans.filter(l => TAB_MILESTONES[3].includes(l.milestone));
  const tab4 = loans.filter(l => TAB_MILESTONES[4].includes(l.milestone));

  const urgent    = loans.filter(l => { const d = daysToClose(l.estClosingDate); return d !== null && d >= 0 && d <= 1; });
  const pastDue   = loans.filter(l => { const d = daysToClose(l.estClosingDate); return d !== null && d < 0 && TAB_MILESTONES[1].includes(l.milestone); });
  const newFiles  = loans.filter(l => l.isNew);
  const unassigned = loans.filter(l => (!l.closer || l.closer === "Unassigned") && !TAB_MILESTONES[3].includes(l.milestone) && !TAB_MILESTONES[4].includes(l.milestone));

  const stats = [
    { label: "Closing / Balancing",  value: tab1.length,       color: NXT.royal,  icon: "🏠" },
    { label: "Docs Out / Signed",    value: tab2.length,       color: NXT.mid,    icon: "📄" },
    { label: "Post Closing / QC",    value: tab3.length,       color: NXT.purple, icon: "✅" },
    { label: "Closing Today/Tomorrow",value: urgent.length,    color: "#e65100",  icon: "⚡" },
    { label: "Past Due",             value: pastDue.length,    color: "#c62828",  icon: "⚠️" },
    { label: "New Files",            value: newFiles.length,   color: NXT.purple, icon: "🆕" },
    { label: "Unassigned",           value: unassigned.length, color: "#78909c",  icon: "👤" },
    { label: "Total Active",         value: loans.length,      color: NXT.dark,   icon: "📊" },
  ];

  // Next 7 days closing schedule
  const today = new Date(); today.setHours(0,0,0,0);
  const schedule = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    return {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      files: loans.filter(l => l.estClosingDate === ds),
    };
  });

  // Closer workload (active tabs only)
  const closerMap = {};
  [...tab1, ...tab2, ...tab3].forEach(l => {
    const k = l.closer || "Unassigned";
    closerMap[k] = (closerMap[k] || 0) + 1;
  });

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
        gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(54,65,123,0.07)", border: `1px solid ${NXT.border}`,
            borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: NXT.muted, fontWeight: 700, marginTop: 4,
              textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Past due alert */}
      {pastDue.length > 0 && (
        <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 10,
          padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#c62828", marginBottom: 8 }}>
            ⚠️ {pastDue.length} file{pastDue.length > 1 ? "s" : ""} past closing date
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pastDue.map(f => (
              <span key={f.id} style={{ background: "#fff", border: "1px solid #ffcdd2",
                borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#c62828", fontWeight: 600 }}>
                {f.borrower} ({Math.abs(daysToClose(f.estClosingDate))}d overdue)
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Closing schedule */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px",
          boxShadow: "0 2px 8px rgba(54,65,123,0.07)", border: `1px solid ${NXT.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: NXT.dark, marginBottom: 14 }}>
            📅 Closing Schedule — Next 7 Days
          </div>
          {schedule.map(({ label, files }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10,
              padding: "9px 0", borderBottom: `1px solid ${NXT.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: NXT.text,
                width: 120, flexShrink: 0, paddingTop: 1 }}>{label}</div>
              {files.length === 0
                ? <span style={{ fontSize: 11, color: "#ccc" }}>—</span>
                : <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {files.map(f => (
                      <span key={f.id} style={{ background: NXT.royal + "15", color: NXT.royal,
                        border: `1px solid ${NXT.royal}30`, borderRadius: 6,
                        padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                        {f.borrower}
                      </span>
                    ))}
                  </div>
              }
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Closer workload */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(54,65,123,0.07)", border: `1px solid ${NXT.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: NXT.dark, marginBottom: 14 }}>
              👤 Closer Workload (Active Files)
            </div>
            {Object.keys(closerMap).length === 0
              ? <div style={{ fontSize: 12, color: NXT.muted }}>No active files</div>
              : Object.entries(closerMap).map(([name, count]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: NXT.text, width: 110, flexShrink: 0 }}>{name}</div>
                    <div style={{ height: 8, flex: 1, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(count * 12, 100)}%`,
                        background: `linear-gradient(90deg, ${NXT.royal}, ${NXT.sky})`,
                        borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: NXT.royal, width: 20, textAlign: "right" }}>{count}</div>
                  </div>
                ))
            }
          </div>

          {/* Milestone breakdown */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(54,65,123,0.07)", border: `1px solid ${NXT.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: NXT.dark, marginBottom: 14 }}>
              📋 Files by Milestone
            </div>
            {Object.entries(MILESTONES).map(([m]) => {
              const count = loans.filter(l => l.milestone === m).length;
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <MilestoneBadge value={m} small />
                  <span style={{ fontSize: 12, fontWeight: 800, color: NXT.dark, marginLeft: "auto" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ───
function AuthScreen({ onAuth }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    if (pw === APP_PASSWORD) { onAuth(); }
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif",
      background: `linear-gradient(135deg, ${NXT.dark} 0%, ${NXT.royal} 60%, ${NXT.purple} 100%)` }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "44px 40px",
        width: 360, boxShadow: "0 32px 80px rgba(0,0,0,0.35)", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, margin: "0 auto 18px",
          background: `linear-gradient(135deg, ${NXT.royal}, ${NXT.purple})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          🏠
        </div>
        <div style={{ fontWeight: 900, fontSize: 19, color: NXT.dark, marginBottom: 4 }}>
          NXT Closing Pipeline
        </div>
        <div style={{ fontSize: 12, color: NXT.muted, marginBottom: 28 }}>
          NXT Processing · Internal Use Only
        </div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Enter access code"
          style={{ ...iS, textAlign: "center", letterSpacing: "4px", fontSize: 16,
            marginBottom: error ? 6 : 14,
            border: `1.5px solid ${error ? "#e53935" : NXT.border}` }} />
        {error && (
          <div style={{ color: "#e53935", fontSize: 12, marginBottom: 10 }}>Incorrect access code</div>
        )}
        <button onClick={attempt}
          style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${NXT.royal}, ${NXT.sky})`,
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit" }}>
          Access Pipeline
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [authed, setAuthed]       = useState(() => sessionStorage.getItem("nxt_closing_auth") === "1");
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selected, setSelected]   = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [notesLoan, setNotesLoan]   = useState(null);
  const [search, setSearch]       = useState("");

  const handleAuth = () => {
    sessionStorage.setItem("nxt_closing_auth", "1");
    setAuthed(true);
  };

  const load = async () => {
    const { data } = await supabase.from("closing_pipeline")
      .select("*").order("created_at", { ascending: false });
    setLoans((data || []).map(fromDB));
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  useEffect(() => {
    if (!authed) return;
    const sub = supabase.channel("rt_closing")
      .on("postgres_changes", { event: "*", schema: "public", table: "closing_pipeline" }, load)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [authed]);

  const tab1 = useMemo(() => loans.filter(l => TAB_MILESTONES[1].includes(l.milestone)), [loans]);
  const tab2 = useMemo(() => loans.filter(l => TAB_MILESTONES[2].includes(l.milestone)), [loans]);
  const tab3 = useMemo(() => loans.filter(l => TAB_MILESTONES[3].includes(l.milestone)), [loans]);
  const tab4 = useMemo(() => loans.filter(l => TAB_MILESTONES[4].includes(l.milestone)), [loans]);

  const newCt = arr => arr.filter(l => l.isNew).length;

  const filtered = arr => {
    if (!search.trim()) return arr;
    const q = search.toLowerCase();
    return arr.filter(l =>
      (l.borrower || "").toLowerCase().includes(q) ||
      (l.ariveLoanNum || "").toLowerCase().includes(q) ||
      (l.lender || "").toLowerCase().includes(q) ||
      (l.lo || "").toLowerCase().includes(q)
    );
  };

  const onSave   = updated => setLoans(ls => ls.map(l => l.id === updated.id ? updated : l));
  const onDelete = id      => setLoans(ls => ls.filter(l => l.id !== id));
  const onAdd    = loan    => setLoans(ls => [loan, ...ls]);

  const clearNew = async (arr) => {
    const ids = arr.filter(l => l.isNew).map(l => l.id);
    await Promise.all(ids.map(id => supabase.from("closing_pipeline").update({ is_new: false }).eq("id", id)));
    setLoans(ls => ls.map(l => ids.includes(l.id) ? { ...l, isNew: false } : l));
  };

  const tabDefs = [
    { id: "dashboard", label: "Dashboard",           icon: "📊", arr: null },
    { id: "tab1",      label: "Closing / Balancing", icon: "🏠", arr: tab1 },
    { id: "tab2",      label: "Docs Out / Signed",   icon: "📄", arr: tab2 },
    { id: "tab3",      label: "Post Closing / QC",   icon: "✅", arr: tab3 },
    { id: "tab4",      label: "Archive",               icon: "📦", arr: tab4 },
  ];

  const currentArr = activeTab === "tab1" ? tab1 : activeTab === "tab2" ? tab2 : activeTab === "tab3" ? tab3 : activeTab === "tab4" ? tab4 : [];

  if (!authed) return <AuthScreen onAuth={handleAuth} />;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${NXT.dark}, ${NXT.royal})`,
      fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Loading pipeline...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes nxtPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(185,113,253,0.5); }
          50%       { box-shadow: 0 0 16px rgba(185,113,253,0.95); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        tbody tr:hover td { background: #f6f8ff !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f6fb",
        fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ background: `linear-gradient(135deg, ${NXT.dark} 0%, ${NXT.royal} 100%)`,
          padding: "0 24px", boxShadow: "0 2px 14px rgba(34,66,178,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", maxWidth: 1440, margin: "0 auto" }}>

            <div style={{ padding: "14px 0", marginRight: 28, flexShrink: 0,
              display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8,
                padding: "6px 10px", fontSize: 18 }}>🏠</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "-0.3px" }}>
                  Closing Pipeline
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.8px" }}>NXT Processing</div>
              </div>
            </div>

            {tabDefs.map(t => {
              const nc = t.arr ? newCt(t.arr) : 0;
              const total = t.arr ? t.arr.length : null;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ padding: "20px 15px", border: "none", background: "transparent",
                    color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    borderBottom: activeTab === t.id ? "3px solid #78d2ff" : "3px solid transparent",
                    opacity: activeTab === t.id ? 1 : 0.65, transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {total !== null && (
                    <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 10,
                      padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                      {total}
                    </span>
                  )}
                  {nc > 0 && (
                    <span style={{ background: "linear-gradient(135deg, #b971fd, #1f8ae6)",
                      borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800,
                      animation: "nxtPulse 2s infinite" }}>
                      {nc} new
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 12,
                  outline: "none", width: 180, fontFamily: "inherit" }} />
              <button onClick={() => setShowAdd(true)}
                style={{ padding: "7px 16px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.15)", color: "#fff",
                  fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                + Add File
              </button>
              <button onClick={() => { sessionStorage.removeItem("nxt_closing_auth"); setAuthed(false); }}
                style={{ padding: "6px 12px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
                  color: "rgba(255,255,255,0.55)", fontSize: 12, cursor: "pointer",
                  fontFamily: "inherit" }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px" }}>

          {activeTab === "dashboard" && <Dashboard loans={loans} />}

          {activeTab !== "dashboard" && (
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(54,65,123,0.08)", border: `1px solid ${NXT.border}` }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${NXT.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: NXT.dark }}>
                    {tabDefs.find(t => t.id === activeTab)?.icon}{" "}
                    {tabDefs.find(t => t.id === activeTab)?.label}
                  </span>
                  <span style={{ fontSize: 12, color: NXT.muted }}>
                    {currentArr.length} file{currentArr.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {newCt(currentArr) > 0 && (
                  <button onClick={() => clearNew(currentArr)}
                    style={{ fontSize: 12, color: NXT.muted, background: "none", border: "none",
                      cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                    Clear {newCt(currentArr)} new
                  </button>
                )}
              </div>
              <PipelineTable loans={filtered(currentArr)} onOpen={setSelected} onNotes={setNotesLoan}
                showDocsColumns={activeTab === "tab2"}
                emptyMsg={search ? "No files match your search" : undefined} />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <LoanModal loan={selected} onClose={() => setSelected(null)}
          onSave={onSave} onDelete={onDelete} />
      )}
      {showAdd && <AddFileModal onClose={() => setShowAdd(false)} onAdd={onAdd} />}
      {notesLoan && (
        <Modal title={`📝 Notes — ${notesLoan.borrower}`} onClose={() => setNotesLoan(null)}>
          <NotesLog loanId={notesLoan.id} onNoteAdded={async (date) => {
            await supabase.from("closing_pipeline").update({ last_touch: date, updated_at: new Date().toISOString() }).eq("id", notesLoan.id);
            setLoans(ls => ls.map(l => l.id === notesLoan.id ? { ...l, lastTouch: date } : l));
          }} />
        </Modal>
      )}
    </>
  );
}
