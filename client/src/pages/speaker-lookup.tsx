import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Search, User, CheckCircle, Mail, Globe, MapPin } from "lucide-react";
import Header from "@/components/header";

export default function SpeakerLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: speakers, isLoading, error } = useQuery({
    queryKey: ["/api/speakers/search", { q: searchQuery }],
    enabled: searchTriggered && searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      setSearchTriggered(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Find Your Speaker Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Search for your existing speaker profile to get your Speaker ID for account registration.
            You can search by name, practice location, or specialty.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Speaker Search
            </CardTitle>
            <CardDescription>
              Enter your name or practice information to find your speaker profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search speakers</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, practice, location, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={searchQuery.length < 2 || isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-sm text-gray-500 mt-2">
                Please enter at least 2 characters to search
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Error searching for speakers. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {searchTriggered && !isLoading && speakers && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Search Results ({Array.isArray(speakers) ? speakers.length : 0} found)
              </h2>
              {(!Array.isArray(speakers) || speakers.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No speakers found matching "{searchQuery}"
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p>Tips for better results:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Try searching with just your first or last name</li>
                      <li>Include your practice or hospital name</li>
                      <li>Search by your specialty or location</li>
                      <li>Check for alternate name spellings</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {Array.isArray(speakers) && speakers.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {speakers.map((speaker: any) => (
                  <Card key={speaker.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={speaker.imageUrl}
                          alt={speaker.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                              {speaker.name}
                            </h3>
                            {speaker.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {speaker.title && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{speaker.title}</span>
                              </div>
                            )}
                            {speaker.practice && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{speaker.practice}</span>
                              </div>
                            )}
                            {speaker.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{speaker.location}</span>
                              </div>
                            )}
                            {speaker.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{speaker.email}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  Your Speaker ID:
                                </p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {speaker.id}
                                </p>
                              </div>
                              <Link href="/signup">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Create Account
                                </Button>
                              </Link>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                              Use this ID to create your speaker account and manage your profile
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!searchTriggered && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ready to Find Your Profile?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Start typing in the search box above to find your existing speaker profile 
              and get your Speaker ID for account registration.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Don't see your profile?</strong> If you don't find your speaker profile, 
                it may not be in our database yet. Contact us to add your profile or 
                apply to become a speaker through our application process.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Need help or don't see your profile?
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/for-speakers">
              <Button variant="outline">Apply to Become a Speaker</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}