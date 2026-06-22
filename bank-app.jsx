import { useState, useEffect } from "react";

// ── palette ──────────────────────────────────────────────────────────────────
// Deep navy #0F1729 | Ink #1C2B4A | Emerald #00C896 | Muted #6B7A99
// Surface #162039 | Text-dim #8A9BBE | Danger #FF5C6A | Paper #E8EDF8
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "bms_accounts_v1";

function now() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmt(n) {
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useAccounts() {
  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);
  return [accounts, setAccounts];
}

// ── small components ──────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const bg = type === "error" ? "#FF5C6A" : "#00C896";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: bg, color: "#fff", padding: "12px 24px", borderRadius: 8,
      fontFamily: "monospace", fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,.4)", zIndex: 999,
      animation: "fadeUp .25s ease",
    }}>{msg}</div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: 1, color: "#6B7A99", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
      <input {...props} style={{
        width: "100%", background: "#0F1729", border: "1px solid #1C2B4A",
        borderRadius: 6, padding: "10px 12px", color: "#E8EDF8",
        fontFamily: "monospace", fontSize: 14, outline: "none", boxSizing: "border-box",
        transition: "border .15s",
        ...(props.style || {})
      }}
        onFocus={e => e.target.style.borderColor = "#00C896"}
        onBlur={e => e.target.style.borderColor = "#1C2B4A"}
      />
    </div>
  );
}

function Btn({ children, variant = "primary", ...props }) {
  const styles = {
    primary: { background: "#00C896", color: "#0F1729" },
    danger:  { background: "transparent", color: "#FF5C6A", border: "1px solid #FF5C6A" },
    ghost:   { background: "transparent", color: "#8A9BBE", border: "1px solid #1C2B4A" },
  };
  return (
    <button {...props} style={{
      padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer",
      fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: .5,
      transition: "opacity .15s, transform .1s",
      ...styles[variant],
      ...(props.style || {}),
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      onMouseDown={e => e.currentTarget.style.transform = "scale(.97)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    >{children}</button>
  );
}

// ── panels ────────────────────────────────────────────────────────────────────

function CreateAccount({ accounts, setAccounts, toast }) {
  const [f, setF] = useState({ acc: "", name: "", bal: "" });
  function submit() {
    if (!f.acc.trim()) return toast("Account number is required", "error");
    if (f.acc in accounts) return toast("Account already exists", "error");
    if (!f.name.trim()) return toast("Name is required", "error");
    const bal = parseFloat(f.bal);
    if (isNaN(bal) || bal <= 0) return toast("Enter a valid initial deposit", "error");
    setAccounts(prev => ({
      ...prev,
      [f.acc]: {
        name: f.name.trim(),
        balance: Math.round(bal * 100) / 100,
        transactions: [`${now()} — Account opened with ₹${fmt(bal)}`],
      }
    }));
    toast(`Account ${f.acc} created ✓`);
    setF({ acc: "", name: "", bal: "" });
  }
  return (
    <Panel title="Open Account">
      <Input label="Account Number" placeholder="e.g. ACC1001" value={f.acc} onChange={e => setF(p => ({ ...p, acc: e.target.value }))} />
      <Input label="Full Name" placeholder="Priya Sharma" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} />
      <Input label="Initial Deposit (₹)" type="number" placeholder="0.00" value={f.bal} onChange={e => setF(p => ({ ...p, bal: e.target.value }))} />
      <Btn onClick={submit}>Create Account</Btn>
    </Panel>
  );
}

function Deposit({ accounts, setAccounts, toast }) {
  const [acc, setAcc] = useState(""); const [amt, setAmt] = useState("");
  function submit() {
    if (!(acc in accounts)) return toast("Account not found", "error");
    const a = parseFloat(amt);
    if (isNaN(a) || a <= 0) return toast("Enter a valid amount", "error");
    setAccounts(prev => {
      const cur = { ...prev[acc] };
      cur.balance = Math.round((cur.balance + a) * 100) / 100;
      cur.transactions = [...cur.transactions, `${now()} — Deposited ₹${fmt(a)} | Bal ₹${fmt(cur.balance)}`];
      return { ...prev, [acc]: cur };
    });
    toast(`₹${fmt(a)} deposited ✓`);
    setAmt("");
  }
  return (
    <Panel title="Deposit Money">
      <AccountSelect value={acc} onChange={setAcc} accounts={accounts} />
      <Input label="Amount (₹)" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)} />
      <Btn onClick={submit}>Deposit</Btn>
    </Panel>
  );
}

