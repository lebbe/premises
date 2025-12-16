import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import StudyView from './routes/studyView/StudyView'
import { EditModeProvider } from './contexts/EditModeContext'
import './App.css'

function App() {
  return (
    <EditModeProvider>
      <Router basename="/premises">
        <div style={{ width: '100vw', height: '100vh' }}>
          <Routes>
            <Route path="/" element={<StudyView />} />
          </Routes>
        </div>
      </Router>
    </EditModeProvider>
  )
}

export default App
