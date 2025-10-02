import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '../components/RequireAuth'
import { GenericError } from '../pages/errors/GenericError'

// Import components directly to avoid lazy loading issues
import { Login } from '../pages/auth/LoginSimple'
import Dashboard from '../pages/Dashboard'
import ClientsList from '../pages/clients/ClientsList'
import NewClient from '../pages/clients/NewClient'
import ClientDetails from '../pages/clients/ClientDetails'
import ClientEdit from '../pages/clients/ClientEdit'
import PumpsList from '../pages/pumps/PumpsList'
import NewPump from '../pages/pumps/NewPump'
import PumpDetails from '../pages/pumps/PumpDetails'
import PumpEdit from '../pages/pumps/PumpEdit'
import ReportsList from '../pages/reports/ReportsList'
import NewReport from '../pages/reports/NewReport'
import ReportDetails from '../pages/reports/ReportDetails'
import EditReport from '../pages/reports/EditReport'
import { NotesListSimple as NotesList } from '../pages/notes/NotesListSimple'
import { NewNote } from '../pages/notes/NewNote'
import { NotesPendingReports } from '../pages/notes/NotesPendingReports'
import { NoteDetails } from '../pages/notes/NoteDetails'
import Colaboradores from '../pages/colaboradores/Colaboradores'
import NewColaborador from '../pages/colaboradores/NewColaborador'
import ColaboradorDetails from '../pages/colaboradores/ColaboradorDetails'
import EditColaborador from '../pages/colaboradores/EditColaborador'
import EmpresasList from '../pages/bombas-terceiras/EmpresasList'
import EmpresaForm from '../pages/bombas-terceiras/EmpresaForm'
import EmpresaDetails from '../pages/bombas-terceiras/EmpresaDetails'
import BombasList from '../pages/bombas-terceiras/BombasList'
import BombaForm from '../pages/bombas-terceiras/BombaForm'
import BombaDetails from '../pages/bombas-terceiras/BombaDetails'
import PagamentosList from '../pages/pagamentos-receber/PagamentosList'
import PagamentoDetails from '../pages/pagamentos-receber/PagamentoDetails'
import PagamentoEdit from '../pages/pagamentos-receber/PagamentoEdit'
import { NovaProgramacao } from '../pages/programacao'
// import ProgramacaoBoardFixed from '../pages/programacao/ProgramacaoBoardFixed'
// import ProgramacaoWeeklyBoard from '../pages/programacao/ProgramacaoWeeklyBoard'
import ProgramacaoGridBoardMobile from '../pages/programacao/ProgramacaoGridBoardMobile'
import { ProgramacaoGridBoard } from '../pages/programacao/ProgramacaoGridBoard'
import TestConnection from '../pages/programacao/TestConnection'
import TestAPI from '../pages/programacao/TestAPI'
// import Test from '../pages/Test'

// Import do módulo financeiro
import { FinancialModule } from '../pages/financial'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <GenericError />
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/clients',
    element: (
      <RequireAuth>
        <ClientsList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/clients/new',
    element: (
      <RequireAuth>
        <NewClient />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/clients/:id',
    element: (
      <RequireAuth>
        <ClientDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/clients/:id/edit',
    element: (
      <RequireAuth>
        <ClientEdit />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pumps',
    element: (
      <RequireAuth>
        <PumpsList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pumps/new',
    element: (
      <RequireAuth>
        <NewPump />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pumps/:id',
    element: (
      <RequireAuth>
        <PumpDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pumps/:id/edit',
    element: (
      <RequireAuth>
        <PumpEdit />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/reports',
    element: (
      <RequireAuth>
        <ReportsList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/reports/new',
    element: (
      <RequireAuth>
        <NewReport />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/reports/:id',
    element: (
      <RequireAuth>
        <ReportDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/reports/:id/edit',
    element: (
      <RequireAuth>
        <EditReport />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/notes',
    element: (
      <RequireAuth>
        <NotesList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/notes/new',
    element: (
      <RequireAuth>
        <NewNote />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/notes/pending',
    element: (
      <RequireAuth>
        <NotesPendingReports />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/notes/:id',
    element: (
      <RequireAuth>
        <NoteDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/colaboradores',
    element: (
      <RequireAuth>
        <Colaboradores />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/colaboradores/new',
    element: (
      <RequireAuth>
        <NewColaborador />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/colaboradores/:id',
    element: (
      <RequireAuth>
        <ColaboradorDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/colaboradores/:id/edit',
    element: (
      <RequireAuth>
        <EditColaborador />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  // Rotas do módulo Bombas Terceiras
  {
    path: '/bombas-terceiras/empresas',
    element: (
      <RequireAuth>
        <EmpresasList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/empresas/nova',
    element: (
      <RequireAuth>
        <EmpresaForm />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/empresas/:id',
    element: (
      <RequireAuth>
        <EmpresaDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/empresas/:id/editar',
    element: (
      <RequireAuth>
        <EmpresaForm />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/empresas/:empresaId/bombas/nova',
    element: (
      <RequireAuth>
        <BombaForm />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/bombas',
    element: (
      <RequireAuth>
        <BombasList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/bombas/nova',
    element: (
      <RequireAuth>
        <BombaForm />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/bombas/:id',
    element: (
      <RequireAuth>
        <BombaDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/bombas-terceiras/bombas/:id/editar',
    element: (
      <RequireAuth>
        <BombaForm />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  // Rotas do módulo Pagamentos a Receber
  {
    path: '/pagamentos-receber',
    element: (
      <RequireAuth>
        <PagamentosList />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pagamentos-receber/:id',
    element: (
      <RequireAuth>
        <PagamentoDetails />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/pagamentos-receber/:id/edit',
    element: (
      <RequireAuth>
        <PagamentoEdit />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  // Rotas do módulo Programação
  {
    path: '/programacao',
    element: (
      <RequireAuth>
        <ProgramacaoGridBoard />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/board',
    element: (
      <RequireAuth>
        <ProgramacaoGridBoard />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/grid',
    element: (
      <RequireAuth>
        <ProgramacaoGridBoard />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/nova',
    element: (
      <RequireAuth>
        <NovaProgramacao />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/:id',
    element: (
      <RequireAuth>
        <NovaProgramacao />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/test',
    element: (
      <RequireAuth>
        <TestConnection />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  {
    path: '/programacao/test-api',
    element: (
      <RequireAuth>
        <TestAPI />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
  // Rotas do módulo financeiro
  {
    path: '/financial/*',
    element: (
      <RequireAuth>
        <FinancialModule />
      </RequireAuth>
    ),
    errorElement: <GenericError />
  },
])
