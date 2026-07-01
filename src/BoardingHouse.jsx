import { useState, useEffect, useMemo } from "react";

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MIC=["Deposit collected","Contract signed","Room key given","Move-in confirmed","First month paid","Rules explained"];
const TABS=["Dashboard","Tenants","Billing","KWH","Invoice","Rooms","Finance","History","SOCOTECO"];
const METHODS=["gcash","maya","cash","sterling","gotyme","other"];
const DK={bg:"#0f1117",bg2:"#1a1d27",bg3:"#22263a",bg4:"#2a2f45",border:"#2e3352",border2:"#3d4466",text:"#f1f3f9",text2:"#9ba3c0",text3:"#6b7494",green:"#22c55e",gbg:"rgba(34,197,94,.12)",gbr:"rgba(34,197,94,.3)",red:"#f43f5e",rbg:"rgba(244,63,94,.12)",rbr:"rgba(244,63,94,.3)",amber:"#f59e0b",abg:"rgba(245,158,11,.12)",abr:"rgba(245,158,11,.3)",blue:"#3b82f6",bbg:"rgba(59,130,246,.12)",bbr:"rgba(59,130,246,.3)",card:"#1a1d27",modal:"#1a1d27",input:"#22263a"};
const LT={bg:"#f4f6fb",bg2:"#ffffff",bg3:"#f0f2f8",bg4:"#e4e7f0",border:"#dde1ef",border2:"#c8cde0",text:"#1a1d27",text2:"#4b5470",text3:"#8b95b5",green:"#16a34a",gbg:"rgba(22,163,74,.1)",gbr:"rgba(22,163,74,.3)",red:"#dc2626",rbg:"rgba(220,38,38,.1)",rbr:"rgba(220,38,38,.3)",amber:"#d97706",abg:"rgba(217,119,6,.1)",abr:"rgba(217,119,6,.3)",blue:"#2563eb",bbg:"rgba(37,99,235,.1)",bbr:"rgba(37,99,235,.3)",card:"#ffffff",modal:"#ffffff",input:"#f0f2f8"};

function pad(n){return String(n).padStart(2,"0");}
function lastDay(y,m){return new Date(y,m+1,0).toISOString().split("T")[0];}
function cm(){const t=new Date();return t.getFullYear()+"-"+pad(t.getMonth()+1);}
function peso(n){return"\u20b1"+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmt(m){const[y,mo]=m.split("-");return MONTHS[parseInt(mo)-1]+" "+y;}
function today(){return new Date().toISOString().split("T")[0];}
function diffDays(a,b){return Math.round((new Date(b)-new Date(a))/(864e5));}
function rel(rb){
  if(!rb||!rb.length)return{label:"No data",color:"#6b7494",score:0};
  const s=Math.round((rb.filter(b=>b.status==="paid").length/rb.length)*100);
  if(s>=90)return{label:"Excellent payer",color:"#22c55e",score:s};
  if(s>=70)return{label:"Good payer",color:"#f59e0b",score:s};
  if(s>=50)return{label:"Sometimes late",color:"#f97316",score:s};
  return{label:"Frequently late",color:"#f43f5e",score:s};
}
const LS={
  get:(k)=>{try{return JSON.parse(localStorage.getItem("bh9_"+k)||"null");}catch(e){return null;}},
  set:(k,v)=>{try{localStorage.setItem("bh9_"+k,JSON.stringify(v));}catch(e){}}
};

// ─── Modal components OUTSIDE App so typing never loses focus ─────────────────

function OL({T,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,overflowY:"auto",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.modal,border:"1px solid "+T.border2,borderRadius:14,padding:18,width:"100%",maxWidth:520,margin:"20px auto"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function MHdr({title,T,onClose}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <span style={{fontSize:15,fontWeight:700,color:T.text}}>{title}</span>
      <button onClick={onClose} style={{background:T.bg3,border:"1px solid "+T.border,color:T.text2,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:18}}>x</button>
    </div>
  );
}

function TenantModal({open,editData,T,onClose,onSave}){
  const blank={room:"",name:"",phone:"",type:"old",moveIn:today(),contractEnd:"",rent:"",water:"",wifi:"",deposit:"",depStatus:"held",status:"occupied",notes:"",moveOutDate:""};
  const[f,sf]=useState(blank);
  const[m,sm]=useState({});
  useEffect(()=>{if(!open)return;if(editData){sf({...blank,...editData.tenant});sm(editData.mic||{});}else{sf(blank);sm({});}},[open]);
  if(!open)return null;
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const u=k=>e=>sf(p=>({...p,[k]:e.target.value}));
  return(
    <OL T={T} onClose={onClose}>
      <MHdr title={editData?"Edit Tenant":"Add Tenant"} T={T} onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>Room #</label><input type="number" value={f.room} onChange={u("room")} placeholder="1" style={IS}/></div>
        <div><label style={LB}>Full name</label><input value={f.name} onChange={u("name")} placeholder="Name" style={IS}/></div>
        <div><label style={LB}>Cellphone</label><input value={f.phone} onChange={u("phone")} placeholder="09XX..." style={IS}/></div>
        <div><label style={LB}>Type</label><select value={f.type} onChange={u("type")} style={IS}><option value="old">Old tenant</option><option value="new">New tenant</option></select></div>
        <div><label style={LB}>Move-in</label><input type="date" value={f.moveIn} onChange={u("moveIn")} style={IS}/></div>
        <div><label style={LB}>Contract end</label><input type="date" value={f.contractEnd} onChange={u("contractEnd")} style={IS}/></div>
        <div><label style={LB}>Room rent</label><input type="number" value={f.rent} onChange={u("rent")} placeholder="2000" style={IS}/></div>
        <div><label style={LB}>Water</label><input type="number" value={f.water} onChange={u("water")} placeholder="125" style={IS}/></div>
        <div><label style={LB}>Wifi</label><input type="number" value={f.wifi} onChange={u("wifi")} placeholder="200" style={IS}/></div>
        <div><label style={LB}>Deposit</label><input type="number" value={f.deposit} onChange={u("deposit")} placeholder="0" style={IS}/></div>
        <div><label style={LB}>Deposit status</label><select value={f.depStatus} onChange={u("depStatus")} style={IS}><option value="held">Held</option><option value="used">Used</option><option value="partial">Partial</option><option value="returned">Returned</option></select></div>
        <div><label style={LB}>Status</label><select value={f.status} onChange={u("status")} style={IS}><option value="occupied">Occupied</option><option value="new">New/Move-in</option><option value="vacant">Vacant</option><option value="moved_out">Moved out</option></select></div>
      </div>
      {f.status==="moved_out"&&<div><label style={LB}>Move-out date</label><input type="date" value={f.moveOutDate} onChange={u("moveOutDate")} style={IS}/></div>}
      <div><label style={LB}>Private notes</label><input value={f.notes} onChange={u("notes")} placeholder="Notes (private)..." style={IS}/></div>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3,margin:"12px 0 6px"}}>MOVE-IN CHECKLIST</div>
      {MIC.map((item,i)=>(
        <label key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",cursor:"pointer",borderBottom:"1px solid "+T.border,fontSize:13,color:T.text2}}>
          <input type="checkbox" checked={!!m[i]} onChange={e=>sm(p=>({...p,[i]:e.target.checked}))} style={{accentColor:T.green,width:16,height:16,cursor:"pointer",flexShrink:0}}/>{item}
        </label>
      ))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button onClick={onClose} style={{padding:"8px 14px",border:"1px solid "+T.border2,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.bg3,color:T.text}}>Cancel</button>
        <button onClick={()=>onSave(f,m)} style={{padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.green,color:"#071a0e"}}>Save tenant</button>
      </div>
    </OL>
  );
}

function BillModal({open,initForm,initBals,initPayments,T,tenants,kwhData,bills,curMon,onClose,onSave}){
  const blank={room:"",rent:"",elec:"",water:"",wifi:"",status:"unpaid",notes:""};
  const[f,sf]=useState(blank);
  const[bals,setBals]=useState([]);
  const[payments,setPayments]=useState([]); // [{amt, date, method, note}]
  const[newPay,setNewPay]=useState({amt:"",date:"",method:"gcash",note:""});

  useEffect(()=>{
    if(!open)return;
    sf({...blank,...(initForm||{})});
    setBals(initBals||[]);
    setPayments(initPayments||[]);
    setNewPay({amt:"",date:"",method:"gcash",note:""});
  },[open]);

  if(!open)return null;
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const u=k=>e=>sf(p=>({...p,[k]:e.target.value}));
  const up=k=>e=>setNewPay(p=>({...p,[k]:e.target.value}));
  const bt=bals.reduce((a,b)=>a+(parseFloat(b.amt)||0),0);
  const total=(parseFloat(f.rent)||0)+(parseFloat(f.elec)||0)+(parseFloat(f.water)||0)+(parseFloat(f.wifi)||0)+bt;
  const totalPaid=payments.reduce((a,p)=>a+(parseFloat(p.amt)||0),0);
  const remaining=Math.max(0,total-totalPaid);
  const autoStatus=totalPaid>=total&&total>0?"paid":totalPaid>0?"balance":"unpaid";

  const pickRoom=e=>{
    const room=parseInt(e.target.value);
    const t=tenants.find(x=>x.room===room);
    const k=kwhData["r"+room]||{};
    const prev=[...bills].filter(b=>b.room===room&&b.month<dashMonth).sort((a,z)=>z.month.localeCompare(a.month))[0];
    const pb=prev&&prev.status!=="paid"&&prev.balances?prev.balances.map(bl=>({desc:"Carry: "+bl.desc,amt:bl.amt})):[];
    setBals(pb);
    sf(p=>({...p,room:e.target.value,rent:t?String(t.rent):"",elec:k.bill?k.bill.toFixed(2):"",water:t?String(t.water):"",wifi:t?String(t.wifi):""}));
  };

  function addPayment(){
    if(!newPay.amt||!newPay.date){alert("Enter amount and date");return;}
    setPayments(p=>[...p,{...newPay,amt:parseFloat(newPay.amt)}]);
    setNewPay({amt:"",date:"",method:"gcash",note:""});
  }

  return(
    <OL T={T} onClose={onClose}>
      <MHdr title="Add / Update Bill" T={T} onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>Room</label><select value={f.room||""} onChange={pickRoom} style={IS}><option value="">Select...</option>{tenants.map(t=><option key={t.room} value={t.room}>Room {t.room} - {t.name}</option>)}</select></div>
        <div><label style={LB}>Room rent</label><input type="number" value={f.rent} onChange={u("rent")} style={IS}/></div>
        <div><label style={LB}>Electric</label><input type="number" value={f.elec} onChange={u("elec")} style={IS}/></div>
        <div><label style={LB}>Water</label><input type="number" value={f.water} onChange={u("water")} style={IS}/></div>
        <div><label style={LB}>Wifi</label><input type="number" value={f.wifi} onChange={u("wifi")} style={IS}/></div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:700,color:T.text}}>Extra Balances</span>
        <button onClick={()=>setBals(b=>[...b,{desc:"",amt:""}])} style={{padding:"4px 10px",border:"1px solid "+T.border2,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,background:T.bg3,color:T.text}}>+ Add</button>
      </div>
      {bals.map((bl,i)=>(
        <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
          <input placeholder="Description" value={bl.desc||""} onChange={e=>setBals(b=>b.map((x,j)=>j===i?{...x,desc:e.target.value}:x))} style={{...IS,flex:2}}/>
          <input type="number" placeholder="0" value={bl.amt||""} onChange={e=>setBals(b=>b.map((x,j)=>j===i?{...x,amt:e.target.value}:x))} style={{...IS,width:85}}/>
          <button onClick={()=>setBals(b=>b.filter((_,j)=>j!==i))} style={{background:T.rbg,color:T.red,border:"1px solid "+T.rbr,borderRadius:6,padding:"6px 10px",cursor:"pointer",fontWeight:700}}>x</button>
        </div>
      ))}

      <div style={{height:1,background:T.border,margin:"12px 0"}}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:700,color:T.text}}>Payment Log</span>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,color:T.text3}}>Total due: <strong style={{color:T.green}}>{peso(total)}</strong></div>
          <div style={{fontSize:12,color:T.text3}}>Total paid: <strong style={{color:T.blue}}>{peso(totalPaid)}</strong></div>
          {remaining>0&&<div style={{fontSize:12,fontWeight:700,color:T.amber}}>Remaining: {peso(remaining)}</div>}
          {remaining===0&&totalPaid>0&&<div style={{fontSize:12,fontWeight:700,color:T.green}}>Fully paid!</div>}
        </div>
      </div>

      {payments.length>0&&(
        <div style={{background:T.bg3,borderRadius:8,padding:"8px 10px",marginBottom:10}}>
          {payments.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<payments.length-1?"1px solid "+T.border:"none"}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:T.blue}}>Payment {i+1}</span>
                <span style={{fontSize:11,color:T.text3,marginLeft:6}}>{p.date} · {p.method}</span>
                {p.note&&<span style={{fontSize:11,color:T.text3,marginLeft:6}}>· {p.note}</span>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontWeight:700,color:T.green}}>{peso(p.amt)}</span>
                <button onClick={()=>setPayments(ps=>ps.filter((_,j)=>j!==i))} style={{background:T.rbg,color:T.red,border:"1px solid "+T.rbr,borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11,fontWeight:700}}>x</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{background:T.bbg,border:"1px solid "+T.bbr,borderRadius:8,padding:"10px",marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:700,color:T.blue,marginBottom:6}}>+ ADD PAYMENT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div><label style={{...LB,marginTop:0}}>Amount (P)</label><input type="number" value={newPay.amt} onChange={up("amt")} placeholder="0" style={IS}/></div>
          <div><label style={{...LB,marginTop:0}}>Date paid</label><input type="date" value={newPay.date} onChange={up("date")} style={IS}/></div>
          <div><label style={{...LB,marginTop:0}}>Method</label><select value={newPay.method} onChange={up("method")} style={IS}>{METHODS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
          <div><label style={{...LB,marginTop:0}}>Note (optional)</label><input value={newPay.note} onChange={up("note")} placeholder="e.g. GCash ref..." style={IS}/></div>
        </div>
        <button onClick={addPayment} style={{marginTop:8,padding:"6px 14px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,background:T.blue,color:"#fff"}}>Add this payment</button>
      </div>

      <div><label style={LB}>Notes</label><input value={f.notes} onChange={u("notes")} placeholder="For your reference only" style={IS}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button onClick={onClose} style={{padding:"8px 14px",border:"1px solid "+T.border2,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.bg3,color:T.text}}>Cancel</button>
        <button onClick={()=>onSave(f,bals,payments,total,autoStatus)} style={{padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.green,color:"#071a0e"}}>Save bill</button>
      </div>
    </OL>
  );
}

function ExpModal({open,T,onClose,onSave}){
  const[f,sf]=useState({desc:"",amt:"",date:today(),cat:"Electric"});
  useEffect(()=>{if(open)sf({desc:"",amt:"",date:today(),cat:"Electric"});},[open]);
  if(!open)return null;
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const u=k=>e=>sf(p=>({...p,[k]:e.target.value}));
  return(
    <OL T={T} onClose={onClose}>
      <MHdr title="Add Expense" T={T} onClose={onClose}/>
      <div><label style={LB}>Description</label><input value={f.desc} onChange={u("desc")} placeholder="e.g. Repairs..." style={IS}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>Amount</label><input type="number" value={f.amt} onChange={u("amt")} style={IS}/></div>
        <div><label style={LB}>Date</label><input type="date" value={f.date} onChange={u("date")} style={IS}/></div>
        <div><label style={LB}>Category</label><select value={f.cat} onChange={u("cat")} style={IS}><option>Electric</option><option>Water</option><option>Wifi</option><option>Repairs</option><option>Other</option></select></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button onClick={onClose} style={{padding:"8px 14px",border:"1px solid "+T.border2,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.bg3,color:T.text}}>Cancel</button>
        <button onClick={()=>{if(!f.desc.trim()||!f.amt){alert("Fill in all fields");return;}onSave({...f,amt:parseFloat(f.amt)});}} style={{padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.red,color:"#fff"}}>Add expense</button>
      </div>
    </OL>
  );
}

function SocoModal({open,editRec,T,onClose,onSave}){
  const blank={month:"",kwhUsed:"",socoRate:"",socoBill:"",myRate:"",totalBoarderElec:"",tapal:"",notes:""};
  const[f,sf]=useState(blank);
  useEffect(()=>{if(open)sf(editRec||blank);},[open]);
  if(!open)return null;
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const u=k=>e=>sf(p=>({...p,[k]:e.target.value}));
  const ob=(parseFloat(f.totalBoarderElec)||0)+(parseFloat(f.tapal)||0);
  return(
    <OL T={T} onClose={onClose}>
      <MHdr title={editRec?"Edit SOCOTECO Record":"Add SOCOTECO Record"} T={T} onClose={onClose}/>
      <div style={{background:T.abg,border:"1px solid "+T.abr,borderRadius:8,padding:"8px 10px",fontSize:12,color:T.amber,marginBottom:10}}>Fill in from your SOCOTECO receipt each month.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>Month</label><input type="month" value={f.month} onChange={u("month")} style={IS}/></div>
        <div><label style={LB}>KWH Used</label><input type="number" value={f.kwhUsed} onChange={u("kwhUsed")} placeholder="965" style={IS}/></div>
        <div><label style={LB}>SOCOTECO Rate</label><input type="number" value={f.socoRate} onChange={u("socoRate")} placeholder="8.6" style={IS}/></div>
        <div><label style={LB}>SOCOTECO Bill</label><input type="number" value={f.socoBill} onChange={u("socoBill")} placeholder="8976" style={IS}/></div>
      </div>
      <div style={{height:1,background:T.border,margin:"12px 0"}}/>
      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:6}}>Your boarders calculation</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>My Rate (per kwh)</label><input type="number" value={f.myRate} onChange={u("myRate")} placeholder="13" style={IS}/></div>
        <div><label style={LB}>Total Boarder Electric</label><input type="number" value={f.totalBoarderElec} onChange={u("totalBoarderElec")} placeholder="3679" style={IS}/></div>
        <div><label style={LB}>Tapal</label><input type="number" value={f.tapal} onChange={u("tapal")} placeholder="516" style={IS}/></div>
        <div><label style={LB}>Overall Bayad (auto)</label><input value={peso(ob)} readOnly style={{...IS,fontWeight:800,color:"#f9ff00",background:T.bg4}}/></div>
      </div>
      <div><label style={LB}>Notes</label><input value={f.notes} onChange={u("notes")} placeholder="Optional..." style={IS}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button onClick={onClose} style={{padding:"8px 14px",border:"1px solid "+T.border2,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.bg3,color:T.text}}>Cancel</button>
        <button onClick={()=>{if(!f.month){alert("Select a month");return;}onSave(f);}} style={{padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.green,color:"#071a0e"}}>Save record</button>
      </div>
    </OL>
  );
}

