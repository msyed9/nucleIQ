import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './design-system/global.css'
import './index.css'
import './styles/dark-mode-utilities.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
