import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Clock, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Story } from './mockData';

interface StoryCardProps {
  story: Partial<Story>; // để tránh lỗi khi dữ liệu thiếu field
  variant?: 'default' | 'compact' | 'featured';
}

export function StoryCard({ story, variant = 'default' }: StoryCardProps) {
  const formatViews = (views?: number) => {
    if (!views) return '0';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

 if (variant === 'compact') {
  return (
    <Link to={`/story/${story.slug ?? ''}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex w-full overflow-hidden space-x-3">
            <img
              src={story.coverImage || 'https://via.placeholder.com/80x100?text=No+Image'}
              alt={story.title ?? 'Untitled'}
              className="w-16 h-20 object-cover rounded flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {story.title ?? 'Untitled'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {story.author ?? 'Unknown'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
               <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs">{story.rating?.toFixed(1) ?? '0.0'}</span>
                  <span className="text-xs text-muted-foreground">
                    ({story.ratingCount ?? 0})
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatViews(story.views)}</span>
                </div>
              </div>
              <Badge
                variant={story.status === 'Completed' ? 'default' : 'secondary'}
                className="mt-1 text-xs max-w-full truncate"
              >
                {story.status ?? 'Ongoing'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


  if (variant === 'featured') {
    return (
      <Link to={`/story/${story.slug ?? ''}`}>
        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <div className="relative">
            <img
              src={story.coverImage || 'https://via.placeholder.com/300x200?text=No+Image'}
              alt={story.title ?? 'Untitled'}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-lg font-bold mb-1">{story.title ?? 'Untitled'}</h3>
              <p className="text-sm opacity-90">{story.author ?? 'Unknown'}</p>
            </div>
          </div>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {story.description ?? ''}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">{story.rating?.toFixed(1) ?? '0.0'}</span>
                    <span className="text-xs text-muted-foreground">({story.ratingCount ?? 0})</span>

                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{formatViews(story.views)}</span>
                </div>
              </div>
              <Badge variant={story.status === 'Completed' ? 'default' : 'secondary'}>
                {story.status ?? 'Ongoing'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
  <Link to={`/story/${story.slug ?? ''}`}>
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex w-full overflow-hidden space-x-4">
          <img
            src={story.coverImage || 'https://via.placeholder.com/120x160?text=No+Image'}
            alt={story.title ?? 'Untitled'}
            className="w-20 h-28 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 truncate">
              {story.title ?? 'Untitled'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {story.author ?? 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {story.description ?? ''}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {(story.genres ?? []).slice(0, 3).map((genre, idx) => (
                <Badge key={idx} variant="outline" className="text-xs truncate">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                   <span className="text-sm">{story.rating?.toFixed(1) ?? '0.0'}</span>
                    <span className="text-xs text-muted-foreground">({story.ratingCount ?? 0})</span>

                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatViews(story.views)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(story.lastUpdated)}
                  </span>
                </div>
              </div>
              <Badge
                variant={story.status === 'Completed' ? 'default' : 'secondary'}
                className="flex items-center space-x-1 max-w-full truncate"
              >
                {story.status === 'Completed' && <CheckCircle className="h-3 w-3" />}
                <span>{story.status ?? 'Ongoing'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);
}
