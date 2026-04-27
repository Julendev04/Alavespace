import React from "react";

export default function StatsBox({ topStats, activeStat, setActiveStat }) {

  const topScorers = [...topStats].sort((a,b)=>b.goals-a.goals).slice(0,4);
  const topAssists = [...topStats].sort((a,b)=>b.assists-a.assists).slice(0,4);
  const topMatches = [...topStats].sort((a,b)=>b.matches_played-a.matches_played).slice(0,4);

  const data =
    activeStat === "goals"
      ? topScorers
      : activeStat === "assists"
      ? topAssists
      : topMatches;

  return (
    <div className="stats-box">

      <h2>Estadísticas destacadas</h2>

      <div className="stats-toggle">
        <button onClick={()=>setActiveStat("goals")} className={activeStat==="goals"?"active":""}>Goles</button>
        <button onClick={()=>setActiveStat("assists")} className={activeStat==="assists"?"active":""}>Asistencias</button>
        <button onClick={()=>setActiveStat("matches")} className={activeStat==="matches"?"active":""}>Partidos</button>
      </div>

      <div className="stats-block">

        {data.map((p,i)=>(
          <div key={p.id} className="stat-row">
            <span className="rank">{i+1}</span>
            <img src={p.photo_url} />
            <span className="name">{p.name}</span>

            <div className="bar">
              <div className="fill"></div>
            </div>

            <span className="value">
              {activeStat==="goals"?p.goals:activeStat==="assists"?p.assists:p.matches_played}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
}