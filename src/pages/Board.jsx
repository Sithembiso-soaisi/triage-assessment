import { useEffect, useState } from "react";
import { getTickets } from "../lib/api";

function Board() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    getTickets().then((data) => {
      setTickets(data);
    });
  }, []);

  return (
    <div>
      <h1>Ticket Board</h1>

      <p>Total tickets: {tickets.length}</p>
    </div>
  );
}

export default Board;