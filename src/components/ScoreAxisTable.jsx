import { useEffect, useRef } from "react";

export default function ScoreAxisTable() {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://widgets.scoreaxis.com/api/football/league-table/6232265abf1fa71a672159ec?lang=en&teamLogo=1&tableLines=0&homeAway=1&header=1&position=1&goals=1&gamesCount=1&diff=1&winCount=1&drawCount=1&loseCount=1&lastGames=1&points=1&teamsLimit=all&links=1&font=heebo&fontSize=14&widgetWidth=auto&widgetHeight=auto&bodyColor=%23ffffff&textColor=%23141416&linkColor=%23141416&borderColor=%23ecf1f7&tabColor=%23f3f8fd";
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div class="scoreaxis-widget" style="overflow:auto;"></div>`;
      containerRef.current.appendChild(script);
    }
  }, []);

  return <div ref={containerRef}></div>;
}