// put this near the top of main.jsx or index.jsx (after importing axios)
import axios from "axios";
const token = localStorage.getItem("token");
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
