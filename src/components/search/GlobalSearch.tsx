"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Filter, Clock, TrendingUp, Loader2 } from "lucide-react";
import { logger } from '@/lib/logger';

interface GlobalSearchProps {
  placeholder?: string;
  onResultClick?: (result: any) => void;
}

interface SelectedFilters {
  technology?: string[];
  domain?: string[];
  difficulty?: string[];
  [key: string]: string[] | undefined;
}

export function GlobalSearch({ placeholder = "Search projects, research, resources...", onResultClick }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch suggestions when query changes
    if (query.length >= 2) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async (q: string) => {
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggestions", query: q, limit: 5 }),
      });
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      logger.error("Failed to fetch suggestions:", error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        mode: "hybrid",
        limit: "10",
      });

      // Add filters
      if (selectedFilters.technology) params.append("technology", selectedFilters.technology.join(","));
      if (selectedFilters.domain) params.append("domain", selectedFilters.domain.join(","));
      if (selectedFilters.difficulty) params.append("difficulty", selectedFilters.difficulty.join(","));

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        
        // Save to recent searches
        const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem("recentSearches", JSON.stringify(newRecent));
      }
    } catch (error) {
      logger.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    handleSearch();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const toggleFilter = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl">
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full rounded-full border border-border/70 bg-card/90 py-3 pl-12 pr-12 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/90"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full border border-border/70 bg-card/90 p-3 hover:bg-muted/50 dark:border-slate-800 dark:bg-slate-950/90 ${showFilters ? "border-primary" : ""}`}
          >
            <Filter size={20} className={showFilters ? "text-primary" : "text-muted"} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Search Filters</h3>
            <div className="space-y-4">
              <FilterSection
                title="Technology"
                options={["React", "Python", "Arduino", "TensorFlow", "Node.js", "TypeScript"]}
                selected={selectedFilters.technology || []}
                onToggle={(value) => toggleFilter("technology", value)}
              />
              <FilterSection
                title="Domain"
                options={["AI", "ML", "IoT", "Cybersecurity", "Robotics", "Cloud", "Web", "Mobile"]}
                selected={selectedFilters.domain || []}
                onToggle={(value) => toggleFilter("domain", value)}
              />
              <FilterSection
                title="Difficulty"
                options={["Beginner", "Intermediate", "Advanced", "Expert"]}
                selected={selectedFilters.difficulty || []}
                onToggle={(value) => toggleFilter("difficulty", value)}
              />
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[1.5rem] border border-border/70 bg-card/90 shadow-lg dark:border-slate-800 dark:bg-slate-950/90 z-50 max-h-[600px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="ml-3 text-muted">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Search Results</h3>
                <span className="text-xs text-muted">{results.length} results</span>
              </div>
              <div className="space-y-2">
                {results.map((result) => (
                  <SearchResult key={result.id} result={result} onClick={() => onResultClick?.(result)} />
                ))}
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4">
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
                    <TrendingUp size={14} />
                    Suggestions
                  </h3>
                  <div className="space-y-1">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-muted/50 dark:hover:bg-slate-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
                    <Clock size={14} />
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-muted/50 dark:hover:bg-slate-800"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted">
              Start typing to search for projects, research, and resources
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResult({ result, onClick }: { result: any; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-border/70 bg-muted/30 p-4 text-left hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{result.title}</h4>
          <p className="mt-1 text-sm text-muted line-clamp-2">{result.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.metadata.domain?.map((d: string) => (
              <span key={d} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-emerald-600">{(result.score * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted">match</div>
        </div>
      </div>
    </button>
  );
}

function FilterSection({ title, options, selected, onToggle }: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(option)
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted hover:bg-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
