import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HowItWorks } from '@/components/Home/HowItWorks';

const HowItWorksPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <Navbar />
            <HowItWorks standalone={true} />
            <Footer />
        </div>
    );
};

export default HowItWorksPage;
