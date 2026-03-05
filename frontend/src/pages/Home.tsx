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
        <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
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
