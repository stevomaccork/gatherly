import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Community, Category } from '../utils/supabaseClient';
import { X, MapPin } from 'lucide-react';

interface CommunityFormProps {
  onCommunityCreated: (community: Community) => void;
  onClose: () => void;
}

const CommunityForm: React.FC<CommunityFormProps> = ({ onCommunityCreated, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a community name.');
      return;
    }

    setUploading(true);

    try {
      let coverImageUrl = null;

      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('community-covers')
          .upload(filePath, coverImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('community-covers')
          .getPublicUrl(filePath);

        coverImageUrl = data.publicUrl;
      }

      const { data: community, error: insertError } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          cover_image: coverImageUrl,
          country,
          city,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (community && selectedCategories.length > 0) {
        const categoryLinks = selectedCategories.map(categoryId => ({
          community_id: community.id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from('community_categories')
          .insert(categoryLinks);

        if (categoryError) throw categoryError;
      }

      if (community) {
        onCommunityCreated(community);
      }
    } catch (error: any) {
      alert('Error creating community: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter(cat => cat.parent_id === parentId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-lg relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-heading mb-6">Create a New Community</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-2">
                Community Name
              </label>
              <input
                type="text"
                id="name"
                className="input-neon w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                id="description"
                className="input-neon w-full min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Categories
              </label>
              <div className="space-y-4">
                {mainCategories.map(mainCat => (
                  <div key={mainCat.id}>
                    <button
                      type="button"
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
                          type="button"
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
              <label className="block text-sm font-bold mb-2">
                Location
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

            <div>
              <label className="block text-sm font-bold mb-2">
                Cover Image
              </label>
              <div className="relative">
                {previewUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4">
                    <img 
                      src={previewUrl} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 btn-icon bg-black/50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-accent-1 rounded-xl p-8 text-center mb-4">
                    <input
                      type="file"
                      id="coverImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="coverImage"
                      className="cursor-pointer text-accent-1 hover:text-accent-2 transition-colors"
                    >
                      Click to upload cover image
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={uploading}
              >
                {uploading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityForm;