
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from '@/app/app-router'
import '@/styles/globals.css'
import { ToastProvider } from "@/components/common/toast";

// Adicionando logs de depuração
console.log('Iniciando aplicação...');
console.log('Elemento root:', document.getElementById('root'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento root não encontrado!');
} else {
  console.log('Elemento root encontrado, renderizando aplicação...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
  
  console.log('Aplicação renderizada com sucesso!');
}