function PrevBillModal({open,T,tenants,onClose,onSave}){
  const blank={room:"",month:"",datePaid:"",rent:"",elec:"",water:"",wifi:"",amtPaid:"",status:"paid",method:"gcash",notes:""};
  const[f,sf]=useState(blank);
  const[bals,setBals]=useState([]);
  useEffect(()=>{if(open){sf(blank);setBals([]);}},[open]);
  if(!open)return null;
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const u=k=>e=>sf(p=>({...p,[k]:e.target.value}));
  const bt=bals.reduce((a,b)=>a+(parseFloat(b.amt)||0),0);
  const total=(parseFloat(f.rent)||0)+(parseFloat(f.elec)||0)+(parseFloat(f.water)||0)+(parseFloat(f.wifi)||0)+bt;
  return(
    <OL T={T} onClose={onClose}>
      <MHdr title="Add Previous Month Bill" T={T} onClose={onClose}/>
      <div style={{background:T.abg,border:"1px solid "+T.abr,borderRadius:8,padding:"8px 10px",fontSize:12,color:T.amber,marginBottom:10}}>Add records from past months you have not tracked yet.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><label style={LB}>Room</label><select value={f.room} onChange={e=>{const t=tenants.find(x=>x.room===parseInt(e.target.value));sf(p=>({...p,room:e.target.value,rent:t?String(t.rent):p.rent,water:t?String(t.water):p.water,wifi:t?String(t.wifi):p.wifi}));}} style={IS}><option value="">Select...</option>{tenants.map(t=><option key={t.room} value={t.room}>Room {t.room} - {t.name}</option>)}</select></div>
        <div><label style={LB}>Month</label><input type="month" value={f.month} onChange={u("month")} style={IS}/></div>
        <div><label style={LB}>Date paid</label><input type="date" value={f.datePaid} onChange={u("datePaid")} style={IS}/></div>
        <div><label style={LB}>Room rent</label><input type="number" value={f.rent} onChange={u("rent")} style={IS}/></div>
        <div><label style={LB}>Electric</label><input type="number" value={f.elec} onChange={u("elec")} style={IS}/></div>
        <div><label style={LB}>Water</label><input type="number" value={f.water} onChange={u("water")} style={IS}/></div>
        <div><label style={LB}>Wifi</label><input type="number" value={f.wifi} onChange={u("wifi")} style={IS}/></div>
        <div><label style={LB}>Amount paid</label><input type="number" value={f.amtPaid} onChange={u("amtPaid")} style={IS}/></div>
        <div><label style={LB}>Status</label><select value={f.status} onChange={u("status")} style={IS}><option value="paid">Paid</option><option value="balance">Balance</option><option value="unpaid">Unpaid</option></select></div>
        <div><label style={LB}>Method</label><select value={f.method} onChange={u("method")} style={IS}>{METHODS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:700,color:T.text}}>Balances</span>
        <button onClick={()=>setBals(b=>[...b,{desc:"",amt:""}])} style={{padding:"4px 10px",border:"1px solid "+T.border2,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,background:T.bg3,color:T.text}}>+ Add</button>
      </div>
      {bals.map((bl,i)=>(
        <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
          <input placeholder="Description" value={bl.desc||""} onChange={e=>setBals(b=>b.map((x,j)=>j===i?{...x,desc:e.target.value}:x))} style={{...IS,flex:2}}/>
          <input type="number" value={bl.amt||""} onChange={e=>setBals(b=>b.map((x,j)=>j===i?{...x,amt:e.target.value}:x))} style={{...IS,width:85}}/>
          <button onClick={()=>setBals(b=>b.filter((_,j)=>j!==i))} style={{background:T.rbg,color:T.red,border:"1px solid "+T.rbr,borderRadius:6,padding:"6px 10px",cursor:"pointer",fontWeight:700}}>x</button>
        </div>
      ))}
      <div><label style={LB}>Notes</label><input value={f.notes} onChange={u("notes")} placeholder="Optional..." style={IS}/></div>
      <div style={{background:T.bg3,borderRadius:8,padding:"8px 10px",marginTop:8,fontSize:14,fontWeight:800,color:T.green}}>Total: {peso(total)}</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button onClick={onClose} style={{padding:"8px 14px",border:"1px solid "+T.border2,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.bg3,color:T.text}}>Cancel</button>
        <button onClick={()=>onSave(f,bals,total)} style={{padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:T.green,color:"#071a0e"}}>Save record</button>
      </div>
    </OL>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const now=new Date();
  const[dark,setDark]=useState(LS.get("dark")!==false);
  const T=dark?DK:LT;
  const[tab,setTab]=useState(0);
  const[tenants,setTenants]=useState(LS.get("tenants")||[]);
  const[bills,setBills]=useState(LS.get("bills")||[]);
  const[expenses,setExpenses]=useState(LS.get("expenses")||[]);
  const[kwh,setKwh]=useState(LS.get("kwh")||{});
  const[transfers,setTransfers]=useState(LS.get("transfers")||{});
  const[micData,setMicData]=useState(LS.get("mic")||{});
  const[kwhRate,setKwhRate]=useState(LS.get("kwhRate")||15);
  const[soco,setSoco]=useState(LS.get("soco")||[]);
  const[billingMonth,setBillingMonth]=useState(cm());
  const[invRoom,setInvRoom]=useState("");
  const[finMonth,setFinMonth]=useState(cm());
  const[histRoom,setHistRoom]=useState("");
  const[histYear,setHistYear]=useState(String(now.getFullYear()));
  const[search,setSearch]=useState("");
  const[profile,setProfile]=useState(null);
  const[readmeOpen,setReadmeOpen]=useState(false);
  const[backupOpen,setBackupOpen]=useState(false);
  const[tenantOpen,setTenantOpen]=useState(false);
  const[tenantEdit,setTenantEdit]=useState(null);
  const[billOpen,setBillOpen]=useState(false);
  const[billForm,setBillForm]=useState(null);
  const[billBals,setBillBals]=useState([]);
  const[billPayments,setBillPayments]=useState([]);
  const[expOpen,setExpOpen]=useState(false);
  const[socoOpen,setSocoOpen]=useState(false);
  const[socoEdit,setSocoEdit]=useState(null);
  const[socoEditIdx,setSocoEditIdx]=useState(-1);
  const[prevOpen,setPrevOpen]=useState(false);
  const[dashMonth,setDashMonth]=useState(cm());

  const sv=(k,v,s)=>{s(v);LS.set(k,v);};
  const setT=v=>sv("tenants",v,setTenants);
  const setB=v=>sv("bills",v,setBills);
  const setE=v=>sv("expenses",v,setExpenses);
  const setK=v=>sv("kwh",v,setKwh);
  const setTr=v=>sv("transfers",v,setTransfers);
  const setMic=v=>sv("mic",v,setMicData);
  const setSc=v=>sv("soco",v,setSoco);

  const curMon=cm();
  const[dashY,dashM]=dashMonth.split("-").map(Number);
  const due=lastDay(dashY,dashM-1);
  const curBills=bills.filter(b=>b.month===dashMonth);
  const paidBills=curBills.filter(b=>b.status==="paid");
  const unpaidBills=curBills.filter(b=>b.status!=="paid");
  const overdue=unpaidBills.filter(()=>today()>due);
  const allMonths=[...new Set([curMon,...bills.map(b=>b.month)])].sort((a,z)=>z.localeCompare(a)).slice(0,24);
  const[by,bm]=billingMonth.split("-").map(Number);
  const billingDue=lastDay(by,bm-1);
  const billingCur=bills.filter(b=>b.month===billingMonth).sort((a,z)=>a.room-z.room);
  const selYear=finMonth.slice(0,4);
  const yearMonths=Array.from({length:12},(_,i)=>selYear+"-"+pad(i+1));
  const finBills=bills.filter(b=>b.month===finMonth);
  const finExp=expenses.filter(e=>e.date&&e.date.slice(0,7)===finMonth).reduce((a,e)=>a+e.amt,0);
  const finGross=finBills.reduce((a,b)=>a+b.total,0);
  const allYears=[...new Set([String(now.getFullYear()),...bills.map(b=>b.month.slice(0,4))])].sort((a,z)=>z-a);
  const histFiltered=bills.filter(b=>b.month.startsWith(histYear)&&(!histRoom||b.room==histRoom)).sort((a,z)=>z.month.localeCompare(a.month));
  const histByRoom=useMemo(()=>{const m={};histFiltered.forEach(b=>{if(!m[b.room])m[b.room]=[];m[b.room].push(b);});return m;},[histFiltered]);
  const filtered=tenants.filter(t=>t.name&&t.name.toLowerCase().includes(search.toLowerCase())||String(t.room).includes(search));

  useEffect(()=>{
    if(curBills.length===0){
      const active=tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out");
      if(!active.length)return;
      const nb=[...bills];
      active.forEach(t=>{
        if(nb.find(b=>b.room===t.room&&b.month===dashMonth))return;
        const k=kwh["r"+t.room]||{};
        const prev=[...nb].filter(b=>b.room===t.room&&b.month<curMon).sort((a,z)=>z.month.localeCompare(a.month))[0];
        const pb=prev&&prev.status!=="paid"&&prev.balances?prev.balances.map(bl=>({desc:"Carry: "+bl.desc,amt:bl.amt})):[];
        const bt=pb.reduce((a,b)=>a+b.amt,0);
        const elec=parseFloat((k.bill||0).toFixed(2));
        nb.push({room:t.room,name:t.name,month:dashMonth,datePaid:"",dueDate:due,rent:t.rent||0,elec,water:t.water||0,wifi:t.wifi||0,balances:pb,balTotal:bt,total:(t.rent||0)+elec+(t.water||0)+(t.wifi||0)+bt,amtPaid:0,status:"unpaid",method:"",notes:""});
      });
      setB(nb);
    }
  },[]);

  function genBills(){
    const active=tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out");
    if(!active.length){alert("No active tenants.");return;}
    let created=0,skipped=0;
    const nb=[...bills];
    active.forEach(t=>{
      if(nb.find(b=>b.room===t.room&&b.month===curMon)){skipped++;return;}
      const k=kwh["r"+t.room]||{};
      const prev=[...nb].filter(b=>b.room===t.room&&b.month<curMon).sort((a,z)=>z.month.localeCompare(a.month))[0];
      const pb=prev&&prev.status!=="paid"&&prev.balances?prev.balances.map(bl=>({desc:"Carry: "+bl.desc,amt:bl.amt})):[];
      const bt=pb.reduce((a,b)=>a+b.amt,0);
      const elec=parseFloat((k.bill||0).toFixed(2));
      nb.push({room:t.room,name:t.name,month:dashMonth,datePaid:"",dueDate:due,rent:t.rent||0,elec,water:t.water||0,wifi:t.wifi||0,balances:pb,balTotal:bt,total:(t.rent||0)+elec+(t.water||0)+(t.wifi||0)+bt,amtPaid:0,status:"unpaid",method:"",notes:""});
      created++;
    });
    setB(nb);
    alert("Generated "+created+" bill(s)."+(skipped?" "+skipped+" already existed.":""));
  }

  function openBillModal(room,month){
    const b=month?bills.find(x=>x.room==room&&x.month===month):null;
    if(b){
      setBillForm({room:b.room,rent:b.rent||"",elec:b.elec||"",water:b.water||"",wifi:b.wifi||"",status:b.status||"unpaid",notes:b.notes||""});
      setBillBals(b.balances||[]);
      setBillPayments(b.payments||[]);
    }else if(room){
      const t=tenants.find(x=>x.room===room);
      const k=kwh["r"+room]||{};
      const prev=[...bills].filter(b=>b.room===room&&b.month<dashMonth).sort((a,z)=>z.month.localeCompare(a.month))[0];
      const pb=prev&&prev.status!=="paid"&&prev.balances?prev.balances.map(bl=>({desc:"Carry: "+bl.desc,amt:bl.amt})):[];
      setBillForm({room,rent:t?String(t.rent):"",elec:k.bill?k.bill.toFixed(2):"",water:t?String(t.water):"",wifi:t?String(t.wifi):"",status:"unpaid",notes:""});
      setBillBals(pb);
      setBillPayments([]);
    }else{
      setBillForm(null);setBillBals([]);setBillPayments([]);
    }
    setBillOpen(true);
  }

  function saveBill(f,bals,payments,total,autoStatus){
    const room=parseInt(f.room);
    if(!room){alert("Select a room");return;}
    const t=tenants.find(x=>x.room===room);
    const bt=bals.reduce((a,b)=>a+(parseFloat(b.amt)||0),0);
    const totalPaid=payments.reduce((a,p)=>a+(parseFloat(p.amt)||0),0);
    const lastPay=payments.length>0?payments[payments.length-1]:null;
    const b={
      room,name:t?t.name:"",month:dashMonth,dueDate:due,
      rent:parseFloat(f.rent)||0,elec:parseFloat(f.elec)||0,water:parseFloat(f.water)||0,wifi:parseFloat(f.wifi)||0,
      balances:bals,balTotal:bt,total,
      payments,amtPaid:totalPaid,
      datePaid:lastPay?lastPay.date:"",
      method:lastPay?lastPay.method:"",
      status:autoStatus,notes:f.notes
    };
    const ei=bills.findIndex(x=>x.room===room&&x.month===dashMonth);
    setB(ei>=0?bills.map((x,i)=>i===ei?b:x):[...bills,b]);
    setBillOpen(false);
  }

  function savePrevBill(f,bals,total){
    const room=parseInt(f.room);
    if(!room||!f.month){alert("Select room and month");return;}
    const t=tenants.find(x=>x.room===room);
    const bt=bals.reduce((a,b)=>a+(parseFloat(b.amt)||0),0);
    const[y2,m2]=f.month.split("-").map(Number);
    const b={room,name:t?t.name:"",month:f.month,datePaid:f.datePaid,dueDate:lastDay(y2,m2-1),rent:parseFloat(f.rent)||0,elec:parseFloat(f.elec)||0,water:parseFloat(f.water)||0,wifi:parseFloat(f.wifi)||0,balances:bals,balTotal:bt,total,amtPaid:parseFloat(f.amtPaid)||0,status:f.status,method:f.method,notes:f.notes};
    const ei=bills.findIndex(x=>x.room===room&&x.month===f.month);
    setB(ei>=0?bills.map((x,i)=>i===ei?b:x):[...bills,b]);
    setPrevOpen(false);
    alert("Saved bill for Room "+room);
  }

  function saveTenant(f,m){
    const room=parseInt(f.room);
    if(!room||!f.name||!f.name.trim()){alert("Enter room # and name");return;}
    const t={...f,room,rent:parseFloat(f.rent)||0,water:parseFloat(f.water)||0,wifi:parseFloat(f.wifi)||0,deposit:parseFloat(f.deposit)||0};
    const nt=tenantEdit?tenants.map((x,i)=>i===tenantEdit.idx?t:x):[...tenants,t];
    nt.sort((a,b)=>a.room-b.room);
    setT(nt);
    setMic({...micData,["m"+room]:m});
    setTenantOpen(false);
  }

  function applyKWH(room){
    const k=kwh["r"+room];
    if(!k||!k.curr){alert("Enter readings first");return;}
    const nm=cm().split("-").map(Number);
    const nd=new Date(nm[0],nm[1],1);
    const nextMon=nd.getFullYear()+"-"+pad(nd.getMonth()+1);
    const nb=bills.map(b=>{
      if(b.room===room&&b.month===curMon){const elec=parseFloat(k.bill.toFixed(2));return{...b,elec,total:b.rent+elec+b.water+b.wifi+(b.balTotal||0)};}
      return b;
    });
    setB(nb);
    const prev=k.pfm&&k.pfm[curMon]!==undefined?k.pfm[curMon]:k.prev||0;
    const entry={month:curMon,prev,curr:k.curr,kwh:k.kwh,bill:k.bill};
    const hist=[...(k.hist||[])];
    const ei=hist.findIndex(h=>h.month===curMon);
    if(ei>=0)hist[ei]=entry;else hist.push(entry);
    setK({...kwh,["r"+room]:{...k,hist,pfm:{...(k.pfm||{}),[nextMon]:k.curr},prev:k.curr}});
    alert("Applied "+peso(k.bill)+" to Room "+room+". Next month prev = "+k.curr);
  }

  function updKWH(room,field,val){
    const k=kwh["r"+room]||{};
    let u={...k};
    if(field==="prev"){u.pfm={...(k.pfm||{}),[curMon]:parseFloat(val)||0};u.prev=parseFloat(val)||0;}
    else{u.curr=parseFloat(val)||0;}
    const prev=u.pfm&&u.pfm[curMon]!==undefined?u.pfm[curMon]:u.prev||0;
    const kused=Math.max(0,(u.curr||0)-prev);
    u.kwh=kused;u.bill=kused*kwhRate;
    setK({...kwh,["r"+room]:u});
  }

  function togTr(tkey,field){
    const cur=transfers[tkey]||{};
    const nowOn=!cur[field];
    const dateKey=field+"Date";
    const update={...cur,[field]:nowOn};
    if(nowOn){update[dateKey]=today();}
    else{delete update[dateKey];}
    setTr({...transfers,[tkey]:update});
  }

  function qBal(room,month){
    const desc=prompt("Balance description:","Balance");if(!desc)return;
    const amt=parseFloat(prompt("Amount (P):","0")||0);
    setB(bills.map(b=>{
      if(b.room===room&&b.month===month){
        const nb=[...(b.balances||[]),{desc,amt}];
        const bt=nb.reduce((a,x)=>a+x.amt,0);
        return{...b,balances:nb,balTotal:bt,total:b.rent+b.elec+b.water+b.wifi+bt};
      }return b;
    }));
  }

  function copySMS(room){
    if(!room){alert("Select a room first");return;}
    const t=tenants.find(x=>x.room===room);
    const b=bills.find(x=>x.room===room&&x.month===curMon);
    const k=kwh["r"+room]||{};
    const elec=b?b.elec:(k.bill||0),water=b?b.water:(t?t.water||0:0),wifi=b?b.wifi:(t?t.wifi||0:0),rent=b?b.rent:(t?t.rent||0:0);
    const bt=(b&&b.balances||[]).reduce((a,x)=>a+(parseFloat(x.amt)||0),0);
    const total=rent+elec+water+wifi+bt;
    const txt="Hi "+(t?t.name:"")+"! Your bill for "+fmt(curMon)+":\n\nRoom: "+peso(rent)+"\nElectric: "+peso(elec)+" ("+(k.kwh||0)+"kwh)\nWater: "+peso(water)+"\nWifi: "+peso(wifi)+(bt?"\nBalance: "+peso(bt):"")+"\n\nTOTAL: "+peso(total)+"\nDue: "+due+"\n\nThank you!";
    navigator.clipboard.writeText(txt).then(()=>alert("Copied!")).catch(()=>prompt("Copy:",txt));
  }

  function exportCSV(rows,fn){
    const csv=rows.map(r=>Array.isArray(r)?r.map(v=>'"'+String(v||"").replace(/"/g,'""')+'"').join(","):"").join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=fn;a.click();
  }

  function backupData(){
    const data={tenants,bills,expenses,kwh,transfers,micData,kwhRate,soco,exportedAt:new Date().toISOString(),version:"bh9"};
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="BH_Backup_"+today()+".json";a.click();
  }

  function restoreData(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data.version||!data.version.startsWith("bh")){alert("Invalid backup file.");return;}
        if(!confirm("Restore backup from "+(data.exportedAt||"").slice(0,10)+"? This replaces all current data."))return;
        setT(data.tenants||[]);setB(data.bills||[]);setE(data.expenses||[]);
        setK(data.kwh||{});setTr(data.transfers||{});setMic(data.micData||{});
        setSc(data.soco||[]);setKwhRate(data.kwhRate||15);
        alert("Backup restored!");setBackupOpen(false);
      }catch(err){alert("Failed to read backup file.");}
    };
    reader.readAsText(file);
  }

  function printAll(){
    const ab=bills.filter(b=>b.month===curMon);
    if(!ab.length){alert("No bills this month.");return;}
    const win=window.open("","_blank");
    const rows=ab.map(b=>{
      const t=tenants.find(x=>x.room===b.room);const k=kwh["r"+b.room]||{};
      return '<div style="page-break-after:always;padding:24px;font-family:Arial,sans-serif;max-width:400px;margin:0 auto;border:1px solid #ccc;border-radius:8px;margin-bottom:20px"><div style="text-align:center;border-bottom:2px solid #16a34a;padding-bottom:10px;margin-bottom:12px"><div style="font-size:20px;font-weight:800;color:#16a34a">BOARDING HOUSE</div><div style="font-size:13px;font-weight:700;margin-top:3px">'+fmt(b.month)+'</div></div><div style="background:#f5f5f5;border-radius:6px;padding:8px 10px;margin-bottom:10px"><div style="font-size:14px;font-weight:700">Room '+b.room+' - '+(t?t.name:"")+'</div></div><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:4px">Electricity</div>'+[["Previous",k.prev||0],["Current",k.curr||0],["KWH used",(k.kwh||0)+" kwh"],["Rate","P"+kwhRate+"/kwh"],["Electric bill",peso(b.elec)]].map(([l,v])=>'<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;font-size:12px"><span style="color:#666">'+l+'</span><span>'+v+'</span></div>').join("")+'<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#888;margin:8px 0 4px">Charges</div>'+[["Water",peso(b.water)],["Room rent",peso(b.rent)],["Wifi",peso(b.wifi)]].map(([l,v])=>'<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;font-size:12px"><span style="color:#666">'+l+'</span><span>'+v+'</span></div>').join("")+'<div style="display:flex;justify-content:space-between;padding:10px 0 3px;font-size:15px;font-weight:800;border-top:2px solid #ccc;margin-top:8px;color:#16a34a"><span>Total due</span><span>'+peso(b.total)+'</span></div><div style="text-align:center;margin-top:10px;font-size:11px;font-weight:600;color:#d97706">Due on or before '+b.dueDate+'</div></div>';
    }).join("");
    win.document.write('<!DOCTYPE html><html><head><title>All Invoices</title></head><body><div style="text-align:center;margin-bottom:20px"><button onclick="window.print()" style="padding:10px 20px;font-size:14px;font-weight:700;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer">Print All</button></div>'+rows+'</body></html>');
    win.document.close();
  }

  // Styles (inside App, uses T which is fine since these are just objects, not components)
  const IS={width:"100%",padding:"8px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const LB={fontSize:12,fontWeight:600,color:T.text2,display:"block",marginBottom:3,marginTop:8};
  const BT=(bg,col)=>({padding:"8px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",background:bg,color:col});
  const BSM=(bg,col,brd)=>({padding:"5px 10px",border:brd?"1px solid "+brd:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:bg,color:col});
  const BDG=(bg,col)=>({display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:bg,color:col});
  const ST=(acc)=>({background:T.card,border:"1px solid "+T.border,borderLeft:"3px solid "+acc,borderRadius:10,padding:12});
  const TH={padding:"9px 10px",textAlign:"left",color:T.text3,fontSize:10,fontWeight:700,textTransform:"uppercase",background:T.bg3,borderBottom:"1px solid "+T.border};
  const TD={padding:"9px 10px",borderBottom:"1px solid "+T.border,color:T.text,verticalAlign:"middle"};
  const SL={fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,color:T.text3,margin:"14px 0 8px"};

  // Invoice
  const invT=tenants.find(x=>x.room==invRoom);
  const invB=bills.find(x=>x.room==invRoom&&x.month===curMon);
  const invK=kwh["r"+invRoom]||{};
  const invElec=invB?invB.elec:(invK.bill||0);
  const invWater=invB?invB.water:(invT?invT.water||0:0);
  const invWifi=invB?invB.wifi:(invT?invT.wifi||0:0);
  const invRent=invB?invB.rent:(invT?invT.rent||0:0);
  const invBals=invB&&invB.balances||[];
  const invBt=invBals.reduce((a,x)=>a+(parseFloat(x.amt)||0),0);
  const invTotal=invRent+invElec+invWater+invWifi+invBt;
  const invDue=lastDay(now.getFullYear(),now.getMonth());
  const invDueLbl=new Date(invDue+"T00:00:00").toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric"});
  const mLbl=now.toLocaleDateString("en-PH",{month:"long",year:"numeric"});
  const dLbl=now.toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric"});

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14}}>

      <TenantModal open={tenantOpen} editData={tenantEdit} T={T} onClose={()=>setTenantOpen(false)} onSave={saveTenant}/>
      <BillModal open={billOpen} initForm={billForm} initBals={billBals} initPayments={billPayments} T={T} tenants={tenants} kwhData={kwh} bills={bills} curMon={dashMonth} onClose={()=>setBillOpen(false)} onSave={saveBill}/>
      <ExpModal open={expOpen} T={T} onClose={()=>setExpOpen(false)} onSave={(e)=>{setE([...expenses,e]);setExpOpen(false);}}/>
      <SocoModal open={socoOpen} editRec={socoEdit} T={T} onClose={()=>setSocoOpen(false)} onSave={(f)=>{const ns=socoEditIdx>=0?soco.map((x,i)=>i===socoEditIdx?f:x):[...soco,f];setSc(ns);setSocoOpen(false);}}/>
      <PrevBillModal open={prevOpen} T={T} tenants={tenants} onClose={()=>setPrevOpen(false)} onSave={savePrevBill}/>

      <div style={{background:T.bg2,borderBottom:"1px solid "+T.border,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>Boarding House</div>
          <div style={{fontSize:11,color:T.text3,marginTop:2}}>{now.toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:T.text3,textTransform:"uppercase",letterSpacing:.5}}>Due this month</div>
            <div style={{fontSize:13,fontWeight:700,color:T.amber}}>{due}</div>
          </div>
          <button onClick={()=>setBackupOpen(true)} style={{...BSM(T.bg3,T.text2),padding:"6px 8px",border:"1px solid "+T.border}} title="Backup">Backup</button>
          <button onClick={()=>setReadmeOpen(true)} style={{...BSM(T.bg3,T.text2),padding:"6px 8px",border:"1px solid "+T.border}} title="Help">Help</button>
          <button onClick={()=>{const d=!dark;setDark(d);LS.set("dark",d);}} style={{...BSM(T.bg3,T.text2),padding:"6px 8px",border:"1px solid "+T.border}}>{dark?"Light":"Dark"}</button>
        </div>
      </div>

      <div style={{background:T.bg2,borderBottom:"1px solid "+T.border,display:"flex",overflowX:"auto",padding:"0 6px"}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{padding:"10px 11px",fontSize:12,fontWeight:600,border:"none",background:"none",cursor:"pointer",color:tab===i?T.green:T.text3,borderBottom:tab===i?"2px solid "+T.green:"2px solid transparent",whiteSpace:"nowrap",fontFamily:"inherit",position:"relative"}}>
            {t}
            {i===0&&overdue.length>0&&<span style={{position:"absolute",top:6,right:2,background:T.red,color:"#fff",borderRadius:99,fontSize:9,fontWeight:700,padding:"1px 4px"}}>{overdue.length}</span>}
          </button>
        ))}
      </div>

      <div style={{padding:14,background:T.bg}}>

        {tab===0&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Dashboard</h2>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.text3}}>Viewing:</span>
                <select value={dashMonth} onChange={e=>setDashMonth(e.target.value)} style={{padding:"6px 10px",border:"1px solid "+T.border2,borderRadius:8,fontSize:13,color:T.text,background:T.input,fontFamily:"inherit",cursor:"pointer"}}>
                  {allMonths.map(m=><option key={m} value={m}>{fmt(m)}{m===curMon?" (current)":""}</option>)}
                </select>
                {dashMonth!==curMon&&<button onClick={()=>setDashMonth(curMon)} style={{padding:"5px 10px",border:"1px solid "+T.border2,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,background:T.bg3,color:T.text}}>Back to current</button>}
              </div>
            </div>
            {dashMonth!==curMon&&<div style={{background:T.bbg,border:"1px solid "+T.bbr,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.blue,marginBottom:10,fontWeight:600}}>Viewing: {fmt(dashMonth)} bills · Paid on any date</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[[T.green,"Active tenants",tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").length],[T.green,"Paid",paidBills.length],[T.red,"Unpaid",unpaidBills.length],[T.blue,"Total billed",peso(curBills.reduce((a,b)=>a+b.total,0))]].map(([c,l,v])=>(
                <div key={l} style={ST(c)}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c,marginTop:3}}>{v}</div></div>
              ))}
            </div>
            {overdue.length>0&&<div style={{background:T.rbg,border:"1px solid "+T.rbr,borderRadius:8,padding:"9px 12px",fontSize:12,fontWeight:600,color:T.red,marginBottom:10}}>OVERDUE: {overdue.map(b=>"Room "+b.room+" ("+b.name+")").join(", ")}</div>}
            {curBills.length===0&&tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").length>0&&(
              <div style={{background:T.gbg,border:"1px solid "+T.gbr,borderRadius:10,padding:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,color:T.green,fontSize:13}}>No bills yet for {fmt(dashMonth)}</div><div style={{fontSize:12,color:T.text3,marginTop:2}}>Auto-create for all active tenants</div></div>
                <button style={BT(T.green,"#071a0e")} onClick={genBills}>Generate bills</button>
              </div>
            )}
            <div style={SL}>PAID — {fmt(dashMonth).toUpperCase()}</div>
            {paidBills.length===0&&<div style={{color:T.text3,fontSize:13}}>None paid yet.</div>}
            {paidBills.map(b=>(
              <div key={b.room} style={{background:T.gbg,border:"1px solid "+T.gbr,borderRadius:10,padding:11,marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:700,fontSize:14}}>{b.name} <span style={{color:T.text3,fontWeight:400,fontSize:12}}>Room {b.room}</span></div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:800,color:T.green}}>{peso(b.total)}</div><span style={BDG(T.green,"#071a0e")}>PAID</span></div>
                </div>
                {b.payments&&b.payments.length>0?(
                  <div style={{marginTop:6}}>
                    {b.payments.map((p,i)=>(
                      <div key={i} style={{fontSize:11,color:T.text3,display:"flex",gap:6,alignItems:"center",marginTop:2}}>
                        <span style={{color:T.green,fontWeight:700}}>Payment {i+1}:</span>
                        <span>{peso(p.amt)}</span>
                        <span>on {p.date}</span>
                        <span style={BDG(T.bbg,T.blue)}>{p.method}</span>
                        {p.note&&<span>· {p.note}</span>}
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{fontSize:12,color:T.text3,marginTop:2}}>{b.datePaid||"—"} <span style={BDG(T.bbg,T.blue)}>{b.method||"—"}</span></div>
                )}
              </div>
            ))}
            <div style={SL}>UNPAID / BALANCE — {fmt(dashMonth).toUpperCase()}</div>
            {unpaidBills.length===0&&<div style={{color:T.text3,fontSize:13}}>All paid this month!</div>}
            {unpaidBills.map(b=>{const ov=today()>due;return(
              <div key={b.room} style={{background:ov?T.rbg:T.abg,border:"1px solid "+(ov?T.rbr:T.abr),borderRadius:10,padding:11,marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:700,fontSize:14}}>{b.name} <span style={{color:T.text3,fontWeight:400,fontSize:12}}>Room {b.room}</span></div><div style={{fontSize:12,color:T.text3,marginTop:2}}>Due {due}{ov&&<span style={{color:T.red,fontWeight:700}}> OVERDUE</span>}</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <div style={{fontSize:17,fontWeight:800}}>{peso(b.total)}</div>
                    <span style={BDG(b.status==="balance"?T.abg:T.rbg,b.status==="balance"?T.amber:T.red)}>{b.status}</span>
                    <button style={{padding:"3px 8px",fontSize:11,fontWeight:700,background:T.bbg,color:T.blue,border:"1px solid "+T.bbr,borderRadius:6,cursor:"pointer"}} onClick={()=>copySMS(b.room)}>SMS</button>
                  </div>
                </div>
                {b.payments&&b.payments.length>0&&(
                  <div style={{marginTop:6,padding:"6px 8px",background:"rgba(0,0,0,0.1)",borderRadius:6}}>
                    {b.payments.map((p,i)=>(
                      <div key={i} style={{fontSize:11,color:T.text2,display:"flex",gap:6,alignItems:"center",marginTop:2}}>
                        <span style={{color:T.blue,fontWeight:700}}>Paid {i+1}:</span>
                        <span style={{fontWeight:600}}>{peso(p.amt)}</span>
                        <span>on {p.date}</span>
                        <span style={BDG(T.bbg,T.blue)}>{p.method}</span>
                        {p.note&&<span style={{color:T.text3}}>· {p.note}</span>}
                      </div>
                    ))}
                    <div style={{fontSize:12,fontWeight:700,color:T.amber,marginTop:4}}>Remaining: {peso(Math.max(0,b.total-b.payments.reduce((a,p)=>a+(parseFloat(p.amt)||0),0)))}</div>
                  </div>
                )}
              </div>
            );})}
            <div style={SL}>TRANSFER CHECKLIST — {fmt(dashMonth).toUpperCase()}</div>
            {curBills.length===0&&<div style={{color:T.text3,fontSize:13}}>No bills yet.</div>}
            {curBills.map(b=>{const tkey=b.room+"-"+b.month;const tr=transfers[tkey]||{};const all=tr.room&&tr.elec&&tr.water&&tr.wifi;return(
              <div key={b.room} style={{padding:"9px 0",borderBottom:"1px solid "+T.border}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:700}}>Room {b.room} - {b.name}</span>
                  <span style={BDG(all?T.green:T.bg4,all?"#071a0e":T.text2)}>{all?"Done":"Pending"}</span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["room","elec","water","wifi"].map(field=>(
                    <div key={field} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
                      <label style={{display:"flex",gap:4,alignItems:"center",fontSize:12,cursor:"pointer",color:tr[field]?T.green:T.text2}}>
                        <input type="checkbox" checked={!!tr[field]} onChange={()=>togTr(tkey,field)} style={{accentColor:T.green,width:14,height:14,cursor:"pointer"}}/>{field}
                      </label>
                      {tr[field]&&(
                        <input type="date" value={tr[field+"Date"]||today()} onChange={e=>{const cur=transfers[tkey]||{};setTr({...transfers,[tkey]:{...cur,[field+"Date"]:e.target.value}});}} style={{fontSize:10,padding:"2px 4px",border:"1px solid "+T.border2,borderRadius:4,background:T.input,color:T.green,width:100,cursor:"pointer"}}/>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );})}
          </div>
        )}

        {tab===1&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Tenants</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button style={BT(T.amber,"#1c0f00")} onClick={()=>setPrevOpen(true)}>+ Past bill</button>
                <button style={BT(T.green,"#071a0e")} onClick={()=>{setTenantEdit(null);setTenantOpen(true);}}>+ Add tenant</button>
              </div>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or room..." style={{...IS,maxWidth:300,marginBottom:10}}/>
            {filtered.filter(t=>t.status!=="moved_out").length>0&&(
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:8}}>ACTIVE TENANTS ({filtered.filter(t=>t.status!=="moved_out").length})</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:16}}>
                  {filtered.filter(t=>t.status!=="moved_out").map(t=>{
                    const idx=tenants.findIndex(x=>x.room===t.room);
                    const b=bills.find(x=>x.room===t.room&&x.month===curMon);
                    const ip=b&&b.status==="paid";
                    const ov=b&&b.status!=="paid"&&today()>due;
                    const r=rel(bills.filter(x=>x.room===t.room));
                    const mo=t.moveIn?Math.max(0,Math.floor(diffDays(t.moveIn,today())/30)):0;
                    const chk=micData["m"+t.room]||{};
                    const cd=MIC.filter((_,j)=>chk[j]).length;
                    return(
                      <div key={t.room} style={{background:ip?T.green+"10":T.card,border:"1px solid "+(ip?T.gbr:T.border),borderLeft:"3px solid "+(ip?T.green:ov?T.red:t.type==="new"?T.blue:T.border2),borderRadius:10,padding:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div style={{fontSize:24,fontWeight:800,color:T.green}}>Rm {t.room}</div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                            <span style={BDG(t.type==="new"?T.bbg:T.bg4,t.type==="new"?T.blue:T.text2)}>{t.type==="new"?"New":"Old"}</span>
                            {ov&&<span style={BDG(T.rbg,T.red)}>Overdue</span>}
                          </div>
                        </div>
                        <div style={{fontSize:14,fontWeight:700}}>{t.status!=="vacant"?t.name:"— Vacant —"}</div>
                        {t.phone&&<div style={{fontSize:12,color:T.text3,marginTop:2}}>{t.phone}</div>}
                        {t.moveIn&&<div style={{fontSize:12,color:T.text3,marginTop:4}}>Move-in: {t.moveIn}{mo>0?" · "+mo+"mo":""}</div>}
                        {t.contractEnd&&<div style={{fontSize:12,color:today()>t.contractEnd?T.red:T.text3,marginTop:2}}>Contract: {t.contractEnd}</div>}
                        <div style={{marginTop:6,fontSize:12,fontWeight:600,color:r.color}}>{r.label} ({r.score}%)</div>
                        <div style={{marginTop:8,padding:"7px 9px",background:ip?T.gbg:T.abg,border:"1px solid "+(ip?T.gbr:T.abr),borderRadius:7,fontSize:12,fontWeight:600,color:ip?T.green:T.amber}}>Due: {due}{b?" · "+b.status.toUpperCase():" · No bill"}</div>
                        {b&&<div style={{marginTop:7,fontSize:15,fontWeight:800,color:ip?T.green:T.text}}>Total: {peso(b.total)}</div>}
                        {t.notes&&<div style={{marginTop:5,fontSize:11,color:T.amber,fontStyle:"italic"}}>Note: {t.notes}</div>}
                        {t.type==="new"&&cd<MIC.length&&<div style={{marginTop:5}}><div style={{fontSize:12,color:T.blue}}>{cd}/{MIC.length} move-in items</div><div style={{height:4,background:T.bg4,borderRadius:2,marginTop:3,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(cd/MIC.length*100)+"%",background:T.blue,borderRadius:2}}/></div></div>}
                        <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                          <button style={BSM(T.green,"#071a0e")} onClick={()=>setProfile(t)}>Profile</button>
                          <button style={BSM(T.bg3,T.text)} onClick={()=>{setTenantEdit({idx,tenant:t,mic:micData["m"+t.room]||{}});setTenantOpen(true);}}>Edit</button>
                          <button style={{padding:"4px 9px",fontSize:11,fontWeight:700,background:T.bbg,color:T.blue,border:"1px solid "+T.bbr,borderRadius:6,cursor:"pointer"}} onClick={()=>copySMS(t.room)}>SMS</button>
                          <button style={BSM(T.rbg,T.red)} onClick={()=>{if(!confirm("Remove?"))return;setT(tenants.filter(x=>x.room!==t.room));}}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {filtered.filter(t=>t.status==="moved_out").length>0&&(
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text3,marginBottom:8}}>FORMER TENANTS ({filtered.filter(t=>t.status==="moved_out").length}) — Records kept for reference</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                  {filtered.filter(t=>t.status==="moved_out").map(t=>{
                    const idx=tenants.findIndex(x=>x.room===t.room);
                    const rb=bills.filter(b=>b.room===t.room);
                    const totalPaid=rb.filter(b=>b.status==="paid").reduce((a,b)=>a+b.total,0);
                    const r=rel(rb);
                    return(
                      <div key={t.room} style={{background:T.bg3,border:"1px solid "+T.border,borderRadius:10,padding:12,opacity:.85}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div style={{fontSize:22,fontWeight:800,color:T.text3}}>Rm {t.room}</div>
                          <span style={BDG(T.bg4,T.text3)}>Moved out</span>
                        </div>
                        <div style={{fontSize:14,fontWeight:700,color:T.text2}}>{t.name}</div>
                        {t.moveIn&&<div style={{fontSize:12,color:T.text3,marginTop:3}}>Moved in: {t.moveIn}</div>}
                        {t.moveOutDate&&<div style={{fontSize:12,color:T.text3,marginTop:1}}>Moved out: {t.moveOutDate}</div>}
                        <div style={{marginTop:8,padding:"6px 9px",background:T.bg4,borderRadius:7,fontSize:12}}>
                          <div style={{color:T.text2,fontWeight:600}}>Total paid: <span style={{color:T.green}}>{peso(totalPaid)}</span></div>
                          <div style={{color:r.color,fontSize:11,marginTop:2}}>{r.label}</div>
                        </div>
                        {t.notes&&<div style={{marginTop:5,fontSize:11,color:T.amber,fontStyle:"italic"}}>Note: {t.notes}</div>}
                        <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                          <button style={BSM(T.bg4,T.text2)} onClick={()=>setProfile(t)}>History</button>
                          <button style={BSM(T.bg4,T.text2)} onClick={()=>{setTenantEdit({idx,tenant:t,mic:micData["m"+t.room]||{}});setTenantOpen(true);}}>Edit</button>
                          <button style={BSM(T.green,"#071a0e")} onClick={()=>{if(!confirm("Re-activate?"))return;setT(tenants.map((x,i)=>i===idx?{...x,status:"occupied",moveOutDate:""}:x));}}>Re-activate</button>
                          <button style={BSM(T.rbg,T.red)} onClick={()=>{if(!confirm("Permanently delete?"))return;setT(tenants.filter(x=>x.room!==t.room));}}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {filtered.length===0&&<div style={{color:T.text3,padding:30,textAlign:"center"}}>No tenants found.</div>}
          </div>
        )}

        {tab===2&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Billing</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button style={BSM(T.green,"#071a0e")} onClick={genBills}>Auto-generate</button>
                <button style={BSM(T.bg3,T.text)} onClick={()=>openBillModal()}>+ Add bill</button>
                <button style={BSM(T.amber,"#1c0f00")} onClick={()=>setPrevOpen(true)}>+ Past bill</button>
                <button style={BSM(T.blue,"#fff")} onClick={printAll}>Print all</button>
                <button style={BSM(T.amber,"#1c0f00")} onClick={()=>exportCSV([["BOARDING HOUSE Billing Record"],["Month: "+fmt(billingMonth)],[],["Room","Name","Due","Paid on","Rent","Elec","Water","Wifi","Balance","Total","Status","Method"],...billingCur.map(b=>[b.room,b.name,billingDue,b.datePaid||"",b.rent,b.elec,b.water,b.wifi,b.balTotal||0,b.total,b.status,b.method||""])],"Billing_"+billingMonth+".csv")}>Export CSV</button>
              </div>
            </div>
            <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:10}}>
              {allMonths.map(m=>(
                <button key={m} onClick={()=>setBillingMonth(m)} style={{padding:"5px 12px",fontSize:12,fontWeight:600,border:"1px solid "+(m===billingMonth?T.green:T.border2),background:m===billingMonth?T.green:T.bg2,borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",color:m===billingMonth?"#071a0e":T.text3}}>{fmt(m)}</button>
              ))}
            </div>
            <div style={{border:"1px solid "+T.border,borderRadius:10,overflow:"hidden",overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:780}}>
              <thead><tr>{["Room","Name","Due","Paid on","Balances","Rent","Elec","Water","Wifi","Total","Status","Transfer",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {billingCur.length===0&&<tr><td colSpan={13} style={{...TD,padding:30,textAlign:"center",color:T.text3}}>No bills for {fmt(billingMonth)}.</td></tr>}
                {billingCur.map(b=>{
                  const ip=b.status==="paid",ib=b.status==="balance",ov=b.status!=="paid"&&today()>billingDue;
                  const tkey=b.room+"-"+b.month;const tr=transfers[tkey]||{};
                  const t=tenants.find(x=>x.room===b.room);
                  return(
                    <tr key={b.room} style={{background:ip?T.green+"08":ib?T.amber+"08":ov?T.red+"08":"transparent"}}>
                      <td style={TD}><strong style={{color:T.green}}>Rm {b.room}</strong></td>
                      <td style={{...TD,fontWeight:600}}>{b.name}</td>
                      <td style={{...TD,fontSize:11,color:ov?T.red:T.text2}}>{billingDue}</td>
                      <td style={{...TD,fontSize:11,color:T.text3}}>{b.datePaid||"—"}</td>
                      <td style={TD}>
                        {b.balances&&b.balances.length?b.balances.map((bl,i)=><div key={i} style={{color:T.amber,fontSize:11}}>{bl.desc}: <b>{peso(bl.amt)}</b></div>):<span style={{color:T.text3}}>—</span>}
                        <button onClick={()=>qBal(b.room,b.month)} style={{fontSize:10,background:T.abg,color:T.amber,border:"1px solid "+T.abr,borderRadius:4,padding:"2px 6px",cursor:"pointer",marginTop:2,display:"block"}}>+bal</button>
                      </td>
                      {["rent","elec","water","wifi"].map(field=><td key={field} style={{...TD,fontSize:12,color:T.text2}}>{peso(b[field])}</td>)}
                      <td style={{...TD,fontWeight:800,color:ip?T.green:T.text}}>{peso(b.total)}</td>
                      <td style={TD}>
                        <span style={BDG(ip?T.green:ib?T.abg:T.rbg,ip?"#071a0e":ib?T.amber:T.red)}>{b.status}</span>
                        {b.method&&<div style={{marginTop:3}}><span style={BDG(T.bg4,T.text2)}>{b.method}</span></div>}
                        <div style={{display:"flex",gap:3,marginTop:5}}>
                          <button style={BSM(T.bg3,T.text)} onClick={()=>openBillModal(b.room,b.month)}>Edit</button>
                          <button style={BSM(T.rbg,T.red)} onClick={()=>{if(!confirm("Delete?"))return;setB(bills.filter(x=>!(x.room===b.room&&x.month===b.month)));}}>Del</button>
                        </div>
                      </td>
                      <td style={TD}>
                        {["room","elec","water","wifi"].map(field=>(
                          <div key={field} style={{marginBottom:4}}>
                            <label style={{display:"flex",gap:4,alignItems:"center",fontSize:11,cursor:"pointer",color:tr[field]?T.green:T.text2}}>
                              <input type="checkbox" checked={!!tr[field]} onChange={()=>togTr(tkey,field)} style={{accentColor:T.green,cursor:"pointer"}}/>{field}
                            </label>
                            {tr[field]&&<input type="date" value={tr[field+"Date"]||today()} onChange={e=>{const cur=transfers[tkey]||{};setTr({...transfers,[tkey]:{...cur,[field+"Date"]:e.target.value}});}} style={{fontSize:10,padding:"2px 4px",border:"1px solid "+T.border2,borderRadius:4,background:T.input,color:T.green,width:95,marginTop:2}}/>}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}

        {tab===3&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>KWH Reader</h2>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:600,color:T.text2}}>Rate per kwh</span>
                <input type="number" value={kwhRate} onChange={e=>{const v=parseFloat(e.target.value)||15;setKwhRate(v);LS.set("kwhRate",v);}} style={{...IS,width:65,textAlign:"center"}}/>
              </div>
            </div>
            <div style={{background:T.gbg,border:"1px solid "+T.gbr,borderRadius:8,padding:"9px 12px",fontSize:12,color:T.green,marginBottom:12}}>(Current minus Previous) x Rate = Electric bill. Click Apply to save.</div>
            <div style={{border:"1px solid "+T.border,borderRadius:10,overflow:"hidden",overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:640}}>
              <thead><tr>{["Room","Name","Previous","Current","KWH","Rate","Bill","Last 3 months",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").length===0&&<tr><td colSpan={9} style={{...TD,padding:30,textAlign:"center",color:T.text3}}>Add tenants first.</td></tr>}
                {tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").map(t=>{
                  const k=kwh["r"+t.room]||{};
                  const prev=k.pfm&&k.pfm[curMon]!==undefined?k.pfm[curMon]:k.prev||0;
                  const curr=k.curr||0;
                  const kused=Math.max(0,curr-prev);
                  const hist=(k.hist||[]).slice(-3).reverse();
                  return(
                    <tr key={t.room}>
                      <td style={TD}><strong style={{color:T.green}}>Rm {t.room}</strong></td>
                      <td style={{...TD,fontWeight:600}}>{t.name}</td>
                      <td style={TD}><input type="number" defaultValue={prev||""} key={"p"+t.room+curMon} placeholder="Prev" onBlur={e=>updKWH(t.room,"prev",e.target.value)} style={{...IS,width:80,textAlign:"center"}}/></td>
                      <td style={TD}><input type="number" defaultValue={curr||""} key={"c"+t.room+curMon} placeholder="Curr" onBlur={e=>updKWH(t.room,"curr",e.target.value)} style={{...IS,width:80,textAlign:"center"}}/></td>
                      <td style={{...TD,fontWeight:800,color:T.blue}}>{kused}</td>
                      <td style={{...TD,color:T.text3}}>P{kwhRate}</td>
                      <td style={{...TD,fontWeight:800,color:T.green}}>{peso(kused*kwhRate)}</td>
                      <td style={{...TD,fontSize:11,color:T.text3,whiteSpace:"pre-line"}}>{hist.map(h=>MS[parseInt(h.month.split("-")[1])-1]+": "+h.kwh+"kwh").join("\n")||"—"}</td>
                      <td style={TD}><button style={BSM(T.green,"#071a0e")} onClick={()=>applyKWH(t.room)}>Apply</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}

        {tab===4&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Invoice</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <select value={invRoom} onChange={e=>setInvRoom(e.target.value)} style={{...IS,width:160}}><option value="">Select room...</option>{tenants.map(t=><option key={t.room} value={t.room}>Room {t.room} - {t.name}</option>)}</select>
                <button style={BSM(T.bg3,T.text)} onClick={()=>copySMS(parseInt(invRoom)||0)}>Copy SMS</button>
                <button style={BSM(T.blue,"#fff")} onClick={printAll}>Print all</button>
              </div>
            </div>
            {!invRoom?<div style={{color:T.text3,padding:40,textAlign:"center"}}>Select a room to generate invoice.</div>:(
              <div style={{background:dark?"#1a1d27":"#fff",border:"1px solid "+T.border,borderRadius:12,padding:18,maxWidth:400,margin:"0 auto",color:T.text}}>
                <div style={{textAlign:"center",borderBottom:"2px solid "+T.green,paddingBottom:10,marginBottom:12}}>
                  <div style={{fontSize:20,fontWeight:800,color:T.green}}>BOARDING HOUSE</div>
                  <div style={{fontSize:14,fontWeight:700,marginTop:3}}>{mLbl}</div>
                  <div style={{fontSize:11,color:T.text3,marginTop:1}}>{dLbl}</div>
                </div>
                <div style={{background:T.bg3,borderRadius:8,padding:"9px 11px",marginBottom:12}}>
                  <div style={{fontSize:15,fontWeight:700}}>Room {invRoom} - {invT?invT.name:"—"}</div>
                  {invT&&invT.phone&&<div style={{fontSize:11,color:T.text3,marginTop:1}}>{invT.phone}</div>}
                </div>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.text3,marginBottom:5,marginTop:10}}>Electricity</div>
                {[["Rate","P"+kwhRate+"/kwh"],["Previous",invK.prev||0],["Current",invK.curr||0],["KWH used",(invK.kwh||0)+" kwh"],["Electric bill",peso(invElec)]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.border,fontSize:13}}><span style={{color:T.text2}}>{l}</span><span>{v}</span></div>
                ))}
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.text3,marginBottom:5,marginTop:10}}>Charges</div>
                {[["Water",peso(invWater)],["Room rent",peso(invRent)],["Wifi",peso(invWifi)]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.border,fontSize:13}}><span style={{color:T.text2}}>{l}</span><span>{v}</span></div>
                ))}
                {invBals.length>0&&<div>
                  <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.text3,marginBottom:5,marginTop:10}}>Balances</div>
                  {invBals.map((bl,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.border,fontSize:13}}><span style={{color:T.text2}}>{bl.desc}</span><span style={{color:T.amber}}>{peso(bl.amt)}</span></div>)}
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 3px",fontSize:16,fontWeight:800,borderTop:"2px solid "+T.border,marginTop:8,color:T.green}}><span>Total due</span><span>{peso(invTotal)}</span></div>
                <div style={{textAlign:"center",marginTop:10,fontSize:12,fontWeight:600,color:T.amber}}>Due on or before {invDueLbl}</div>
              </div>
            )}
          </div>
        )}

        {tab===5&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Rooms</h2>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,color:T.text3}}>{tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").length} occupied · {tenants.filter(t=>t.status==="vacant").length} vacant</div>
                <div style={{fontSize:12,color:T.green,fontWeight:700}}>Occupancy: {tenants.filter(t=>t.status!=="moved_out").length?Math.round(tenants.filter(t=>t.status!=="vacant"&&t.status!=="moved_out").length/tenants.filter(t=>t.status!=="moved_out").length*100):0}%</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:10}}>
              {tenants.filter(t=>t.status!=="moved_out").map(t=>{
                const b=bills.find(x=>x.room===t.room&&x.month===curMon);
                const ip=b&&b.status==="paid";const ov=b&&b.status!=="paid"&&today()>due;
                return(
                  <div key={t.room} style={{background:ip?T.green+"08":T.card,border:"1px solid "+(ip?T.gbr:T.border),borderRadius:10,padding:12,cursor:"pointer"}} onClick={()=>setProfile(t)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:24,fontWeight:800,color:T.green}}>Rm {t.room}</div>
                      <span style={BDG(t.type==="new"?T.bbg:T.bg4,t.type==="new"?T.blue:T.text2)}>{t.type||"old"}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,marginTop:4}}>{t.status!=="vacant"?t.name:"Vacant"}</div>
                    {b?<div style={{marginTop:7}}><span style={BDG(ip?T.green:b.status==="balance"?T.abg:T.rbg,ip?"#071a0e":b.status==="balance"?T.amber:T.red)}>{b.status}</span> <span style={{fontSize:13,fontWeight:700,color:ip?T.green:T.text}}>{peso(b.total)}</span></div>:<div style={{fontSize:12,color:T.text3,marginTop:7}}>No bill this month</div>}
                    {ov&&<div style={{fontSize:12,fontWeight:700,color:T.red,marginTop:3}}>OVERDUE</div>}
                    <div style={{fontSize:11,color:T.text3,marginTop:5}}>Tap to view profile</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab===6&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Finance</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <select value={finMonth} onChange={e=>setFinMonth(e.target.value)} style={{...IS,width:140}}>
                  {[...new Set([curMon,...bills.map(b=>b.month)])].sort((a,z)=>z.localeCompare(a)).map(m=><option key={m} value={m}>{fmt(m)}</option>)}
                </select>
                <button style={BSM(T.amber,"#1c0f00")} onClick={()=>exportCSV([["BOARDING HOUSE Financial Report"],["Year: "+selYear],[],["Month","Rent","Electric","Water","Wifi","Gross","Expenses","Net"],...yearMonths.map(ym=>{const mb=bills.filter(b=>b.month===ym);const r=mb.reduce((a,b)=>a+b.rent,0),e=mb.reduce((a,b)=>a+b.elec,0),w=mb.reduce((a,b)=>a+b.water,0),wf=mb.reduce((a,b)=>a+b.wifi,0),g=mb.reduce((a,b)=>a+b.total,0),ex=expenses.filter(x=>x.date&&x.date.slice(0,7)===ym).reduce((a,x)=>a+x.amt,0);return[fmt(ym),r,e,w,wf,g,ex,g-ex];})],"Finance_"+selYear+".csv")}>Export CSV</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              {[[T.green,"Gross income",peso(finGross)],[T.blue,"Net income",peso(finGross-finExp)],[T.red,"Total expenses",peso(finExp)],[T.amber,"Room rent profit",peso(finBills.reduce((a,b)=>a+b.rent,0))]].map(([c,l,v])=>(
                <div key={l} style={ST(c)}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,marginTop:3}}>{v}</div></div>
              ))}
            </div>
            <div style={{background:T.bg3,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:T.text2}}>Collection rate this month</span>
              <span style={{fontWeight:800,color:finGross>0&&finBills.filter(b=>b.status==="paid").reduce((a,b)=>a+b.total,0)/finGross>=.8?T.green:finGross>0&&finBills.filter(b=>b.status==="paid").reduce((a,b)=>a+b.total,0)/finGross>=.5?T.amber:T.red}}>{finGross>0?Math.round(finBills.filter(b=>b.status==="paid").reduce((a,b)=>a+b.total,0)/finGross*100):0}%</span>
            </div>
            <div style={SL}>YEARLY SUMMARY {selYear}</div>
            <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:10,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:T.bg3,fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3,gap:4}}>
                {["Month","Rent","Elec","Water","Wifi","Gross","Exp","Net"].map(h=><span key={h} style={{flex:1,textAlign:h==="Month"?"left":"right"}}>{h}</span>)}
              </div>
              {yearMonths.map(ym=>{
                const mb=bills.filter(b=>b.month===ym);
                const r=mb.reduce((a,b)=>a+b.rent,0),e=mb.reduce((a,b)=>a+b.elec,0),w=mb.reduce((a,b)=>a+b.water,0),wf=mb.reduce((a,b)=>a+b.wifi,0),g=mb.reduce((a,b)=>a+b.total,0);
                const ex=expenses.filter(x=>x.date&&x.date.slice(0,7)===ym).reduce((a,x)=>a+x.amt,0);
                const nt=g-ex;const has=mb.length>0;
                return(
                  <div key={ym} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderBottom:"1px solid "+T.border,fontSize:12,background:ym===finMonth?T.green+"10":"transparent",gap:4}}>
                    <span style={{flex:1,fontWeight:600,color:T.text2}}>{MS[parseInt(ym.split("-")[1])-1]}</span>
                    {[r,e,w,wf,g].map((v,i)=><span key={i} style={{flex:1,textAlign:"right",color:has?T.text:T.border2}}>{has?peso(v):"—"}</span>)}
                    <span style={{flex:1,textAlign:"right",color:ex>0?T.red:T.border2}}>{ex>0?peso(ex):"—"}</span>
                    <span style={{flex:1,textAlign:"right",color:has?nt>=0?T.green:T.red:T.border2}}>{has?peso(nt):"—"}</span>
                  </div>
                );
              })}
            </div>
            <div style={{height:1,background:T.border,margin:"14px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={SL}>EXPENSES</div>
              <button style={BT(T.red,"#fff")} onClick={()=>setExpOpen(true)}>+ Add expense</button>
            </div>
            {expenses.length===0&&<div style={{color:T.text3,fontSize:13}}>No expenses yet.</div>}
            {[...expenses].sort((a,z)=>(z.date||"").localeCompare(a.date||"")).map((e,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+T.border}}>
                <div><div style={{fontWeight:600}}>{e.desc}</div><div style={{fontSize:12,color:T.text3,marginTop:1}}>{e.date} · {e.cat}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontWeight:800,color:T.red}}>{peso(e.amt)}</span><button style={BSM(T.rbg,T.red)} onClick={()=>setE(expenses.filter((_,j)=>j!==i))}>Del</button></div>
              </div>
            ))}
            <div style={{height:1,background:T.border,margin:"14px 0"}}/>
            <div style={SL}>DEPOSIT TRACKER</div>
            {tenants.filter(t=>t.deposit>0).length===0&&<div style={{color:T.text3,fontSize:13}}>No deposits.</div>}
            {tenants.filter(t=>t.deposit>0).map(t=>(
              <div key={t.room} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+T.border}}>
                <div><div style={{fontWeight:600}}>Room {t.room} - {t.name}</div><div style={{fontSize:12,color:T.text3}}>{peso(t.deposit)} deposit</div></div>
                <span style={BDG(t.depStatus==="held"?T.gbg:t.depStatus==="used"?T.rbg:T.abg,t.depStatus==="held"?T.green:t.depStatus==="used"?T.red:T.amber)}>{t.depStatus||"held"}</span>
              </div>
            ))}
          </div>
        )}

        {tab===7&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>History</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <select value={histRoom} onChange={e=>setHistRoom(e.target.value)} style={{...IS,width:155}}><option value="">All rooms</option>{tenants.map(t=><option key={t.room} value={t.room}>Room {t.room} - {t.name}</option>)}</select>
                <select value={histYear} onChange={e=>setHistYear(e.target.value)} style={{...IS,width:90}}>{allYears.map(y=><option key={y} value={y}>{y}</option>)}</select>
                <button style={BSM(T.amber,"#1c0f00")} onClick={()=>exportCSV([["BOARDING HOUSE Payment History"],["Year: "+histYear+(histRoom?" Room "+histRoom:"")],[],["Month","Room","Name","Due","Paid","Rent","Elec","Water","Wifi","Balance","Total","Status","Method"],...histFiltered.map(b=>{const[y2,m2]=b.month.split("-").map(Number);return[fmt(b.month),b.room,b.name,lastDay(y2,m2-1),b.datePaid||"",b.rent,b.elec,b.water,b.wifi,b.balTotal||0,b.total,b.status,b.method||""];})],"History_"+histYear+(histRoom?"_Rm"+histRoom:"")+".csv")}>Export CSV</button>
              </div>
            </div>
            {Object.keys(histByRoom).length===0&&<div style={{color:T.text3,padding:30,textAlign:"center"}}>No records found.</div>}
            {Object.entries(histByRoom).sort((a,z)=>a[0]-z[0]).map(([room,rb])=>{
              const t=tenants.find(x=>x.room==room);const tot=rb.reduce((a,b)=>a+b.total,0);const r=rel(rb);
              return(
                <div key={room} style={{background:T.card,border:"1px solid "+T.border,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <span style={{fontSize:16,fontWeight:800,color:T.green}}>Room {room}</span>
                      <span style={{fontSize:13,fontWeight:600,marginLeft:4}}> - {t?t.name:"Ex-tenant"}</span>
                      <div style={{fontSize:12,color:r.color,marginTop:3,fontWeight:600}}>{r.label} ({r.score}%)</div>
                    </div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800,color:T.green}}>{peso(tot)}</div><div style={{fontSize:11,color:T.text3}}>{rb.length} months</div></div>
                  </div>
                  {rb.map(b=>{const ip=b.status==="paid";return(
                    <div key={b.month} style={{display:"flex",gap:9,padding:"9px 0",borderTop:"1px solid "+T.border}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:ip?T.green:b.status==="balance"?T.amber:T.red,marginTop:5,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontWeight:700,fontSize:13}}>{fmt(b.month)}</span>
                          <span style={{fontWeight:800,color:ip?T.green:T.text}}>{peso(b.total)}</span>
                        </div>
                        <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={BDG(ip?T.green:b.status==="balance"?T.abg:T.rbg,ip?"#071a0e":b.status==="balance"?T.amber:T.red)}>{b.status}</span>
                          {b.datePaid&&<span style={{fontSize:11,color:T.text3}}>Paid {b.datePaid}</span>}
                          {b.method&&<span style={BDG(T.bg4,T.text2)}>{b.method}</span>}
                        </div>
                        <div style={{fontSize:11,color:T.text3,marginTop:2}}>Rent {peso(b.rent)} + Elec {peso(b.elec)} + Water {peso(b.water)} + Wifi {peso(b.wifi)}{b.balTotal?" + Bal "+peso(b.balTotal):""}</div>
                      </div>
                    </div>
                  );})}
                </div>
              );
            })}
          </div>
        )}

        {tab===8&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>SOCOTECO Tracker</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button style={BT(T.green,"#071a0e")} onClick={()=>{setSocoEdit(null);setSocoEditIdx(-1);setSocoOpen(true);}}>+ Add record</button>
                <button style={BSM(T.amber,"#1c0f00")} onClick={()=>exportCSV([["BOARDING HOUSE SOCOTECO Records"],[],["Month","KWH Used","SOCOTECO Rate","SOCOTECO Bill","My Rate","Boarder Elec","Tapal","Overall Bayad","Notes"],...[...soco].sort((a,z)=>a.month.localeCompare(z.month)).map(s=>[fmt(s.month),s.kwhUsed,s.socoRate,s.socoBill,s.myRate,s.totalBoarderElec,s.tapal,(parseFloat(s.totalBoarderElec)||0)+(parseFloat(s.tapal)||0),s.notes||""])],"SOCOTECO_Records.csv")}>Export CSV</button>
              </div>
            </div>
            {soco.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
                {[[T.blue,"Total SOCOTECO paid",soco.reduce((a,x)=>a+(parseFloat(x.socoBill)||0),0)],[T.green,"Total boarder electric",soco.reduce((a,x)=>a+(parseFloat(x.totalBoarderElec)||0),0)],[T.amber,"Total tapal",soco.reduce((a,x)=>a+(parseFloat(x.tapal)||0),0)],[T.green,"Total overall bayad",soco.reduce((a,x)=>a+(parseFloat(x.totalBoarderElec)||0)+(parseFloat(x.tapal)||0),0)]].map(([c,l,v])=>(
                  <div key={l} style={ST(c)}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c,marginTop:3}}>{peso(v)}</div></div>
                ))}
              </div>
            )}
            <div style={{border:"1px solid "+T.border,borderRadius:10,overflow:"hidden",overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead><tr>{["Month","KWH Used","SOCOTECO Rate","SOCOTECO Bill","My Rate","Boarder Elec","Tapal","Overall Bayad","Notes",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {soco.length===0&&<tr><td colSpan={10} style={{...TD,padding:30,textAlign:"center",color:T.text3}}>No records yet. Click Add record to start.</td></tr>}
                {[...soco].sort((a,z)=>z.month.localeCompare(a.month)).map((rec,i)=>{
                  const ob=(parseFloat(rec.totalBoarderElec)||0)+(parseFloat(rec.tapal)||0);
                  return(
                    <tr key={i} style={{background:i%2===0?"transparent":T.bg3+"40"}}>
                      <td style={{...TD,fontWeight:700,color:T.green}}>{fmt(rec.month)}</td>
                      <td style={{...TD,color:T.blue,fontWeight:600}}>{rec.kwhUsed} kwh</td>
                      <td style={TD}>{rec.socoRate}</td>
                      <td style={{...TD,color:T.red,fontWeight:600}}>{peso(rec.socoBill)}</td>
                      <td style={{...TD,color:T.amber,fontWeight:700}}>{rec.myRate}</td>
                      <td style={{...TD,color:T.green,fontWeight:700}}>{peso(rec.totalBoarderElec)}</td>
                      <td style={{...TD,color:T.amber}}>{peso(rec.tapal)}</td>
                      <td style={{...TD,fontWeight:800,color:"#f9ff00",background:T.bg3}}>{peso(ob)}</td>
                      <td style={{...TD,fontSize:11,color:T.text3}}>{rec.notes||"—"}</td>
                      <td style={TD}>
                        <div style={{display:"flex",gap:4}}>
                          <button style={BSM(T.bg3,T.text)} onClick={()=>{setSocoEdit({...rec});setSocoEditIdx(i);setSocoOpen(true);}}>Edit</button>
                          <button style={BSM(T.rbg,T.red)} onClick={()=>{if(!confirm("Delete?"))return;setSc(soco.filter((_,j)=>j!==i));}}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}

      </div>

      {profile&&(()=>{
        const t=profile;
        const rb=bills.filter(b=>b.room===t.room).sort((a,z)=>z.month.localeCompare(a.month));
        const r=rel(rb);
        const totalPaid=rb.filter(b=>b.status==="paid").reduce((a,b)=>a+b.total,0);
        const mo=t.moveIn?Math.max(1,Math.ceil(diffDays(t.moveIn,today())/30)):0;
        const avg=rb.length?rb.reduce((a,b)=>a+b.total,0)/rb.length:0;
        const k=kwh["r"+t.room]||{};
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,overflowY:"auto",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setProfile(null);}}>
            <div style={{background:dark?DK.modal:LT.modal,border:"1px solid "+T.border2,borderRadius:14,padding:18,width:"100%",maxWidth:600,margin:"20px auto"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>Room {t.room} - {t.name}</span>
                <button onClick={()=>setProfile(null)} style={{background:T.bg3,border:"1px solid "+T.border,color:T.text2,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:18}}>x</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {[[T.green,"Total paid",peso(totalPaid)],[T.blue,"Avg monthly",peso(avg)],[T.amber,"Months",mo]].map(([c,l,v])=>(
                  <div key={l} style={{background:T.bg3,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.text3}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:c,marginTop:3}}>{v}</div></div>
                ))}
              </div>
              <div style={{background:T.bg3,borderRadius:8,padding:10,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:12,fontWeight:700,color:r.color}}>{r.label}</div><div style={{fontSize:11,color:T.text3,marginTop:2}}>{r.score}% payment rate</div></div>
                <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid "+r.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:r.color}}>{r.score}%</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[["Phone",t.phone||"—"],["Type",t.type||"—"],["Move-in",t.moveIn||"—"],["Contract",t.contractEnd||"—"],["Deposit",peso(t.deposit)+" ("+t.depStatus+")"],["KWH",(k.prev||0)+" to "+(k.curr||0)]].map(([l,v])=>(
                  <div key={l} style={{fontSize:12,color:T.text2}}><strong>{l}:</strong> {v}</div>
                ))}
              </div>
              {t.notes&&<div style={{background:T.abg,border:"1px solid "+T.abr,borderRadius:8,padding:"8px 10px",fontSize:12,color:T.amber,marginBottom:12}}>Note: {t.notes}</div>}
              <div style={{height:1,background:T.border,margin:"12px 0"}}/>
              <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Payment history ({rb.length} records)</div>
              <div style={{maxHeight:280,overflowY:"auto"}}>
                {rb.length===0&&<div style={{color:T.text3,fontSize:13}}>No billing records yet.</div>}
                {rb.map(b=>{const ip=b.status==="paid";return(
                  <div key={b.month} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid "+T.border}}>
                    <div style={{display:"flex",gap:8}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:ip?T.green:b.status==="balance"?T.amber:T.red,marginTop:4,flexShrink:0}}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{fmt(b.month)}</div>
                        <div style={{fontSize:11,color:T.text3}}>Rent {peso(b.rent)} + Elec {peso(b.elec)} + Water {peso(b.water)} + Wifi {peso(b.wifi)}{b.balTotal?" + Bal "+peso(b.balTotal):""}</div>
                        <div style={{display:"flex",gap:5,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={BDG(ip?T.green:b.status==="balance"?T.abg:T.rbg,ip?"#071a0e":b.status==="balance"?T.amber:T.red)}>{b.status}</span>
                          {b.datePaid&&<span style={{fontSize:11,color:T.text3}}>Paid {b.datePaid}</span>}
                          {b.method&&<span style={BDG(T.bg4,T.text2)}>{b.method}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{fontWeight:800,fontSize:13,color:ip?T.green:T.text}}>{peso(b.total)}</div>
                  </div>
                );})}
              </div>
              <div style={{display:"flex",gap:6,marginTop:14,justifyContent:"flex-end"}}>
                <button style={BSM(T.bg3,T.text)} onClick={()=>{setProfile(null);setTenantEdit({idx:tenants.findIndex(x=>x.room===t.room),tenant:t,mic:micData["m"+t.room]||{}});setTenantOpen(true);}}>Edit tenant</button>
                <button style={BT(T.green,"#071a0e")} onClick={()=>setProfile(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {readmeOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,overflowY:"auto",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setReadmeOpen(false);}}>
          <div style={{background:T.modal,border:"1px solid "+T.border2,borderRadius:14,padding:18,width:"100%",maxWidth:600,margin:"20px auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700,color:T.text}}>How to use this app</span>
              <button onClick={()=>setReadmeOpen(false)} style={{background:T.bg3,border:"1px solid "+T.border,color:T.text2,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:18}}>x</button>
            </div>
            <div style={{fontSize:13,color:T.text2,lineHeight:1.7,maxHeight:400,overflowY:"auto"}}>
              {[["Dashboard","See all paid and unpaid tenants. Transfer checklist tracks which payments you have moved to your bank. Overdue alerts show automatically."],["Tenants","Add boarders with their rates and move-in date. Click Profile to see full payment history and reliability score."],["Billing","Auto-generate creates all bills in one click. Past months always accessible via month tabs."],["KWH","Enter previous and current readings. Apply button pushes electric to their bill and auto-sets next month previous."],["Invoice","Generate invoice per room. Copy SMS sends bill to paste in WhatsApp. Print all prints every room at once."],["Finance","Monthly and yearly income breakdown. Export CSV for bank records."],["History","Full record of all payments. Filter by room or year. Export CSV anytime."],["SOCOTECO","Track your monthly SOCOTECO bill separately. Overall Bayad auto-calculates."],["Backup","IMPORTANT: Download backup regularly from the Backup button. Restore anytime. Always backup before clearing browser!"]].map(([title,desc])=>(
                <div key={title} style={{marginBottom:12}}><div style={{fontWeight:700,color:T.text,marginBottom:3}}>{title}</div><div>{desc}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {backupOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,overflowY:"auto",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setBackupOpen(false);}}>
          <div style={{background:T.modal,border:"1px solid "+T.border2,borderRadius:14,padding:18,width:"100%",maxWidth:500,margin:"20px auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700,color:T.text}}>Backup and Restore</span>
              <button onClick={()=>setBackupOpen(false)} style={{background:T.bg3,border:"1px solid "+T.border,color:T.text2,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:18}}>x</button>
            </div>
            <div style={{fontWeight:700,marginBottom:6,color:T.text}}>Export backup</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:10}}>Downloads all your data as a JSON file. Keep this safe!</div>
            <button style={BT(T.green,"#071a0e")} onClick={backupData}>Download backup</button>
            <div style={{height:1,background:T.border,margin:"14px 0"}}/>
            <div style={{fontWeight:700,marginBottom:6,color:T.text}}>Restore from backup</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:10}}>WARNING: This will replace ALL current data.</div>
            <input type="file" accept=".json" onChange={restoreData} style={{color:T.text,fontSize:13}}/>
            <div style={{height:1,background:T.border,margin:"14px 0"}}/>
            <div style={{fontWeight:700,marginBottom:8,color:T.text}}>Export all records CSV</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button style={BSM(T.bg3,T.text)} onClick={()=>exportCSV([["BOARDING HOUSE All Records"],[],["Month","Room","Name","Due","Paid","Rent","Elec","Water","Wifi","Balance","Total","Status","Method"],...[...bills].sort((a,z)=>a.month.localeCompare(z.month)||a.room-z.room).map(b=>{const[y2,m2]=b.month.split("-").map(Number);return[fmt(b.month),b.room,b.name,lastDay(y2,m2-1),b.datePaid||"",b.rent,b.elec,b.water,b.wifi,b.balTotal||0,b.total,b.status,b.method||""];})],"AllRecords_"+today()+".csv")}>All billing CSV</button>
              <button style={BSM(T.bg3,T.text)} onClick={()=>exportCSV([["BOARDING HOUSE All Expenses"],[],["Date","Description","Category","Amount"],...[...expenses].sort((a,z)=>(a.date||"").localeCompare(z.date||"")).map(e=>[e.date,e.desc,e.cat,e.amt])],"AllExpenses_"+today()+".csv")}>All expenses CSV</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
