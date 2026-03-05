import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Wifi, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_SPOTS = [
    {
        id: 1,
        name: "Yash's Home WiFi",
        location: "Pune, MH",
        price: 50,
        rating: 4.8,
        speed: 100,
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1000",
        amenities: ["AC", "Coffee"],
    },
    {
        id: 2,
        name: "Cafe Coffee Day",
        location: "Mumbai, MH",
        price: 80,
        rating: 4.5,
        speed: 150,
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000",
        amenities: ["Seating", "Power"],
    },
    {
        id: 3,
        name: "Library Public Access",
        location: "Pune, MH",
        price: 30,
        rating: 4.2,
        speed: 50,
        image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1000",
        amenities: ["Quiet", "Books"],
    },
];

export const FeaturedSpots = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <section className="w-full py-24 bg-white dark:bg-[#050511] text-gray-900 dark:text-white overflow-hidden">
            <div className="container max-w-7xl mx-auto px-6 md:px-8">
                {/* Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 28 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
                >
                    <div>
                        <span className="inline-block rounded-full bg-[#0055FF] px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider mb-5">
                            Ecosystem
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                            Connect to the<br />best spots near you.
                        </h2>
                    </div>
                    <Button className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full px-7 py-6 text-base font-bold shrink-0 transition-all duration-300">
                        View Map <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </motion.div>

                {/* Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MOCK_SPOTS.map((spot, i) => (
                        <motion.div
                            key={spot.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.1 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <Card className="bg-white dark:bg-[#0d0d20] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-hidden hover:border-[#0055FF]/60 transition-all duration-300 group rounded-3xl h-full flex flex-col">
                                <div className="relative h-48 overflow-hidden shrink-0">
                                    <img
                                        src={spot.image}
                                        alt={spot.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 dark:from-[#0d0d20]/60 to-transparent" />
                                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center text-[#66FF00]">
                                        <Wifi className="w-3 h-3 mr-1.5" strokeWidth={2.5} /> {spot.speed} Mbps
                                    </div>
                                </div>

                                <CardContent className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h3 className="text-lg font-bold truncate pr-2">{spot.name}</h3>
                                        <div className="flex items-center text-yellow-400 font-bold text-sm shrink-0">
                                            <Star className="w-3.5 h-3.5 fill-current mr-1" /> {spot.rating}
                                        </div>
                                    </div>
                                    <div className="flex items-center text-gray-500 dark:text-gray-500 mb-4 text-sm">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {spot.location}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {spot.amenities.map((am, j) => (
                                            <Badge key={j} variant="secondary" className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-white/10 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/10">
                                                {am}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="p-5 pt-0 flex justify-between items-center border-t border-gray-200 dark:border-white/5">
                                    <div>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">₹{spot.price}</span>
                                        <span className="text-gray-600 dark:text-gray-600 text-xs ml-1">/hour</span>
                                    </div>
                                    <Button className="rounded-full bg-[#0055FF] hover:bg-[#0044CC] text-sm font-bold px-5 h-9 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300">
                                        Book Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
