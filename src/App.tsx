import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Interiors from './pages/Interiors'
import Contact from './pages/Contact'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/products', element: <Products /> },
      { path: '/products/:slug', element: <ProductDetail /> },
      { path: '/interiors', element: <Interiors /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy-policy', element: <Legal page="privacy" /> },
      { path: '/terms', element: <Legal page="terms" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
