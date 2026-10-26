import Seo, { WebsiteJsonLd } from '../components/Seo'
import Hero from '../sections/Hero'
import AboutPreview from '../sections/AboutPreview'
import Clients from '../sections/Clients'
import ProductsRail from '../sections/ProductsRail'
import Stats from '../sections/Stats'
import WhyUs from '../sections/WhyUs'
import Testimonials from '../sections/Testimonials'
import Downloads from '../sections/Downloads'

export default function Home() {
  return (
    <>
      <Seo />
      <WebsiteJsonLd />
      <Hero />
      <AboutPreview />
      <Clients />
      <ProductsRail />
      <Stats />
      <WhyUs />
      <Testimonials />
      <Downloads />
    </>
  )
}
