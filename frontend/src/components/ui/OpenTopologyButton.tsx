import React from 'react';
import styled from 'styled-components';

interface OpenTopologyButtonProps {
  onClick?: () => void;
  dark?: boolean;
}

const OpenTopologyButton: React.FC<OpenTopologyButtonProps> = ({ onClick, dark }) => {
  return (
    <StyledButton onClick={onClick} $dark={dark}>
      Open Topology
      <svg className="icon" viewBox="0 0 16 19" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z" 
        />
      </svg>
    </StyledButton>
  );
}

const StyledButton = styled.button<{ $dark?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 10;
  padding: 8px 16px;
  overflow: hidden;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: ${props => props.$dark ? '#22232a' : '#f3f4f6'};
  color: ${props => props.$dark ? '#f0f0f2' : '#17181c'};
  border: 1px solid ${props => props.$dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background: hsl(248, 53%, 58%); /* Match New Topology button */
    left: -100%;
    z-index: -10;
    transition: all 0.7s ease;
  }

  &:hover::before {
    left: 0;
    transform: scale(1.5);
  }

  &:hover {
    color: #ffffff; /* Contrast against purple background */
  }

  .icon {
    width: 20px;
    height: 20px;
    transform: rotate(45deg);
    transition: all 0.3s linear;
    border-radius: 50%;
    padding: 4px;
    border: 1px solid ${props => props.$dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
    fill: ${props => props.$dark ? '#d1d5db' : '#4b5563'};
  }

  &:hover .icon {
    transform: rotate(90deg);
    background: ${props => props.$dark ? '#22232a' : '#ffffff'};
    border-color: transparent;
    fill: ${props => props.$dark ? '#ffffff' : '#000000'};
  }
`;

export default OpenTopologyButton;
