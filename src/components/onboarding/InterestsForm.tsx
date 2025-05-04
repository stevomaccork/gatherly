import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabaseClient';
import { MapPin, Search } from 'lucide-react';
import type { Category } from '../../utils/supabaseClient';

interface InterestsFormProps {
  userId: string;
  onComplete: () => void;
}

const InterestsForm: React.FC<InterestsFormProps> = ({ userId, onComplete }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selectedInterests,
          country,
          city,
        })
        .eq('id', userId);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-heading mb-2">Tell us about yourself</h2>
        <p className="text-text-secondary mb-6">
          This helps us personalize your experience and recommend communities you'll love.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-4">
              What are your interests?
            </label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search interests..."
                className="input-neon w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedInterests.includes(category.id)
                      ? 'bg-accent-1 text-primary'
                      : 'bg-surface-blur text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => toggleInterest(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Where are you located?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading || selectedInterests.length === 0}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default InterestsForm;