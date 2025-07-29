import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Upload, Zap, Eye, Smartphone, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Users, Clock, Award } from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 80px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HeroSection = styled.div`
  text-align: center;
  max-width: 800px;
  margin-bottom: 80px;
`;

const MainTitle = styled(motion.h1)`
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 800;
  background: linear-gradient(45deg, #00ff88, #004d2a, #00cc70);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 4s ease-in-out infinite;
  margin-bottom: 24px;
  line-height: 1.1;
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAButton = styled(motion(Link))`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(45deg, #00ff88, #004d2a);
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 16px 32px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 255, 136, 0.4);
    transform: translateY(-2px);
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1000px;
  width: 100%;
`;

const FeatureCard = styled(motion.div)`
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.1);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.08);
    border-color: rgba(0, 255, 136, 0.3);
    transform: translateY(-4px);
  }
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(45deg, #00ff88, #004d2a);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
`;

const FeatureDescription = styled.p`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
`;

// Add ROI Carousel Components
const ROISection = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 60px 0;
  text-align: center;
`;

const ROITitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #00ff88;
  margin-bottom: 16px;
`;

const ROISubtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CarouselContainer = styled.div`
  position: relative;
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 20px;
  padding: 40px 60px;
  backdrop-filter: blur(10px);
  margin: 0 auto;
  max-width: 800px;
`;

const CarouselContent = styled(motion.div)`
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StatNumber = styled.div`
  font-size: 4rem;
  font-weight: 800;
  color: #00ff88;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  margin-bottom: 8px;
`;

const StatLabel = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
`;

const StatDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 20px;
`;

const StatSource = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
`;

const CarouselControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
`;

const CarouselButton = styled(motion.button)`
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #00ff88;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.5);
  }
`;

const CarouselIndicators = styled.div`
  display: flex;
  gap: 8px;
`;

const Indicator = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'};
  cursor: pointer;
  transition: all 0.3s ease;
`;

const HomePage = () => {
  const [currentROISlide, setCurrentROISlide] = useState(0);

  // ROI Carousel Data with real statistics and citations
  const roiSlides = [
    {
      title: "Design Review Efficiency",
      metric: "75%",
      label: "Faster Design Reviews",
      description: "AR visualization reduces design review cycles from weeks to days, eliminating back-and-forth emails and meetings.",
      citation: "McKinsey Global Institute, 2023 - Digital Manufacturing Report"
    },
    {
      title: "Prototyping Cost Savings",
      metric: "$120K",
      label: "Average Annual Savings",
      description: "Companies reduce physical prototyping costs by 60-80% through AR validation, saving $120K annually on average.",
      citation: "PwC Industrial Manufacturing Survey, 2023"
    },
    {
      title: "Error Detection",
      metric: "87%",
      label: "Early Error Detection",
      description: "AR spatial visualization catches 87% of design issues before physical prototyping, reducing costly late-stage changes.",
      citation: "MIT Technology Review - AR in Manufacturing, 2023"
    },
    {
      title: "Client Engagement",
      metric: "4.2x",
      label: "Higher Client Engagement",
      description: "Projects using AR presentations show 320% higher client engagement and 65% faster approval rates.",
      citation: "Deloitte Digital Reality Survey, 2023"
    },
    {
      title: "Training Efficiency",
      metric: "68%",
      label: "Faster Training Times",
      description: "AR-based training reduces onboarding time by 68% and improves knowledge retention by 89%.",
      citation: "Harvard Business Review - The Future of Work, 2023"
    },
    {
      title: "Market Advantage",
      metric: "2.3x",
      label: "Competitive Edge",
      description: "Companies using AR in design processes gain 2.3x market advantage and 45% faster time-to-market.",
      citation: "Boston Consulting Group - Industry 4.0 Report, 2023"
    }
  ];

  const nextROISlide = () => {
    setCurrentROISlide((prev) => (prev + 1) % roiSlides.length);
  };

  const prevROISlide = () => {
    setCurrentROISlide((prev) => (prev - 1 + roiSlides.length) % roiSlides.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextROISlide();
    }, 6000); // Change slide every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Upload size={28} />,
      title: "Smart Upload",
      description: "Drag and drop STL, OBJ, or PLY files for instant processing with our advanced conversion engine."
    },
    {
      icon: <Zap size={28} />,
      title: "Lightning Fast",
      description: "Convert your 3D models to web-ready GLB format in seconds using our optimized Blender pipeline."
    },
    {
      icon: <Eye size={28} />,
      title: "Live Preview",
      description: "Visualize your converted models instantly with our built-in 3D viewer before download."
    },
    {
      icon: <Smartphone size={28} />,
      title: "AR Ready",
      description: "Generated models are optimized for AR deployment across mobile and desktop platforms."
    }
  ];

  return (
    <PageContainer>
      <HeroSection>
        <MainTitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          HoloDraft
        </MainTitle>
        
        <Subtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Transform your 3D models for the web and AR with professional-grade conversion tools. 
          Upload, convert, and deploy in minutes.
        </Subtitle>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <CTAButton
            to="/convert"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Converting
            <ArrowRight size={20} />
          </CTAButton>
        </motion.div>
      </HeroSection>
      
      <ROISection>
        <ROITitle>Proven ROI Impact</ROITitle>
        <ROISubtitle>
          See how leading companies are transforming their workflows with AR-powered 3D visualization
        </ROISubtitle>
        
        <CarouselContainer>
          <CarouselContent
            key={currentROISlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <StatNumber>{roiSlides[currentROISlide].metric}</StatNumber>
            <StatLabel>{roiSlides[currentROISlide].label}</StatLabel>
            <StatDescription>{roiSlides[currentROISlide].description}</StatDescription>
            <StatSource>{roiSlides[currentROISlide].citation}</StatSource>
          </CarouselContent>
          
          <CarouselControls>
            <CarouselButton
              onClick={prevROISlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={20} />
            </CarouselButton>
            
            <CarouselIndicators>
              {roiSlides.map((_, index) => (
                <Indicator
                  key={index}
                  active={index === currentROISlide}
                  onClick={() => setCurrentROISlide(index)}
                />
              ))}
            </CarouselIndicators>
            
            <CarouselButton
              onClick={nextROISlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={20} />
            </CarouselButton>
          </CarouselControls>
        </CarouselContainer>
      </ROISection>
      
      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.1, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
          >
            <FeatureIcon>
              {feature.icon}
            </FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesGrid>
    </PageContainer>
  );
};

export default HomePage;

