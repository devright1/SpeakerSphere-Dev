import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Topic {
  id: number;
  name: string;
  category: string | null;
}

interface TopicSelectorProps {
  selectedTopicIds: number[];
  onChange: (topicIds: number[]) => void;
  maxTopics?: number;
  error?: string;
}

export function TopicSelector({ 
  selectedTopicIds, 
  onChange, 
  maxTopics = 3,
  error 
}: TopicSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: groupedTopics, isLoading } = useQuery<Record<string, Topic[]>>({
    queryKey: ["/api/topics/grouped"],
  });

  const allTopics = groupedTopics 
    ? Object.values(groupedTopics).flat()
    : [];

  const categories = groupedTopics 
    ? ["all", ...Object.keys(groupedTopics).sort()]
    : ["all"];

  const filteredTopics = allTopics.filter(topic => {
    const matchesCategory = categoryFilter === "all" || topic.category === categoryFilter;
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedTopics = allTopics.filter(topic => selectedTopicIds.includes(topic.id));

  const handleToggleTopic = (topicId: number) => {
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter(id => id !== topicId));
    } else {
      if (selectedTopicIds.length < maxTopics) {
        onChange([...selectedTopicIds, topicId]);
      }
    }
  };

  const handleRemoveTopic = (topicId: number) => {
    onChange(selectedTopicIds.filter(id => id !== topicId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Speaking Topics * (Select {maxTopics})</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose {maxTopics} specific topics that best represent your speaking expertise
        </p>
      </div>

      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100 w-full mb-1">
            Selected Topics ({selectedTopics.length}/{maxTopics}):
          </span>
          {selectedTopics.map(topic => (
            <Badge 
              key={topic.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {topic.name}
              <button
                data-testid={`remove-topic-${topic.id}`}
                onClick={() => handleRemoveTopic(topic.id)}
                className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-sm">Filter by Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter" data-testid="select-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-topics" className="text-sm">Search Topics</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-topics"
              data-testid="input-search-topics"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
        {filteredTopics.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No topics found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTopics.map(topic => {
              const isSelected = selectedTopicIds.includes(topic.id);
              const isDisabled = !isSelected && selectedTopicIds.length >= maxTopics;

              return (
                <button
                  key={topic.id}
                  data-testid={`topic-option-${topic.id}`}
                  onClick={() => !isDisabled && handleToggleTopic(topic.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    "flex items-center justify-between gap-2",
                    isSelected && "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600",
                    !isSelected && !isDisabled && "hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600",
                    isDisabled && "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{topic.name}</div>
                    {topic.category && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {topic.category}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
