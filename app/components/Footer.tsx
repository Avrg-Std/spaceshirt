import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-[#1a1a1a] text-white py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            
            {/* Logo */}
            <div className="flex-1 text-center md:text-left">
                <span className="font-bebas text-2xl tracking-widest text-gray-500">SPACE <span className="text-white">SHIRT</span></span>
            </div>

            {/* Links */}
            <div className="flex gap-8 md:gap-12 flex-1 justify-center">
                {['HOME', 'PRODUCT', 'CONTACT', 'HELP'].map((item) => (
                   <Link key={item} href="#" className="text-xs font-medium tracking-widest text-gray-400 hover:text-white transition-colors">
                       {item}
                   </Link>
                ))}
            </div>

            {/* Socials */}
            <div className="flex gap-6 flex-1 justify-center md:justify-end items-center">
                <span className="text-xs font-medium tracking-widest text-gray-500 mr-2">FOLLOW US</span>
                <Link href="#" className="bg-white rounded-full p-2 text-black hover:bg-[var(--color-accent)] transition-colors"><Facebook size={16} /></Link>
                <Link href="#" className="bg-white rounded-full p-2 text-black hover:bg-[var(--color-accent)] transition-colors"><Instagram size={16} /></Link>
                <Link href="#" className="bg-white rounded-full p-2 text-black hover:bg-[var(--color-accent)] transition-colors"><Twitter size={16} /></Link>
            </div>

        </div>
    </footer>
  )
}
