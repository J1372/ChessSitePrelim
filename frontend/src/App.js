import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home, { homeLoader } from './pages/Home';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import User, { userLoader } from './pages/User';
import GamePage from './pages/Game';
import Dashboard, { dashboardLoader } from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from 'react-query';

export const queryClient = new QueryClient();

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      loader: dashboardLoader,
      element: <Dashboard/>,
      children: [
        {
          index: true,
          loader: homeLoader,
          element: <Home/>
        },
        {
          path: 'home',
          loader: homeLoader,
          element: <Home/>
        },
        {
          path: 'login',
          element: <Login/>
        },
        {
          path: 'create-account',
          element: <CreateAccount/>
        },
        {
          path: 'users/:user',
          loader: userLoader,
          element: <User/>
        },
        {
          path: 'games/:gameId',
          element: <GamePage/>
        },
      ]
    }
  ]);

  return (
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
    </QueryClientProvider>);
}

export default App;
