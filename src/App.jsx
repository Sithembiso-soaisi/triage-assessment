import { Routes, Route, Navigate } from "react-router-dom";
import Board from "./pages/Board";
import TicketDetail from "./pages/TicketDetail";
import Analytics from "./pages/Analytics";
import Header from "./components/Header";
import './pages/Board.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/tickets" element={<Board />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* Redirect the home page to the ticket board */}
          <Route path="/" element={<Navigate to="/tickets" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;