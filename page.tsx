"use client";
import {useState} from "react";

export default function Home(){
 const [idea,setIdea]=useState("");
 const [version,setVersion]=useState("1.21.31+");
 const [out,setOut]=useState("");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);

 async function build(){
  if(!idea.trim()){setStatus("Describe the add-on first.");return}
  setBusy(true);setStatus("AI team is planning, coding, checking and packaging...");
  try{
   const r=await fetch("/api/build-addon",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea,version})});
   const d=await r.json(); if(!r.ok) throw Error(d.error||"Build failed");
   setOut(d.preview); setStatus("Build plan generated. Download the starter add-on package below.");
   const a=document.createElement("a");a.href=d.download;a.download=d.filename;a.click();
  }catch(e:any){setStatus(e.message)}
  finally{setBusy(false)}
 }
 return <main>
  <div className="top"><div className="logo">⛏️ AI ADD-ON STUDIO</div><div className="tag">BEDROCK FACTORY v2</div></div>
  <section className="hero"><div className="ey">MULTI-AI PIPELINE</div><h1>Build better Bedrock<br/><span>add-ons automatically.</span></h1><p>Describe your idea. The app turns it into a structured Behavior Pack + Resource Pack starter, with manifests, scripts, documentation and QA guidance.</p></section>
  <div className="agents">
   {[
    ["🧠","Planner AI","Features, progression and architecture"],
    ["🧱","Bedrock AI","Manifests, packs, scripts and content"],
    ["🎨","Asset AI","Textures, models, animations and UI paths"],
    ["🛡️","QA AI","UUID, JSON, API and performance checks"]
   ].map(x=><div className="agent" key={x[1]}><b>{x[0]} {x[1]}</b><small>{x[2]}</small></div>)}
  </div>
  <div className="grid">
   <div className="card">
    <label>Add-on idea</label><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Example: Create a Dark Souls-style RPG with skill points, bosses, stamina, dodge, weapons, NPC quests and mobile-friendly UI."/>
    <div className="row"><div><label>Target version</label><select value={version} onChange={e=>setVersion(e.target.value)}><option>1.21.31+</option><option>1.26.x+</option><option>Latest stable</option></select></div><div><label>Pipeline</label><select><option>4 AI agents + QA</option><option>Fast prototype</option></select></div></div>
    <button onClick={build} disabled={busy}>{busy?"⚙️ BUILDING…":"⚡ GENERATE ADD-ON PACKAGE"}</button>
    <p className="status">{status}</p>
   </div>
   <div className="card"><label>Build console</label><div className="console">{out||"Waiting for your idea…\n\nThe generated package contains:\n• behavior pack\n• resource pack\n• Script API starter\n• manifests\n• README\n• QA checklist"}</div></div>
  </div>
  <footer>API keys belong in server environment variables. Generated content should be tested in a backup world before use.</footer>
 </main>
}