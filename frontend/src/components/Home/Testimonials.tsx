import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const REVIEWS = [
    {
        id: 1,
        name: "Yash Urade",
        role: "Host in Pune",
        content: "I've been hosting my extra bandwidth for 2 months now. The passive income covers my entire internet bill plus extra!",
        avatar: "YU",
        rating: 5
    },
    {
        id: 2,
        name: "Samiksha Musale",
        role: "Digital Nomad",
        content: "Much cheaper than hotel WiFi and way faster. The map makes it super easy to find spots when I'm working remotely.",
        avatar: "SM",
        rating: 5
    },
    {
        id: 3,
        name: "Spandan Mali",
        role: "Student",
        content: "Lifesaver during my exams. Found a quiet spot nearby with high-speed internet when my dorm wifi was down.",
        avatar: "SM",
        rating: 4
    }
];

export const Testimonials = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 bg-gray-50 border-t border-gray-100">
            <div className="container max-w-7xl mx-auto px-6 md:px-8">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 tracking-tight">Trusted by the community</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        See what our hosts and users are saying about the decentralized network.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {REVIEWS.map((review, i) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            whileHover={{ y: -8 }}
                        >
                            <Card className="h-full border-none shadow-lg shadow-gray-200/50 bg-white">
                                <CardContent className="p-8 flex flex-col h-full">
                                    <Quote className="w-8 h-8 text-blue-100 mb-4" />
                                    <p className="text-gray-600 mb-6 italic text-base leading-relaxed flex-grow">
                                        "{review.content}"
                                    </p>
                                    
                                    <div className="flex items-center gap-4 mt-auto">
                                        <Avatar className="h-12 w-12 border-2 border-blue-100">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`} />
                                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{review.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-black">{review.name}</h4>
                                            <p className="text-sm text-gray-500">{review.role}</p>
                                        </div>
                                        <div className="ml-auto flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};