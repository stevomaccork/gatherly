import React, { useState } from 'react';
import { Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';

interface SocialShareBarProps {
  url: string;
  title: string;
  description?: string;
}

const SocialShareBar: React.FC<SocialShareBarProps> = ({ url, title, description = '' }) => {
  const [copied, setCopied] = useState(false);
  
  // If no URL is provided, use the current page URL
  const shareUrl = url || window.location.href;
  
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };
  
  const handleTwitterShare = () => {
    const twitterText = description ? `${title} - ${description}` : title;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary mr-1">Share:</span>
      
      <button 
        onClick={handleFacebookShare}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
        aria-label="Share on Facebook"
      >
        <Facebook size={16} />
      </button>
      
      <button 
        onClick={handleTwitterShare}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity"
        aria-label="Share on Twitter"
      >
        <Twitter size={16} />
      </button>
      
      <button 
        onClick={handleCopyLink}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${copied ? 'bg-green-500' : 'bg-gray-700'} text-white hover:opacity-90 transition-all`}
        aria-label="Copy link"
      >
        {copied ? <Check size={16} /> : <LinkIcon size={16} />}
      </button>
      
      {copied && (
        <span className="text-xs text-green-500 animate-fade-in">Link copied!</span>
      )}
    </div>
  );
};

export default SocialShareBar; 