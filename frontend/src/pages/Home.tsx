import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/Home/Hero';
import { StatsSection } from '../components/Home/StatsBar';
import { FeaturedSpots } from '../components/Home/FeaturedSpots';
import { HowItWorks } from '../components/Home/HowItWorks';
import { Testimonials } from '../components/Home/Testimonials';
import { Features } from '../components/Home/Features';
import { Footer } from '../components/layout/Footer';

const Home = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            <Navbar />
            <Hero />
            <StatsSection />
            <HowItWorks />
            <Features />
            <FeaturedSpots />
            <Testimonials />
            <Footer />
        </div>
    );
};

export default Home;
