import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, Calendar, MapPin, X, 
  TrendingUp, Clock, Globe, Target, Zap, 
  Activity, UserCheck, MessageSquare, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { Community, Category } from '../utils/supabaseClient';

const DiscoverPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    'popular' | 'newest' | 'closest' | 'mostActive' | 'trending' | 'recommended'
  >('popular');
  const [filters, setFilters] = useState({
    size: {
      small: false, // < 100 members
      medium: false, // 100-1000 members
      large: false, // > 1000 members
    },
    activity: {
      veryActive: false, // Multiple posts per day
      active: false, // Few posts per week
      casual: false, // Few posts per month
    },
    type: {
      public: true,
      private: false,
    },
    joinPolicy: {
      open: true,
      approval: false,
    },
    features: {
      events: false,
      discussions: false,
      mentorship: false,
      resources: false,
    },
    engagement: {
      newbie: false, // < 3 months old
      established: false, // 3-12 months old
      veteran: false, // > 12 months old
    }
  });

  useEffect(() => {
    fetchCategories();
    if (profile) {
      setCountry(profile.country || '');
      setCity(profile.city || '');
      if (profile.interests?.length > 0) {
        setSelectedCategories(profile.interests);
      }
    }
  }, [profile]);

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategories, country, city, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('communities')
        .select(`
          *,
          community_categories (
            categories (*)
          ),
          community_members!inner (
            profile_id
          )
        `);

      if (selectedCategories.length > 0) {
        query = query.in('community_categories.category_id', selectedCategories);
      }

      if (country) {
        query = query.ilike('country', `%${country}%`);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'closest':
          query = query.order('city');
          break;
        case 'popular':
        default:
          query = query.order('created_at', { ascending: false }); // Temporary fallback sort
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data to add member count
      const communitiesWithCounts = data?.map(community => ({
        ...community,
        community_members_count: community.community_members?.length || 0
      })) || [];

      // Sort by popularity if needed
      if (sortBy === 'popular') {
        communitiesWithCounts.sort((a, b) => b.community_members_count - a.community_members_count);
      }

      setCommunities(communitiesWithCounts);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setCountry('');
    setCity('');
    setSortBy('popular');
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter(cat => cat.parent_id === parentId);

  const renderFilterPanel = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-panel p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Filters</h3>
        <button
          className="text-text-secondary hover:text-accent-1"
          onClick={clearFilters}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h4 className="font-bold mb-3">Categories</h4>
          <div className="space-y-4">
            {mainCategories.map(mainCat => (
              <div key={mainCat.id}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedCategories.includes(mainCat.id)
                      ? 'bg-accent-1 text-primary'
                      : 'hover:bg-surface-blur'
                  }`}
                  onClick={() => toggleCategory(mainCat.id)}
                >
                  {mainCat.name}
                </button>
                <div className="ml-4 mt-2 flex flex-wrap gap-2">
                  {getSubcategories(mainCat.id).map(subCat => (
                    <button
                      key={subCat.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategories.includes(subCat.id)
                          ? 'bg-accent-1 text-primary'
                          : 'bg-surface-blur text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => toggleCategory(subCat.id)}
                    >
                      {subCat.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">Community Size</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.size.small}
                onChange={() => toggleFilter('size', 'small')}
                className="form-checkbox"
              />
              <span>Small (<100 members)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.size.medium}
                onChange={() => toggleFilter('size', 'medium')}
                className="form-checkbox"
              />
              <span>Medium (100-1000 members)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.size.large}
                onChange={() => toggleFilter('size', 'large')}
                className="form-checkbox"
              />
              <span>Large (>1000 members)</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">Activity Level</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.activity.veryActive}
                onChange={() => toggleFilter('activity', 'veryActive')}
                className="form-checkbox"
              />
              <span>Very Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.activity.active}
                onChange={() => toggleFilter('activity', 'active')}
                className="form-checkbox"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.activity.casual}
                onChange={() => toggleFilter('activity', 'casual')}
                className="form-checkbox"
              />
              <span>Casual</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">Location</h4>
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Country"
                className="input-neon w-full pl-10"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="City"
                className="input-neon w-full pl-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">Features</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.features.events}
                onChange={() => toggleFilter('features', 'events')}
                className="form-checkbox"
              />
              <span>Events</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.features.discussions}
                onChange={() => toggleFilter('features', 'discussions')}
                className="form-checkbox"
              />
              <span>Active Discussions</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.features.mentorship}
                onChange={() => toggleFilter('features', 'mentorship')}
                className="form-checkbox"
              />
              <span>Mentorship Program</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.features.resources}
                onChange={() => toggleFilter('features', 'resources')}
                className="form-checkbox"
              />
              <span>Learning Resources</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">Community Age</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.engagement.newbie}
                onChange={() => toggleFilter('engagement', 'newbie')}
                className="form-checkbox"
              />
              <span>New Communities (<3 months)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.engagement.established}
                onChange={() => toggleFilter('engagement', 'established')}
                className="form-checkbox"
              />
              <span>Established (3-12 months)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.engagement.veteran}
                onChange={() => toggleFilter('engagement', 'veteran')}
                className="form-checkbox"
              />
              <span>Veteran (>1 year)</span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSortOptions = () => (
    <select
      className="bg-surface-blur text-text-secondary px-4 py-2 rounded-full text-sm"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
    >
      <option value="recommended">Recommended for You</option>
      <option value="popular">Most Popular</option>
      <option value="trending">Trending</option>
      <option value="mostActive">Most Active</option>
      <option value="newest">Newest</option>
      <option value="closest">Closest to You</option>
    </select>
  );

  const renderQuickFilters = () => (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('trending')}
      >
        <TrendingUp size={14} className="inline-block mr-1" />
        Trending Now
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('newToday')}
      >
        <Zap size={14} className="inline-block mr-1" />
        New Today
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('nearMe')}
      >
        <Target size={14} className="inline-block mr-1" />
        Near Me
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('mostActive')}
      >
        <Activity size={14} className="inline-block mr-1" />
        Most Active
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('openToAll')}
      >
        <UserCheck size={14} className="inline-block mr-1" />
        Open to All
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('withEvents')}
      >
        <Calendar size={14} className="inline-block mr-1" />
        With Events
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('activeDiscussions')}
      >
        <MessageSquare size={14} className="inline-block mr-1" />
        Active Discussions
      </button>
      <button
        className="px-3 py-1 rounded-full bg-surface-blur text-text-secondary text-sm whitespace-nowrap hover:bg-accent-1 hover:text-primary transition-all"
        onClick={() => quickFilter('featured')}
      >
        <Award size={14} className="inline-block mr-1" />
        Featured
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-gradient-to-r from-accent-1 to-accent-2 mb-4">
          Discover Communities
        </h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-text-secondary" size={20} />
          <input 
            type="text" 
            placeholder="Search communities, events, or interests..." 
            className="input-neon w-full pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {renderQuickFilters()}

        <div className="flex items-center gap-3 mb-4">
          <button
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              showFilters ? 'bg-accent-1 text-primary' : 'bg-surface-blur text-text-secondary'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} className="inline-block mr-2" />
            Filters
          </button>

          <div className="flex-1 overflow-x-auto flex gap-2 scrollbar-hide">
            {selectedCategories.map(catId => {
              const category = categories.find(c => c.id === catId);
              if (!category) return null;
              return (
                <button
                  key={category.id}
                  className="px-3 py-1 rounded-full bg-accent-1 text-primary text-sm flex items-center gap-1 whitespace-nowrap"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                  <X size={14} />
                </button>
              );
            })}
          </div>

          {renderSortOptions()}
        </div>

        {showFilters && renderFilterPanel()}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-accent-1">Loading communities...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="glass-panel overflow-hidden"
            >
              <Link to={`/community/${community.id}`}>
                <div 
                  className="h-40 w-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${community.cover_image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/90"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading text-xl text-white">{community.name}</h3>
                    {community.city && community.country && (
                      <div className="flex items-center text-text-secondary text-sm mt-1">
                        <MapPin size={14} className="mr-1" />
                        {community.city}, {community.country}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {community.community_categories?.map(({ categories }) => (
                      <span
                        key={categories.id}
                        className="px-2 py-1 bg-surface-blur rounded-full text-xs text-text-secondary"
                      >
                        {categories.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-text-secondary">
                      <Users size={16} className="mr-1" />
                      <span>{community.community_members_count} members</span>
                    </div>
                    <div className="flex items-center text-accent-2">
                      <Calendar size={16} className="mr-1" />
                      <span>{community.events?.length || 0} upcoming events</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold mb-2">No communities found</h3>
          <p className="text-text-secondary">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </>
  );
};

export default DiscoverPage;