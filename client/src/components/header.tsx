import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Lock } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/speakers", label: "Find Speakers" },
    { href: "/categories", label: "Categories" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/for-speakers", label: "For Speakers" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">The Speaker Sphere</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-10 md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    location === item.href 
                      ? "text-primary" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/admin-login">
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-primary">
                <Lock className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" className="text-gray-700 hover:text-primary">
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-blue-700 text-white">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 text-lg font-medium transition-colors ${
                        location === item.href 
                          ? "text-primary bg-primary/10" 
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      } rounded-lg`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    <Link href="/admin-login" className="w-full">
                      <Button variant="ghost" className="w-full justify-start text-gray-700">
                        <Lock className="h-4 w-4 mr-2" />
                        Admin Access
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                      Sign In
                    </Button>
                    <Button className="w-full bg-primary hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
