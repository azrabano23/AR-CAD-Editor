import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';
import HomePage from './pages/HomePage';
import ConvertPage from './pages/ConvertPage';
import Navigation from './components/Navigation';
import { theme } from './styles/theme';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: linear-gradient(135deg, #0a0f0a 0%, #1a2e1a 100%);
    color: #ffffff;
    overflow-x: hidden;
    line-height: 1.6;
  }

  html, body, #root {
    height: 100%;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #00ff88, #004d2a);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #00cc70, #003d22);
  }
`;

const AppContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0f0a 0%, #1a2e1a 100%);
  position: relative;
  overflow-x: hidden;
`;

const BackgroundPattern = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(0, 77, 42, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(0, 204, 112, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BackgroundPattern />
          <ContentWrapper>
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/convert" element={<ConvertPage />} />
            </Routes>
          </ContentWrapper>
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;
