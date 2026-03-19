import React, { useState, useEffect } from 'react';
import { Search, Image, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FREE_IMAGE_APIS = [
    {
        name: 'Unsplash',
        url: 'https://unsplash.com/s/photos/',
        api: 'https://api.unsplash.com/photos/random?client_id=YOUR_KEY&query={query}',
        desc: 'High-quality photos. Get API key free.',
        extension: true
    },
    {
        name: 'Pexels',
        url: 'https://www.pexels.com/search/{query}/',
        api: 'https://api.pexels.com/v1/search?query={query}',
        desc: 'Free stock photos/videos. API key free.',
        extension: true
    },
    {
        name: 'Pixabay',
        url: 'https://pixabay.com/images/search/{query}/',
        api: 'https://pixabay.com/api/?key=YOUR_KEY&q={query}',
        desc: 'Free images/illustrations. No attribution.',
        extension: true
    },
    {
        name: 'Lorem Picsum',
        url: 'https://picsum.photos/',
        api: 'https://picsum.photos/800/600?random={seed}',
        desc: 'Random placeholder images. No key.',
        extension: true
    },
    {
        name: 'Placeholder.com',
        url: 'https://placeholder.com/',
        api: 'https://via.placeholder.com/800x600/{color}/{textcolor}',
        desc: 'Custom placeholders. No key.',
        extension: true
    }
];

export function ImageGallery() {
    const [query, setQuery] = useState('nature');
    const [images, setImages] = useState([]);

    const fetchImages = async (api: string) => {
        try {
            const url = api.replace('{query}', query);
            const res = await fetch(url);
            const data = await res.json();
            setImages(data.photos || data.hits || [{ urls: { regular: url }, alt_description: 'Image' }]);
        } catch (e) {
            alert('Try getting free API key from site');
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    صور مجانية / Free Images
                </h2>
                <p>اختر موقع وافتح من الامتداد أو استخدم API</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {FREE_IMAGE_APIS.map((site) => (
                    <Card key={site.name} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="w-6 h-6" />
                                {site.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">{site.desc}</p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(site.url.replace('{query}', query), '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    افتح الموقع
                                </Button>
                                {site.api && (
                                    <Button
                                        size="sm"
                                        onClick={() => fetchImages(site.api)}
                                    >
                                        جرب API
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {images.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        نتائج البحث / Search Results
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.slice(0, 9).map((img: any, i) => (
                            <div key={i} className="group relative">
                                <img
                                    src={img.urls?.regular || img.previewURL || img.largeImageURL || img.src?.medium || img}
                                    alt={img.alt_description || 'Free image'}
                                    className="w-full h-48 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100"
                                    onClick={() => window.open(img.urls?.full || img.pageURL, '_blank')}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-center">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="اكتب كلمة البحث مثل: nature, tech, abstract"
                    className="max-w-md mx-auto font-mono"
                />
            </div>
        </div>
    );
}

