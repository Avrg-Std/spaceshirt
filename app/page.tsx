import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CategoryGrid from './components/CategoryGrid'
import HeroProducts from './components/HeroProducts'
import BrandStory from './components/BrandStory'
import NewestProducts from './components/NewestProducts'
import BrandValues from './components/BrandValues'
import CtaSection from './components/CtaSection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="relative w-full overflow-hidden bg-[var(--color-bg)] min-h-screen">
      <Navbar />
      <Hero />
      <CategoryGrid />
      <HeroProducts />
      <BrandStory />
      <div className="h-12 md:h-24"></div> {/* Reduced Spacing to let Story flow into Newest */}
      <NewestProducts />
      <BrandValues />
      <CtaSection />
      <Footer />
    </main>
  )
}
