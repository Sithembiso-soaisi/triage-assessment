import { Routes, Route, Navigate } from "react-router-dom";
import Board from "./pages/Board";
import TicketDetail from "./pages/TicketDetail";
import './pages/Board.css';

function App() {
  return (
    <Routes>
      <Route path="/tickets" element={<Board />} />
      <Route path="/tickets/:id" element={<TicketDetail />} />

      {/* Redirect the home page to the ticket board */}
      <Route path="/" element={<Navigate to="/tickets" replace />} />
    </Routes>
  );
}

export default App;