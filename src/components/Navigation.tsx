import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Box, Home, Upload } from 'lucide-react';

const NavContainer = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
`;

const LogoIcon = styled(Box)`
  color: #00ff88;
  filter: drop-shadow(0 0 10px rgba(0, 255, 136, 0.4));
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #00ff88;
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    color: #00ff88;
    background: rgba(0, 255, 136, 0.1);
  }
`;

const Navigation = () => {
  return (
    <NavContainer
      initial={{ y: -70 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Logo>
        <LogoIcon size={32} />
        HoloDraft
      </Logo>
      
      <NavItems>
        <NavItem to="/" end>
          <Home size={18} />
          Home
        </NavItem>
        <NavItem to="/convert">
          <Upload size={18} />
          Convert
        </NavItem>
      </NavItems>
    </NavContainer>
  );
};

export default Navigation;
