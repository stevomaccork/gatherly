import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import type { Community } from '../utils/supabaseClient';

const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (community) {
        navigate(`/community/${community.id}`);
      }
    } catch (error: any) {
      alert('Error creating community: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Link to="/" className="flex items-center text-accent-1 hover:underline mb-6">
        <ChevronLeft size={16} />
        <span className="ml-1">Back to Discover</span>
      </Link>

      <div className="glass-panel p-6">
        <h1 className="text-3xl font-heading mb-6">Create a New Community</h1>
        
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
              Cover Image
            </label>
            <div className="relative">
              {previewUrl ? (
                <div className="relative w-full h-60 rounded-xl overflow-hidden mb-4">
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
                    className="absolute top-4 right-4 btn-icon bg-black/50"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-accent-1 rounded-xl p-12 text-center mb-4">
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
            <Link
              to="/"
              className="btn-secondary flex-1 text-center"
            >
              Cancel
            </Link>
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
    </motion.div>
  );
};

export default CreateCommunityPage;