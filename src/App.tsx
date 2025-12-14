import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConceptGraph from "./routes/conceptGraph/ConceptGraph";
import StudyView from "./routes/studyView/StudyView";
import "./App.css";

function App() {
  return (
    <Router basename="/premises">
      <div style={{ width: "100vw", height: "100vh" }}>
        <Routes>
          <Route path="/everything" element={<ConceptGraph />} />
          <Route path="/" element={<StudyView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
