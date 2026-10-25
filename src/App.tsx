import { useState } from 'react'
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Interiors from './pages/Interiors'
import InteriorDetail from './pages/InteriorDetail'
import Feedback from './pages/Feedback'
import Contact from './pages/Contact'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/products', element: <Products /> },
      { path: '/products/:slug', element: <ProductDetail /> },
      { path: '/interiors', element: <Interiors /> },
      { path: '/interiors/:slug', element: <InteriorDetail /> },
      { path: '/contact', element: <Contact /> },
      { path: '/feedback', element: <Feedback /> },
      { path: '/privacy-policy', element: <Legal page="privacy" /> },
      { path: '/terms', element: <Legal page="terms" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export default function App() {
  const [router] = useState(() => createBrowserRouter(routes))
  return <RouterProvider router={router} />
}