function Withdraw({ accounts, setAccounts, toast }) {
  const [acc, setAcc] = useState(""); const [amt, setAmt] = useState("");
  function submit() {
    if (!(acc in accounts)) return toast("Account not found", "error");
    const a = parseFloat(amt);
    if (isNaN(a) || a <= 0) return toast("Enter a valid amount", "error");
    if (a > accounts[acc].balance) return toast(`Insufficient balance — available ₹${fmt(accounts[acc].balance)}`, "error");
    setAccounts(prev => {
      const cur = { ...prev[acc] };
      cur.balance = Math.round((cur.balance - a) * 100) / 100;
      cur.transactions = [...cur.transactions, `${now()} — Withdrawn ₹${fmt(a)} | Bal ₹${fmt(cur.balance)}`];
      return { ...prev, [acc]: cur };
    });
    toast(`₹${fmt(a)} withdrawn ✓`);
    setAmt("");
  }
  return (
    <Panel title="Withdraw Money">
      <AccountSelect value={acc} onChange={setAcc} accounts={accounts} />
      <Input label="Amount (₹)" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)} />
      <Btn onClick={submit}>Withdraw</Btn>
    </Panel>
  );
}

function Balance({ accounts }) {
  const [acc, setAcc] = useState("");
  const data = accounts[acc];
  return (
    <Panel title="Check Balance">
      <AccountSelect value={acc} onChange={setAcc} accounts={accounts} />
      {data && (
        <div style={{ marginTop: 20, background: "#0F1729", borderRadius: 10, padding: "24px 28px", border: "1px solid #1C2B4A" }}>
          <div style={{ fontSize: 12, color: "#6B7A99", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Account Holder</div>
          <div style={{ fontSize: 20, color: "#E8EDF8", fontWeight: 700, marginBottom: 20 }}>{data.name}</div>
          <div style={{ fontSize: 12, color: "#6B7A99", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Current Balance</div>
          <div style={{ fontSize: 36, color: "#00C896", fontFamily: "monospace", fontWeight: 700 }}>₹{fmt(data.balance)}</div>
        </div>
      )}
    </Panel>
  );
}

function History({ accounts }) {
  const [acc, setAcc] = useState("");
  const data = accounts[acc];
  return (
    <Panel title="Transaction History">
      <AccountSelect value={acc} onChange={setAcc} accounts={accounts} />
      {data && (
        <div style={{ marginTop: 16, maxHeight: 320, overflowY: "auto" }}>
          {[...data.transactions].reverse().map((t, i) => {
            const isDeposit = t.includes("Deposited") || t.includes("opened");
            const isWithdraw = t.includes("Withdrawn");
            const color = isDeposit ? "#00C896" : isWithdraw ? "#FF5C6A" : "#8A9BBE";
            return (
              <div key={i} style={{
                padding: "10px 14px", borderLeft: `3px solid ${color}`,
                marginBottom: 8, background: "#0F1729", borderRadius: "0 6px 6px 0",
                fontSize: 13, color: "#C4CEDF", fontFamily: "monospace", lineHeight: 1.5,
              }}>{t}</div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function AllAccounts({ accounts, setAccounts, toast }) {
  const [confirm, setConfirm] = useState(null);
  function doDelete(acc) {
    setAccounts(prev => { const n = { ...prev }; delete n[acc]; return n; });
    toast(`Account ${acc} deleted`);
    setConfirm(null);
  }
  const list = Object.entries(accounts);
  return (
    <Panel title="All Accounts">
      {list.length === 0
        ? <p style={{ color: "#6B7A99", fontFamily: "monospace", fontSize: 14 }}>No accounts yet — create one to get started.</p>
        : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1C2B4A" }}>
                  {["Acc No", "Name", "Balance", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6B7A99", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(([no, d]) => (
                  <tr key={no} style={{ borderBottom: "1px solid #162039" }}>
                    <td style={{ padding: "12px 12px", color: "#8A9BBE" }}>{no}</td>
                    <td style={{ padding: "12px 12px", color: "#E8EDF8" }}>{d.name}</td>
                    <td style={{ padding: "12px 12px", color: "#00C896", fontWeight: 700 }}>₹{fmt(d.balance)}</td>
                    <td style={{ padding: "12px 12px" }}>
                      {confirm === no
                        ? <span style={{ display: "flex", gap: 8 }}>
                            <Btn variant="danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => doDelete(no)}>Confirm</Btn>
                            <Btn variant="ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setConfirm(null)}>Cancel</Btn>
                          </span>
                        : <Btn variant="ghost" style={{ padding: "6px 12px", fontSize: 12, color: "#FF5C6A", borderColor: "#FF5C6A22" }} onClick={() => setConfirm(no)}>Delete</Btn>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </Panel>
  );
}

// ── layout helpers ─────────────────────────────────────────────────────────────

function Panel({ title, children }) {
  return (
    <div style={{ background: "#162039", borderRadius: 12, padding: "28px 32px", border: "1px solid #1C2B4A" }}>
      <h2 style={{ margin: "0 0 22px", fontSize: 16, fontWeight: 700, color: "#E8EDF8", letterSpacing: .5 }}>{title}</h2>
      {children}
    </div>
  );
}

function AccountSelect({ value, onChange, accounts }) {
  const opts = Object.entries(accounts);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: 1, color: "#6B7A99", marginBottom: 5, textTransform: "uppercase" }}>Account</label>
      {opts.length === 0
        ? <p style={{ color: "#6B7A99", fontSize: 13, fontFamily: "monospace", margin: "4px 0" }}>No accounts found. Create one first.</p>
        : (
          <select value={value} onChange={e => onChange(e.target.value)} style={{
            width: "100%", background: "#0F1729", border: "1px solid #1C2B4A",
            borderRadius: 6, padding: "10px 12px", color: value ? "#E8EDF8" : "#6B7A99",
            fontFamily: "monospace", fontSize: 14, outline: "none", boxSizing: "border-box",
          }}>
            <option value="">— select account —</option>
            {opts.map(([no, d]) => <option key={no} value={no}>{no} — {d.name}</option>)}
          </select>
        )
      }
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "create",   label: "Open Account" },
  { id: "deposit",  label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
  { id: "balance",  label: "Balance" },
  { id: "history",  label: "History" },
  { id: "all",      label: "All Accounts" },
];

// ── root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [accounts, setAccounts] = useAccounts();
  const [tab, setTab] = useState("create");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  function toast(msg, type = "success") {
    setToastMsg(msg); setToastType(type);
  }

  const props = { accounts, setAccounts, toast };

  return (
    <div style={{ minHeight: "100vh", background: "#0F1729", color: "#E8EDF8", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: #0F1729; }
        ::-webkit-scrollbar-thumb { background: #1C2B4A; border-radius: 3px; }
        @keyframes fadeUp { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        select option { background: #0F1729; }
      `}</style>

      {/* header */}
      <header style={{ borderBottom: "1px solid #1C2B4A", padding: "20px 32px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#00C896", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>₹</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: .5 }}>Bank Management System</div>
          <div style={{ fontSize: 11, color: "#6B7A99", letterSpacing: .5 }}>{Object.keys(accounts).length} account{Object.keys(accounts).length !== 1 ? "s" : ""} · demo environment</div>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 75px)" }}>
        {/* sidebar nav */}
        <nav style={{ width: 200, borderRight: "1px solid #1C2B4A", padding: "24px 12px", flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "10px 14px", marginBottom: 4, borderRadius: 7, border: "none",
              cursor: "pointer", fontFamily: "monospace", fontSize: 13,
              background: tab === t.id ? "#1C2B4A" : "transparent",
              color: tab === t.id ? "#00C896" : "#8A9BBE",
              fontWeight: tab === t.id ? 700 : 400,
              transition: "all .12s",
            }}>{t.label}</button>
          ))}
        </nav>

        {/* content */}
        <main style={{ flex: 1, padding: "32px", maxWidth: 640 }}>
          {tab === "create"   && <CreateAccount  {...props} />}
          {tab === "deposit"  && <Deposit        {...props} />}
          {tab === "withdraw" && <Withdraw        {...props} />}
          {tab === "balance"  && <Balance         {...props} />}
          {tab === "history"  && <History         {...props} />}
          {tab === "all"      && <AllAccounts     {...props} />}
        </main>
      </div>

      <Toast msg={toastMsg} type={toastType} onClose={() => setToastMsg("")} />
    </div>
  );
}
