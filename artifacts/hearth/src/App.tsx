import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import AuthPage from '@/pages/auth';
import AuthCallbackPage from '@/pages/auth-callback';
import HomePage from '@/pages/home';
import DashboardPage from '@/pages/dashboard';
import NotesPage from '@/pages/notes';
import NoteEditorPage from '@/pages/note-editor';
import BusinessPage from '@/pages/business';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/">
        <AuthenticatedLayout>
          <HomePage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/dashboard">
        <AuthenticatedLayout>
          <DashboardPage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/notes">
        <AuthenticatedLayout>
          <NotesPage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/notes/:id">
        <AuthenticatedLayout>
          <NoteEditorPage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/business">
        <AuthenticatedLayout>
          <BusinessPage />
        </AuthenticatedLayout>
      </Route>
      <Route>
        <div className="min-h-screen flex items-center justify-center font-serif text-2xl text-muted-foreground">
          404 | Not Found
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
