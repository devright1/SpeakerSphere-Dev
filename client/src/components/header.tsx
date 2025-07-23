import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Lock, User, LogOut } from "lucide-react";
import { useAuthState } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuthState();

  // Navigation handlers for deployment compatibility
  const navigateToAuth = () => {
    try {
      setLocation('/auth');
    } catch (error) {
      // Fallback for deployment environments
      window.location.href = '/auth';
    }
  };

  const navigateToAdmin = () => {
    try {
      setLocation('/admin-login');
    } catch (error) {
      // Fallback for deployment environments
      window.location.href = '/admin-login';
    }
  };

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
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-primary flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user?.firstName} {user?.lastName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span className="mr-2">❤️</span>
                    Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span className="mr-2">⭐</span>
                    My Reviews
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-700 hover:text-primary deployment-safe-button"
                  onClick={navigateToAuth}
                  data-auth-button="signin"
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-primary hover:bg-blue-700 text-white deployment-safe-button"
                  onClick={navigateToAuth}
                  data-auth-button="getstarted"
                >
                  Get Started
                </Button>
              </>
            )}
            {/* Admin Lock Icon - Always visible with forced display */}
            <div className="ml-4 admin-icon-force-visible">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 border-2 border-gray-300 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md group admin-icon-force-visible deployment-safe-button"
                onClick={navigateToAdmin}
                title="Admin Access"
                data-admin-button="true"
              >
                <Lock className="h-5 w-5 text-gray-700 group-hover:text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Admin Lock Icon - Mobile with forced display */}
            <div className="admin-icon-force-visible">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 border-2 border-gray-300 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md group admin-icon-force-visible deployment-safe-button"
                onClick={navigateToAdmin}
                title="Admin Access"
                data-admin-button="true"
              >
                <Lock className="h-4 w-4 text-gray-700 group-hover:text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              </Button>
            </div>
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
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 deployment-safe-button admin-icon-force-visible"
                      onClick={navigateToAdmin}
                      data-admin-button="mobile-menu"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Admin Access
                    </Button>
                    {/* Backup admin access link */}
                    <div className="text-xs text-gray-500 px-4">
                      <span 
                        onClick={navigateToAdmin}
                        className="underline cursor-pointer hover:text-primary deployment-safe-button"
                        data-admin-fallback="true"
                      >
                        Admin Login
                      </span>
                    </div>
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2">
                          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-gray-700">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700">
                          <span className="mr-2">❤️</span>
                          Favorites
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-gray-700"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-gray-700 deployment-safe-button"
                          onClick={navigateToAuth}
                          data-auth-button="signin-mobile"
                        >
                          Sign In
                        </Button>
                        <Button 
                          className="w-full bg-primary hover:bg-blue-700 text-white deployment-safe-button"
                          onClick={navigateToAuth}
                          data-auth-button="getstarted-mobile"
                        >
                          Get Started
                        </Button>
                      </>
                    )}
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
